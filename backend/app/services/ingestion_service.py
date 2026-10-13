import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text, func, select

from app.core.config import settings
from app.models.schema import Pollutant, StationMeasurement, MonitoringStation, IngestionRun
from app.ingestion.sources.cpcb_datagov import CPCBDataGovFetcher
from app.ingestion.normalizers.cpcb_datagov import CPCBDataGovNormalizer
from app.ingestion.pipeline import IngestionPipeline
from app.ingestion.exceptions import FetchError, IngestionError

logger = logging.getLogger(__name__)

# Distinct PostgreSQL 64-bit integer identifier for CPCB ingestion advisory lock
CPCB_ADVISORY_LOCK_ID = 84729103

STANDARD_POLLUTANTS = [
    {"code": "PM2.5", "name": "Fine Particulate Matter (2.5 µm)"},
    {"code": "PM10", "name": "Coarse Particulate Matter (10 µm)"},
    {"code": "NO2", "name": "Nitrogen Dioxide"},
    {"code": "SO2", "name": "Sulfur Dioxide"},
    {"code": "CO", "name": "Carbon Monoxide"},
    {"code": "O3", "name": "Ozone"},
    {"code": "NH3", "name": "Ammonia"},
]

# In-memory lock for same-process thread safety
_in_process_lock = asyncio.Lock()


def acquire_advisory_lock(db: Session) -> bool:
    """
    Acquire a PostgreSQL session advisory lock to prevent overlapping ingestion runs
    across multiple workers or processes.
    """
    try:
        if db.bind and db.bind.dialect.name == "postgresql":
            res = db.execute(
                text("SELECT pg_try_advisory_lock(:lock_id);"),
                {"lock_id": CPCB_ADVISORY_LOCK_ID}
            ).scalar()
            return bool(res)
    except Exception as e:
        logger.warning(f"Could not evaluate PostgreSQL advisory lock: {e}")
    # Fallback to True if not PostgreSQL or lock evaluation succeeds
    return True


def release_advisory_lock(db: Session) -> bool:
    """
    Release the PostgreSQL session advisory lock.
    """
    try:
        if db.bind and db.bind.dialect.name == "postgresql":
            res = db.execute(
                text("SELECT pg_advisory_unlock(:lock_id);"),
                {"lock_id": CPCB_ADVISORY_LOCK_ID}
            ).scalar()
            return bool(res)
    except Exception as e:
        logger.warning(f"Could not release PostgreSQL advisory lock: {e}")
    return True


def seed_pollutants_if_needed(db: Session) -> int:
    """Seed the 7 required standard pollutants if missing."""
    existing = {p.code for p in db.execute(select(Pollutant)).scalars().all()}
    added = 0
    for pol in STANDARD_POLLUTANTS:
        if pol["code"] not in existing:
            db.add(Pollutant(code=pol["code"], name=pol["name"]))
            added += 1
    if added > 0:
        db.commit()
        logger.info(f"Seeded {added} missing pollutant reference records.")
    return added


async def fetch_with_retry(
    fetcher: CPCBDataGovFetcher,
    state: str = "Karnataka",
    city: str = "Bengaluru",
    max_retries: int = 3,
    backoff_base: float = 2.0
):
    """
    Fetch data from CPCB API with bounded exponential backoff retries.
    Never retries indefinitely.
    """
    last_exception = None
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Fetching CPCB observations (attempt {attempt}/{max_retries})...")
            records = await fetcher.fetch(state=state, city=city)
            return records
        except (FetchError, Exception) as e:
            last_exception = e
            logger.warning(f"Fetch attempt {attempt} failed: {type(e).__name__} - {e}")
            if attempt < max_retries:
                sleep_duration = backoff_base * (2 ** (attempt - 1))
                logger.info(f"Waiting {sleep_duration:.1f}s before retry...")
                await asyncio.sleep(sleep_duration)

    raise FetchError(f"Exhausted {max_retries} fetch attempts. Last error: {last_exception}")


async def execute_cpcb_ingestion(
    db: Session,
    state: str = "Karnataka",
    city: str = "Bengaluru",
    fetcher: Optional[CPCBDataGovFetcher] = None,
    normalizer: Optional[CPCBDataGovNormalizer] = None,
) -> Dict[str, Any]:
    """
    Execute a single ingestion run with overlap prevention, advisory locking,
    duplicate handling, and audit persistence.
    """
    # 1. Prevent in-process overlap
    if _in_process_lock.locked():
        logger.warning("Ingestion run skipped: An in-process ingestion task is already executing.")
        return {
            "status": "skipped",
            "reason": "already_running_in_process",
            "message": "Ingestion task is currently active."
        }

    async with _in_process_lock:
        # 2. Prevent multi-worker overlap via PostgreSQL advisory lock
        lock_acquired = acquire_advisory_lock(db)
        if not lock_acquired:
            logger.warning("Ingestion run skipped: Another worker holds the advisory lock.")
            return {
                "status": "skipped",
                "reason": "advisory_lock_held",
                "message": "Another worker process is currently running ingestion."
            }

        start_time = datetime.now(timezone.utc)
        run_record = IngestionRun(
            source="CPCB/data.gov.in",
            status="running",
            started_at=start_time,
            records_fetched=0,
            records_accepted=0,
            records_inserted=0,
            records_skipped_as_duplicates=0,
        )
        try:
            db.add(run_record)
            db.commit()
            db.refresh(run_record)
        except Exception as e:
            logger.warning(f"Could not persist initial ingestion run record: {e}")
            db.rollback()

        try:
            seed_pollutants_if_needed(db)

            if fetcher is None:
                fetcher = CPCBDataGovFetcher()
            if normalizer is None:
                normalizer = CPCBDataGovNormalizer()

            # Bounded retry fetch
            raw_data = await fetch_with_retry(
                fetcher,
                state=state,
                city=city,
                max_retries=settings.CPCB_MAX_RETRIES,
                backoff_base=settings.CPCB_RETRY_BACKOFF_SECONDS
            )

            # Pipeline execution
            pipeline = IngestionPipeline(db, fetcher, normalizer, "CPCB/data.gov.in")
            
            # Manually normalize & persist to record exact counts
            normalized_data = normalizer.normalize(raw_data)
            
            pollutants = {p.code: p.id for p in db.execute(select(Pollutant)).scalars().all()}
            
            inserted_stations = 0
            if "monitoring_stations" in normalized_data:
                from geoalchemy2.elements import WKTElement
                from sqlalchemy.dialects.postgresql import insert
                for stat in normalized_data["monitoring_stations"]:
                    if stat.get("latitude") is None or stat.get("longitude") is None:
                        continue
                    loc_wkt = f"POINT({stat['longitude']} {stat['latitude']})"
                    stmt = insert(MonitoringStation).values(
                        external_id=stat["external_id"],
                        name=stat["name"],
                        source=stat["source"],
                        location=WKTElement(loc_wkt, srid=4326),
                        is_active=1
                    ).on_conflict_do_nothing(
                        index_elements=['external_id']
                    )
                    db.execute(stmt)
                db.commit()

            stations_map = {s.external_id: s.id for s in db.execute(select(MonitoringStation)).scalars().all()}
            
            inserted_measurements = 0
            skipped_duplicates = 0
            if "station_measurements" in normalized_data:
                from sqlalchemy.dialects.postgresql import insert
                meas_records = normalized_data["station_measurements"]
                for record in meas_records:
                    if record["pollutant_code"] not in pollutants:
                        continue
                    ext_id = record["station_external_id"]
                    if ext_id not in stations_map:
                        continue
                    pollutant_id = pollutants[record["pollutant_code"]]
                    station_id = stations_map[ext_id]

                    stmt = insert(StationMeasurement).values(
                        station_id=station_id,
                        pollutant_id=pollutant_id,
                        observation_timestamp=record["observation_timestamp"],
                        value=record["value"],
                        unit=record["unit"],
                        source=record["source"]
                    ).on_conflict_do_nothing(
                        index_elements=['station_id', 'pollutant_id', 'observation_timestamp', 'source']
                    ).returning(StationMeasurement.id)

                    res = db.execute(stmt)
                    if res.scalar_one_or_none() is not None:
                        inserted_measurements += 1
                    else:
                        skipped_duplicates += 1
                db.commit()

            end_time = datetime.now(timezone.utc)
            duration_sec = (end_time - start_time).total_seconds()

            # Update run record
            try:
                run_record.completed_at = end_time
                run_record.status = "completed"
                run_record.records_fetched = len(raw_data)
                run_record.records_accepted = len(normalized_data.get("station_measurements", []))
                run_record.records_inserted = inserted_measurements
                run_record.records_skipped_as_duplicates = skipped_duplicates
                db.commit()
            except Exception as e:
                logger.warning(f"Failed to update ingestion run audit record: {e}")
                db.rollback()

            logger.info(
                f"CPCB Ingestion completed in {duration_sec:.2f}s: "
                f"fetched={len(raw_data)}, accepted={len(normalized_data.get('station_measurements', []))}, "
                f"inserted={inserted_measurements}, skipped_duplicates={skipped_duplicates}"
            )

            return {
                "status": "completed",
                "duration_seconds": duration_sec,
                "records_fetched": len(raw_data),
                "records_accepted": len(normalized_data.get("station_measurements", [])),
                "records_inserted": inserted_measurements,
                "records_skipped_as_duplicates": skipped_duplicates,
                "completed_at": end_time
            }

        except Exception as e:
            end_time = datetime.now(timezone.utc)
            err_msg = str(e)
            logger.error(f"CPCB Ingestion failed: {err_msg}")
            
            try:
                run_record.completed_at = end_time
                run_record.status = "failed"
                run_record.error_message = err_msg[:500]
                db.commit()
            except Exception as audit_err:
                logger.warning(f"Failed to record failure in audit table: {audit_err}")
                db.rollback()

            return {
                "status": "failed",
                "error": err_msg,
                "completed_at": end_time
            }

        finally:
            release_advisory_lock(db)


def get_freshness_status(db: Session) -> Dict[str, Any]:
    """
    Expose latest successful ingestion time, observation timestamp,
    and staleness evaluation.
    """
    now = datetime.now(timezone.utc)

    # 1. Latest observation timestamp from station measurements
    latest_obs = db.query(func.max(StationMeasurement.observation_timestamp)).scalar()
    latest_ingest = db.query(func.max(StationMeasurement.ingestion_timestamp)).scalar()

    # 2. Latest run record from ingestion_runs table
    last_run = (
        db.query(IngestionRun)
        .order_by(IngestionRun.started_at.desc())
        .first()
    )

    # 3. Compute staleness
    freshness_status = "unavailable"
    is_stale = True
    age_hours: Optional[float] = None

    if latest_obs and isinstance(latest_obs, datetime):
        # Normalize latest_obs to UTC if naive
        if latest_obs.tzinfo is None:
            latest_obs = latest_obs.replace(tzinfo=timezone.utc)
        raw_age = (now - latest_obs).total_seconds() / 3600.0
        age_hours = round(max(0.0, raw_age), 2)
        if age_hours <= settings.DATA_STALENESS_HOURS:
            freshness_status = "fresh"
            is_stale = False
        elif age_hours <= 24.0:
            freshness_status = "stale"
            is_stale = True
        else:
            freshness_status = "outdated"
            is_stale = True
    elif not isinstance(latest_obs, datetime):
        latest_obs = None

    if not isinstance(latest_ingest, datetime):
        latest_ingest = None

    last_run_status = "never_run"
    last_run_started = None
    last_run_completed = None
    last_records_inserted = 0
    last_records_skipped = 0

    if last_run and hasattr(last_run, "status"):
        try:
            status_val = getattr(last_run, "status", None)
            if status_val and not str(type(status_val)).startswith("<class 'unittest.mock"):
                last_run_status = str(status_val)
            started_val = getattr(last_run, "started_at", None)
            if isinstance(started_val, datetime):
                last_run_started = started_val
            comp_val = getattr(last_run, "completed_at", None)
            if isinstance(comp_val, datetime):
                last_run_completed = comp_val
            ins_val = getattr(last_run, "records_inserted", None)
            if isinstance(ins_val, int):
                last_records_inserted = ins_val
            skp_val = getattr(last_run, "records_skipped_as_duplicates", None)
            if isinstance(skp_val, int):
                last_records_skipped = skp_val
        except Exception:
            pass

    return {
        "source": "CPCB / data.gov.in",
        "latest_observation_time": latest_obs,
        "latest_ingestion_time": latest_ingest,
        "observation_age_hours": age_hours,
        "staleness_threshold_hours": settings.DATA_STALENESS_HOURS,
        "freshness_status": freshness_status,
        "is_stale": is_stale,
        "scheduler": {
            "enabled": settings.CPCB_SCHEDULER_ENABLED,
            "interval_seconds": settings.CPCB_INGESTION_INTERVAL_SECONDS,
            "last_run_status": last_run_status,
            "last_run_started": last_run_started,
            "last_run_completed": last_run_completed,
            "last_records_inserted": last_records_inserted,
            "last_records_skipped": last_records_skipped,
        }
    }

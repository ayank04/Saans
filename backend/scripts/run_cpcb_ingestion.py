import sys
import asyncio
import logging
from pathlib import Path
from datetime import datetime, timezone

# Add backend to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.database import SessionLocal, engine
from app.models.schema import Pollutant, MonitoringStation, StationMeasurement
from app.ingestion.sources.cpcb_datagov import CPCBDataGovFetcher
from app.ingestion.normalizers.cpcb_datagov import CPCBDataGovNormalizer
from app.ingestion.pipeline import IngestionPipeline
from sqlalchemy import select
from sqlalchemy.exc import OperationalError

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

STANDARD_POLLUTANTS = [
    {"code": "PM2.5", "name": "Fine Particulate Matter (2.5 µm)"},
    {"code": "PM10", "name": "Coarse Particulate Matter (10 µm)"},
    {"code": "NO2", "name": "Nitrogen Dioxide"},
    {"code": "SO2", "name": "Sulfur Dioxide"},
    {"code": "CO", "name": "Carbon Monoxide"},
    {"code": "O3", "name": "Ozone"},
    {"code": "NH3", "name": "Ammonia"}
]

def seed_pollutants_if_needed(db):
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

async def main():
    try:
        db = SessionLocal()
        # Test connection
        db.execute(select(1))
    except (OperationalError, Exception) as e:
        logger.error(f"PostgreSQL/PostGIS is not reachable at the configured DATABASE_URL: {e}")
        print("\n[BLOCKER] Database is currently unavailable. To enable persistence:")
        print("1. Start a PostgreSQL database with PostGIS enabled on localhost:5432 (or set DATABASE_URL in .env).")
        print("2. Run 'alembic upgrade head' to apply the schema.")
        print("3. Re-run this ingestion script.\n")
        return

    try:
        seed_pollutants_if_needed(db)
        
        fetcher = CPCBDataGovFetcher()
        normalizer = CPCBDataGovNormalizer()
        pipeline = IngestionPipeline(db, fetcher, normalizer, "CPCB/data.gov.in")
        
        logger.info("Executing CPCB ingestion for Bengaluru, Karnataka...")
        result = await pipeline.run(state="Karnataka", city="Bengaluru")
        
        print("\n--- CPCB Ingestion Summary ---")
        print(f"Status: {result.status}")
        print(f"Records Fetched: {result.records_fetched}")
        print(f"Records Accepted: {result.records_accepted}")
        print(f"Records Inserted: {result.records_inserted}")
        print(f"Records Skipped as Duplicates: {result.records_skipped_as_duplicates}")
        if result.errors:
            print(f"Errors: {result.errors}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())

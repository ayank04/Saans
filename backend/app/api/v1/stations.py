import logging
import re
import struct
from collections import defaultdict
from typing import Dict, List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, SQLAlchemyError

from app.db.database import get_db
from app.models.schema import MonitoringStation, StationMeasurement, Pollutant
from app.schemas.station import PollutantReading, StationResponse, StationListResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stations", tags=["stations"])


def extract_coordinates(location) -> Tuple[Optional[float], Optional[float]]:
    """
    Safely extract (longitude, latitude) from a GeoAlchemy2 Geometry column.
    Supports WKBElement bytes, WKTElement string, or string representation.
    Returns (None, None) if location is missing, null, or malformed.
    """
    if location is None:
        return None, None

    try:
        data = getattr(location, "data", None)
        
        # GeoAlchemy2 WKBElement (raw bytes)
        if isinstance(data, (bytes, bytearray)):
            b = bytes(data)
            if len(b) >= 21:
                endian = "<" if b[0] == 1 else ">"
                geom_type = struct.unpack(endian + "I", b[1:5])[0]
                offset = 9 if (geom_type & 0x20000000) else 5
                lon, lat = struct.unpack(endian + "dd", b[offset:offset + 16])
                return float(lon), float(lat)

        # WKT string or WKTElement (e.g. 'POINT(77.6234 12.9176)')
        str_val = str(data if data is not None else location)
        if "POINT" in str_val.upper():
            clean = re.sub(r"[^\d\.\-\s]", " ", str_val).strip()
            parts = clean.split()
            if len(parts) >= 2:
                return float(parts[0]), float(parts[1])
    except Exception as e:
        logger.warning(f"Error parsing coordinates from geometry: {e}")

    return None, None


@router.get("", response_model=StationListResponse)
def get_stations(
    limit: int = Query(50, ge=1, le=200, description="Maximum number of stations to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db)
):
    """
    Retrieve live monitoring stations with their latest pollutant observations.
    
    Returns persisted real records from the database. Missing coordinates and
    pollutants are returned as None / omitted, never fabricated.
    """
    try:
        total = db.query(MonitoringStation).filter(MonitoringStation.is_active == 1).count()
        if total == 0:
            return StationListResponse(total=0, stations=[], is_live=True)

        stations_query = (
            db.query(MonitoringStation)
            .filter(MonitoringStation.is_active == 1)
            .order_by(MonitoringStation.id)
            .offset(offset)
            .limit(limit)
            .all()
        )

        station_ids = [s.id for s in stations_query]
        
        # Query measurements for these stations joined with Pollutant
        measurements_by_station: Dict[int, Dict[str, PollutantReading]] = defaultdict(dict)
        if station_ids:
            meas_records = (
                db.query(StationMeasurement, Pollutant.code)
                .join(Pollutant, StationMeasurement.pollutant_id == Pollutant.id)
                .filter(StationMeasurement.station_id.in_(station_ids))
                .order_by(StationMeasurement.observation_timestamp.desc())
                .all()
            )
            
            # Keep latest reading per pollutant for each station
            for meas, poll_code in meas_records:
                if poll_code not in measurements_by_station[meas.station_id]:
                    measurements_by_station[meas.station_id][poll_code] = PollutantReading(
                        code=poll_code,
                        value=meas.value,
                        unit=meas.unit,
                        observation_timestamp=meas.observation_timestamp,
                    )

        station_responses: List[StationResponse] = []
        for s in stations_query:
            lon, lat = extract_coordinates(s.location)
            pollutants = measurements_by_station.get(s.id, {})
            
            # Latest timestamp across pollutants or station update time
            latest_obs_time = None
            if pollutants:
                latest_obs_time = max(p.observation_timestamp for p in pollutants.values())
            elif s.updated_at:
                latest_obs_time = s.updated_at

            station_responses.append(
                StationResponse(
                    id=s.external_id,
                    name=s.name,
                    source=s.source,
                    latitude=lat,
                    longitude=lon,
                    pollutants=pollutants,
                    last_updated=latest_obs_time,
                    is_active=bool(s.is_active),
                    is_live=True
                )
            )

        from app.services.ingestion_service import get_freshness_status
        freshness = get_freshness_status(db)

        return StationListResponse(
            total=total,
            stations=station_responses,
            source="cpcb_datagov",
            is_live=True,
            latest_ingestion_time=freshness.get("latest_ingestion_time"),
            latest_observation_time=freshness.get("latest_observation_time"),
            data_freshness_status=freshness.get("freshness_status", "fresh"),
            is_stale=freshness.get("is_stale", False)
        )

    except OperationalError as e:
        logger.error(f"Database operational error in get_stations: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable. Real-time air quality observations cannot be loaded."
        )
    except SQLAlchemyError as e:
        logger.error(f"Database query error in get_stations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error querying monitoring stations."
        )


@router.get("/{station_id}", response_model=StationResponse)
def get_station_by_id(
    station_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieve single monitoring station by external ID with its latest pollutant observations.
    """
    try:
        station = (
            db.query(MonitoringStation)
            .filter(MonitoringStation.external_id == station_id)
            .first()
        )
        if not station:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Station with ID '{station_id}' not found."
            )

        lon, lat = extract_coordinates(station.location)
        
        meas_records = (
            db.query(StationMeasurement, Pollutant.code)
            .join(Pollutant, StationMeasurement.pollutant_id == Pollutant.id)
            .filter(StationMeasurement.station_id == station.id)
            .order_by(StationMeasurement.observation_timestamp.desc())
            .all()
        )

        pollutants: Dict[str, PollutantReading] = {}
        for meas, poll_code in meas_records:
            if poll_code not in pollutants:
                pollutants[poll_code] = PollutantReading(
                    code=poll_code,
                    value=meas.value,
                    unit=meas.unit,
                    observation_timestamp=meas.observation_timestamp,
                )

        latest_obs_time = (
            max(p.observation_timestamp for p in pollutants.values())
            if pollutants
            else station.updated_at
        )

        return StationResponse(
            id=station.external_id,
            name=station.name,
            source=station.source,
            latitude=lat,
            longitude=lon,
            pollutants=pollutants,
            last_updated=latest_obs_time,
            is_active=bool(station.is_active),
            is_live=True
        )

    except HTTPException:
        raise
    except OperationalError as e:
        logger.error(f"Database operational error in get_station_by_id: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable."
        )
    except SQLAlchemyError as e:
        logger.error(f"Database query error in get_station_by_id: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal error querying monitoring station."
        )

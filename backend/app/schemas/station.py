from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, ConfigDict

class PollutantReading(BaseModel):
    code: str
    value: float
    unit: str
    observation_timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class StationResponse(BaseModel):
    id: str
    name: str
    source: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    pollutants: Dict[str, PollutantReading] = {}
    last_updated: Optional[datetime] = None
    is_active: bool = True
    is_live: bool = True

    model_config = ConfigDict(from_attributes=True)

class StationListResponse(BaseModel):
    total: int
    stations: List[StationResponse]
    source: str = "cpcb_datagov"
    is_live: bool = True
    latest_ingestion_time: Optional[datetime] = None
    latest_observation_time: Optional[datetime] = None
    data_freshness_status: str = "fresh"  # "fresh", "stale", "outdated", "unavailable"
    is_stale: bool = False

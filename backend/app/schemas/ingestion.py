from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class SchedulerStatus(BaseModel):
    enabled: bool
    interval_seconds: int
    last_run_status: str
    last_run_started: Optional[datetime] = None
    last_run_completed: Optional[datetime] = None
    last_records_inserted: int = 0
    last_records_skipped: int = 0

    model_config = ConfigDict(from_attributes=True)


class IngestionStatusResponse(BaseModel):
    source: str
    latest_observation_time: Optional[datetime] = None
    latest_ingestion_time: Optional[datetime] = None
    observation_age_hours: Optional[float] = None
    staleness_threshold_hours: float
    freshness_status: str  # "fresh", "stale", "outdated", "unavailable"
    is_stale: bool
    scheduler: SchedulerStatus

    model_config = ConfigDict(from_attributes=True)


class IngestionTriggerResponse(BaseModel):
    status: str
    message: str
    details: Optional[Dict[str, Any]] = None

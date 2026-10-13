from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from datetime import datetime

@dataclass
class IngestionResult:
    source: str
    execution_start: datetime
    execution_end: Optional[datetime] = None
    records_fetched: int = 0
    records_accepted: int = 0
    records_rejected: int = 0
    records_inserted: int = 0
    records_skipped_as_duplicates: int = 0
    errors: List[str] = None
    status: str = "started"
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []

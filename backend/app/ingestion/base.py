from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseFetcher(ABC):
    @abstractmethod
    async def fetch(self, **kwargs) -> List[Dict[str, Any]]:
        """Fetch raw data from the external source."""
        pass

class BaseNormalizer(ABC):
    @abstractmethod
    def normalize(self, raw_data: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Normalize raw data into domain-specific structures."""
        pass

import httpx
from typing import List, Dict, Any
from app.ingestion.base import BaseFetcher
from app.ingestion.exceptions import FetchError, IngestionError
from app.core.config import settings

class CPCBDataGovFetcher(BaseFetcher):
    def __init__(self, base_url: str = "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"):
        self.base_url = base_url
        if not settings.DATA_GOV_IN_API_KEY:
            raise IngestionError("DATA_GOV_IN_API_KEY environment variable is missing.")

    async def fetch(self, state: str = "Karnataka", city: str = "Bengaluru", limit: int = 1000) -> List[Dict[str, Any]]:
        params = {
            "api-key": settings.DATA_GOV_IN_API_KEY,
            "format": "json",
            "offset": 0,
            "limit": limit,
            "filters[state]": state,
            "filters[city]": city
        }
        headers = {
            "User-Agent": "SAANS-Platform/1.0 (Hyperlocal Air Intelligence)",
            "Accept": "application/json"
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.base_url, params=params, headers=headers)
                if response.status_code in (401, 403):
                    raise FetchError(f"Authentication failed: {response.status_code}")
                if response.status_code == 429:
                    raise FetchError("Rate limit exceeded (HTTP 429)")
                response.raise_for_status()
                data = response.json()
                return data.get("records", [])
        except httpx.HTTPError as e:
            raise FetchError(f"Failed to fetch CPCB data: {e}")
        except ValueError as e:
            raise FetchError(f"Failed to parse JSON: {e}")

import httpx
from typing import List, Dict, Any
from app.ingestion.base import BaseFetcher
from app.ingestion.exceptions import FetchError, IngestionError
from app.core.config import settings

class OpenAQFetcher(BaseFetcher):
    def __init__(self, base_url: str = "https://api.openaq.org/v3"):
        self.base_url = base_url
        if not settings.OPENAQ_API_KEY:
            raise IngestionError("OPENAQ_API_KEY environment variable is missing.")

    async def fetch(self, coordinates: str = "12.9716,77.5946", radius: int = 25000, limit: int = 100) -> List[Dict[str, Any]]:
        headers = {"X-API-Key": settings.OPENAQ_API_KEY}
        
        locations_url = f"{self.base_url}/locations"
        params = {
            "coordinates": coordinates,
            "radius": radius,
            "limit": limit
        }
        
        raw_data = []
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(locations_url, params=params, headers=headers, timeout=15.0)
                if res.status_code in (401, 403):
                    raise FetchError("OpenAQ Authentication failed")
                if res.status_code == 429:
                    raise FetchError("OpenAQ Rate limit exceeded")
                res.raise_for_status()
                
                locations = res.json().get("results", [])
                
                for loc in locations:
                    loc_id = loc.get("id")
                    if not loc_id:
                        continue
                        
                    latest_url = f"{self.base_url}/locations/{loc_id}/latest"
                    latest_res = await client.get(latest_url, headers=headers, timeout=10.0)
                    if latest_res.status_code == 200:
                        measurements = latest_res.json().get("results", [])
                        raw_data.append({
                            "location": loc,
                            "measurements": measurements
                        })
                        
                return raw_data
        except httpx.HTTPError as e:
            raise FetchError(f"Failed to fetch OpenAQ data: {e}")
        except ValueError as e:
            raise FetchError(f"Failed to parse OpenAQ JSON: {e}")

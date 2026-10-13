import httpx
from typing import List, Dict, Any
from app.ingestion.base import BaseFetcher
from app.ingestion.exceptions import FetchError

class OpenMeteoFetcher(BaseFetcher):
    def __init__(self, base_url: str = "https://air-quality-api.open-meteo.com/v1/air-quality"):
        self.base_url = base_url

    async def fetch(self, latitude: float = 12.9716, longitude: float = 77.5946) -> List[Dict[str, Any]]:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone"
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.base_url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()
                return [data]
        except httpx.HTTPError as e:
            raise FetchError(f"Failed to fetch Open-Meteo data: {e}")
        except ValueError as e:
            raise FetchError(f"Failed to parse JSON: {e}")

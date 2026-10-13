import pytest
import httpx
from datetime import datetime, timezone
from app.ingestion.sources.open_meteo import OpenMeteoFetcher
from app.ingestion.normalizers.open_meteo import OpenMeteoNormalizer
from app.ingestion.exceptions import FetchError, NormalizationError

@pytest.mark.asyncio
async def test_fetcher_success(httpx_mock):
    mock_response = {
        "latitude": 12.97,
        "longitude": 77.59,
        "hourly": {
            "time": ["2026-09-26T00:00"],
            "pm10": [45.5],
            "pm2_5": [22.1],
            "carbon_monoxide": [150],
            "nitrogen_dioxide": [12.0],
            "sulphur_dioxide": [2.5],
            "ozone": [30.1]
        }
    }
    httpx_mock.add_response(json=mock_response)
    
    fetcher = OpenMeteoFetcher()
    data = await fetcher.fetch(latitude=12.97, longitude=77.59)
    assert len(data) == 1
    assert data[0]["latitude"] == 12.97

@pytest.mark.asyncio
async def test_fetcher_http_error(httpx_mock):
    httpx_mock.add_response(status_code=500)
    fetcher = OpenMeteoFetcher()
    with pytest.raises(FetchError):
        await fetcher.fetch()

def test_normalizer_success():
    raw_data = [{
        "latitude": 12.97,
        "longitude": 77.59,
        "hourly": {
            "time": ["2026-09-26T00:00"],
            "pm10": [45.5],
            "pm2_5": [22.1],
            "carbon_monoxide": [150],
            "nitrogen_dioxide": [12.0],
            "sulphur_dioxide": [2.5],
            "ozone": [30.1]
        }
    }]
    
    normalizer = OpenMeteoNormalizer()
    normalized = normalizer.normalize(raw_data)
    
    cams_data = normalized["cams_forecast_data"]
    assert len(cams_data) == 6 # 6 pollutants mapped
    
    pm10_record = next(r for r in cams_data if r["pollutant_code"] == "PM10")
    assert pm10_record["value"] == 45.5
    assert pm10_record["latitude"] == 12.97
    assert pm10_record["longitude"] == 77.59
    assert pm10_record["source"] == "Open-Meteo/CAMS"
    
def test_normalizer_missing_hourly():
    normalizer = OpenMeteoNormalizer()
    with pytest.raises(NormalizationError):
        normalizer.normalize([{"latitude": 12.97}])

import pytest
from datetime import datetime, timezone
from app.ingestion.normalizers.openaq import OpenAQNormalizer

def test_openaq_normalizer():
    raw_data = [
        {
            "location": {
                "id": 1234,
                "name": "BTM Layout",
                "coordinates": {"latitude": 12.91, "longitude": 77.61},
                "provider": {"name": "CPCB"}
            },
            "measurements": [
                {
                    "parameter": {"name": "pm25"},
                    "value": 45.2,
                    "unit": "µg/m³",
                    "period": {"datetimeTo": "2026-09-26T13:00:00Z"}
                },
                {
                    "parameter": {"name": "co"},
                    "value": -5, # Should be ignored
                    "unit": "ppm",
                    "period": {"datetimeTo": "2026-09-26T13:00:00Z"}
                }
            ]
        }
    ]
    
    normalizer = OpenAQNormalizer()
    normalized = normalizer.normalize(raw_data)
    
    assert "monitoring_stations" in normalized
    assert "station_measurements" in normalized
    
    stations = normalized["monitoring_stations"]
    assert len(stations) == 1
    assert stations[0]["external_id"] == "1234"
    assert stations[0]["source"] == "openaq"
    assert stations[0]["provider"] == "CPCB"
    
    measurements = normalized["station_measurements"]
    assert len(measurements) == 1
    assert measurements[0]["pollutant_code"] == "PM2.5"
    assert measurements[0]["value"] == 45.2
    assert measurements[0]["source"] == "openaq"
    assert measurements[0]["unit"] == "µg/m³"

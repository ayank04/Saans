import pytest
from datetime import datetime, timezone
from app.ingestion.normalizers.cpcb_datagov import CPCBDataGovNormalizer

def test_cpcb_normalizer():
    raw_data = [
        {
            "station": "BTM Layout, Bengaluru - CPCB",
            "last_update": "26-09-2026 13:00:00",
            "latitude": "12.91",
            "longitude": "77.61",
            "pollutant_id": "PM2.5",
            "pollutant_avg": "45.2",
            "pollutant_unit": "μg/m³"
        },
        {
            "station": "BTM Layout, Bengaluru - CPCB",
            "last_update": "26-09-2026 13:00:00",
            "latitude": "12.91",
            "longitude": "77.61",
            "pollutant_id": "PM10",
            "pollutant_avg": "NA", # Should be ignored
            "pollutant_unit": "μg/m³"
        }
    ]
    
    normalizer = CPCBDataGovNormalizer()
    normalized = normalizer.normalize(raw_data)
    
    assert "monitoring_stations" in normalized
    assert "station_measurements" in normalized
    
    stations = normalized["monitoring_stations"]
    assert len(stations) == 1
    assert stations[0]["name"] == "BTM Layout, Bengaluru - CPCB"
    assert stations[0]["latitude"] == 12.91
    assert stations[0]["longitude"] == 77.61
    assert stations[0]["source"] == "cpcb_datagov"
    
    measurements = normalized["station_measurements"]
    assert len(measurements) == 1
    assert measurements[0]["pollutant_code"] == "PM2.5"
    assert measurements[0]["value"] == 45.2
    assert measurements[0]["source"] == "cpcb_datagov"

def test_cpcb_normalizer_real_api_format():
    raw_data = [
        {
            "country": "India",
            "state": "Karnataka",
            "city": "Bengaluru",
            "station": "Silk Board, Bengaluru - KSPCB",
            "last_update": "13-10-2026 18:00:00",
            "latitude": "12.9176",
            "longitude": "77.6234",
            "pollutant_id": "PM2.5",
            "min_value": "45",
            "max_value": "82",
            "avg_value": "64.5"
        },
        {
            "country": "India",
            "state": "Karnataka",
            "city": "Bengaluru",
            "station": "Silk Board, Bengaluru - KSPCB",
            "last_update": "13-10-2026 18:00:00",
            "latitude": "12.9176",
            "longitude": "77.6234",
            "pollutant_id": "CO",
            "min_value": "12",
            "max_value": "35",
            "avg_value": "24"
        },
        {
            "country": "India",
            "state": "Karnataka",
            "city": "Bengaluru",
            "station": "Silk Board, Bengaluru - KSPCB",
            "last_update": "13-10-2026 18:00:00",
            "latitude": "12.9176",
            "longitude": "77.6234",
            "pollutant_id": "OZONE",
            "min_value": "NA",
            "max_value": "NA",
            "avg_value": "NA"
        }
    ]
    
    normalizer = CPCBDataGovNormalizer()
    normalized = normalizer.normalize(raw_data)
    
    stations = normalized["monitoring_stations"]
    assert len(stations) == 1
    assert stations[0]["name"] == "Silk Board, Bengaluru - KSPCB"
    assert stations[0]["latitude"] == 12.9176
    assert stations[0]["longitude"] == 77.6234
    
    measurements = normalized["station_measurements"]
    assert len(measurements) == 2
    
    pm25 = next(m for m in measurements if m["pollutant_code"] == "PM2.5")
    assert pm25["value"] == 64.5
    assert pm25["unit"] == "μg/m³"
    assert pm25["observation_timestamp"].year == 2026
    
    co = next(m for m in measurements if m["pollutant_code"] == "CO")
    assert co["value"] == 24.0
    assert co["unit"] == "mg/m³"

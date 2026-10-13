from typing import List, Dict, Any
from datetime import datetime, timezone
from app.ingestion.base import BaseNormalizer

class OpenAQNormalizer(BaseNormalizer):
    def normalize(self, raw_data: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        stations = []
        measurements = []
        
        pollutant_map = {
            "pm25": "PM2.5",
            "pm10": "PM10",
            "no2": "NO2",
            "so2": "SO2",
            "co": "CO",
            "o3": "O3"
        }
        
        for payload in raw_data:
            loc = payload.get("location", {})
            meas_list = payload.get("measurements", [])
            
            loc_id = str(loc.get("id"))
            name = loc.get("name", f"OpenAQ_{loc_id}")
            coords = loc.get("coordinates", {})
            provider = loc.get("provider", {}).get("name", "Unknown")
            
            lat = coords.get("latitude")
            lon = coords.get("longitude")
            
            stations.append({
                "name": name,
                "external_id": loc_id,
                "source": "openaq",
                "latitude": lat,
                "longitude": lon,
                "provider": provider
            })
            
            for m in meas_list:
                parameter = m.get("parameter", {}).get("name", "").lower()
                val = m.get("value")
                
                if val is None or val < 0:
                    continue
                    
                if parameter in pollutant_map:
                    period = m.get("period", {})
                    dt_str = period.get("datetimeTo")
                    if dt_str:
                        try:
                            obs_time = datetime.fromisoformat(dt_str.replace("Z", "+00:00")).astimezone(timezone.utc)
                        except ValueError:
                            obs_time = datetime.now(timezone.utc)
                    else:
                        obs_time = datetime.now(timezone.utc)
                        
                    unit = m.get("unit", "μg/m³")
                    
                    measurements.append({
                        "station_external_id": loc_id,
                        "pollutant_code": pollutant_map[parameter],
                        "value": val,
                        "unit": unit,
                        "observation_timestamp": obs_time,
                        "source": "openaq"
                    })
                    
        return {
            "monitoring_stations": stations,
            "station_measurements": measurements
        }

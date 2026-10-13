from typing import List, Dict, Any
from datetime import datetime, timezone
from app.ingestion.base import BaseNormalizer
from app.ingestion.exceptions import NormalizationError

class OpenMeteoNormalizer(BaseNormalizer):
    def normalize(self, raw_data: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        cams_data = []
        for payload in raw_data:
            if "hourly" not in payload:
                raise NormalizationError("Missing 'hourly' field in Open-Meteo payload")
                
            hourly = payload["hourly"]
            times = hourly.get("time", [])
            lat = payload.get("latitude")
            lon = payload.get("longitude")
            
            reference_time = datetime.now(timezone.utc)
            
            pollutant_mapping = {
                "pm10": ("PM10", "μg/m³"),
                "pm2_5": ("PM2.5", "μg/m³"),
                "carbon_monoxide": ("CO", "μg/m³"),
                "nitrogen_dioxide": ("NO2", "μg/m³"),
                "sulphur_dioxide": ("SO2", "μg/m³"),
                "ozone": ("O3", "μg/m³"),
            }
            
            for i, time_str in enumerate(times):
                try:
                    valid_time = datetime.fromisoformat(time_str).replace(tzinfo=timezone.utc)
                except ValueError:
                    continue
                    
                for om_key, (pollutant_code, unit) in pollutant_mapping.items():
                    if om_key in hourly and hourly[om_key][i] is not None:
                        cams_data.append({
                            "reference_time": reference_time,
                            "valid_time": valid_time,
                            "latitude": lat,
                            "longitude": lon,
                            "pollutant_code": pollutant_code,
                            "value": hourly[om_key][i],
                            "unit": unit,
                            "source": "Open-Meteo/CAMS"
                        })
        
        return {"cams_forecast_data": cams_data}

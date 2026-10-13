from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from app.ingestion.base import BaseNormalizer

# CPCB / data.gov.in publishes timestamps in Indian Standard Time (UTC+05:30)
IST = timezone(timedelta(hours=5, minutes=30))

class CPCBDataGovNormalizer(BaseNormalizer):
    def normalize(self, raw_data: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        measurements = []
        stations = {}
        
        pollutant_map = {
            "pm2.5": "PM2.5",
            "pm10": "PM10",
            "no2": "NO2",
            "so2": "SO2",
            "co": "CO",
            "ozone": "O3",
            "o3": "O3",
            "nh3": "NH3"
        }
        
        for record in raw_data:
            station_name = record.get("station")
            if not station_name:
                continue
                
            last_update_str = record.get("last_update")
            obs_time = datetime.now(timezone.utc)
            if last_update_str:
                for fmt in ("%d-%m-%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y %H:%M:%S"):
                    try:
                        # Parse naive datetime and assign IST timezone, then convert to UTC
                        dt_naive = datetime.strptime(last_update_str, fmt)
                        obs_time = dt_naive.replace(tzinfo=IST).astimezone(timezone.utc)
                        break
                    except ValueError:
                        continue
                else:
                    try:
                        dt = datetime.fromisoformat(last_update_str)
                        if dt.tzinfo is None:
                            obs_time = dt.replace(tzinfo=IST).astimezone(timezone.utc)
                        else:
                            obs_time = dt.astimezone(timezone.utc)
                    except ValueError:
                        pass

            lat = record.get("latitude")
            lon = record.get("longitude")
            try:
                lat = float(lat) if lat else None
                lon = float(lon) if lon else None
            except ValueError:
                lat = None
                lon = None
                
            stations[station_name] = {
                "name": station_name,
                "external_id": station_name,
                "source": "cpcb_datagov",
                "latitude": lat,
                "longitude": lon
            }

            pollutant_id = str(record.get("pollutant_id", "")).strip().lower()
            val = record.get("avg_value") if record.get("avg_value") is not None else record.get("pollutant_avg")
            if val is None or val == "" or str(val).strip().upper() == "NA":
                continue
            
            try:
                val = float(val)
                if val < 0: 
                    continue
            except ValueError:
                continue
                
            unit = record.get("pollutant_unit") or ("mg/m³" if pollutant_id == "co" else "μg/m³")
            
            if pollutant_id in pollutant_map:
                measurements.append({
                    "station_external_id": station_name,
                    "pollutant_code": pollutant_map[pollutant_id],
                    "value": val,
                    "unit": unit,
                    "observation_timestamp": obs_time,
                    "source": "cpcb_datagov"
                })

        return {
            "monitoring_stations": list(stations.values()),
            "station_measurements": measurements
        }

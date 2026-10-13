# Data Sources

| Source | Role | Data | Status | Authentication |
|---|---|---|---|---|
| CPCB/data.gov.in | Primary ground observations | Station/AQI/pollutants | unverified (Requires live test) | API key |
| OpenAQ v3 | Supplemental/historical | Raw pollutant measurements + station metadata | unverified (Requires live test) | API key |
| Open-Meteo/CAMS | Forecast | Pollutants + meteorology | verified | No key for current project usage |

## URLs
- **CPCB/data.gov.in**: `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69`
- **OpenAQ v3**: `https://api.openaq.org/v3/locations`
- **Open-Meteo**: `https://air-quality-api.open-meteo.com/v1/air-quality`

## Data Provenance
Data provenance is strictly preserved. Observations retrieved from OpenAQ that may originate from CPCB are explicitly marked with `source="openaq"` and `provider="CPCB"` to distinguish them from data retrieved directly via `source="cpcb_datagov"`. Deduplication constraints are built around `[station_id, pollutant_id, observation_timestamp, source]`.

## Important Limitations
- **Open-Meteo Reference Time**: The reference time corresponds to the request execution timestamp in our normalizer. True model forecast time offsets are implicitly encoded in `valid_time`.
- **Database Dependency**: The actual ingestion pipeline requires PostgreSQL/PostGIS. Without Docker or a live instance, the actual deduplication and insertion have been checked offline up to the DB transaction level.

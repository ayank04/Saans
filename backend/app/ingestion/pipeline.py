import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from app.ingestion.models import IngestionResult
from app.ingestion.exceptions import IngestionError
from app.models.schema import CAMSForecastData, Pollutant, MonitoringStation, StationMeasurement
from geoalchemy2.elements import WKTElement

logger = logging.getLogger(__name__)

class IngestionPipeline:
    def __init__(self, db: Session, fetcher, normalizer, source_name: str):
        self.db = db
        self.fetcher = fetcher
        self.normalizer = normalizer
        self.source_name = source_name

    async def run(self, **kwargs) -> IngestionResult:
        result = IngestionResult(source=self.source_name, execution_start=datetime.now())
        logger.info(f"Ingestion started for {self.source_name}")

        try:
            raw_data = await self.fetcher.fetch(**kwargs)
            result.records_fetched = len(raw_data)
            
            normalized_data = self.normalizer.normalize(raw_data)
            
            pollutants = {p.code: p.id for p in self.db.execute(select(Pollutant)).scalars().all()}
            
            inserted = 0
            duplicates = 0
            
            if "monitoring_stations" in normalized_data:
                for stat in normalized_data["monitoring_stations"]:
                    if stat.get("latitude") is None or stat.get("longitude") is None:
                        continue
                        
                    loc_wkt = f"POINT({stat['longitude']} {stat['latitude']})"
                    
                    stmt = insert(MonitoringStation).values(
                        external_id=stat["external_id"],
                        name=stat["name"],
                        source=stat["source"],
                        location=WKTElement(loc_wkt, srid=4326),
                        is_active=1
                    ).on_conflict_do_nothing(
                        index_elements=['external_id']
                    )
                    self.db.execute(stmt)
                self.db.commit()

            stations_map = {}
            if "station_measurements" in normalized_data:
                st_records = self.db.execute(select(MonitoringStation)).scalars().all()
                stations_map = {s.external_id: s.id for s in st_records}

            if "station_measurements" in normalized_data:
                meas_records = normalized_data["station_measurements"]
                result.records_accepted += len(meas_records)
                
                for record in meas_records:
                    if record["pollutant_code"] not in pollutants:
                        continue
                    
                    ext_id = record["station_external_id"]
                    if ext_id not in stations_map:
                        continue 
                        
                    pollutant_id = pollutants[record["pollutant_code"]]
                    station_id = stations_map[ext_id]
                    
                    stmt = insert(StationMeasurement).values(
                        station_id=station_id,
                        pollutant_id=pollutant_id,
                        observation_timestamp=record["observation_timestamp"],
                        value=record["value"],
                        unit=record["unit"],
                        source=record["source"]
                    ).on_conflict_do_nothing(
                        index_elements=['station_id', 'pollutant_id', 'observation_timestamp', 'source']
                    ).returning(StationMeasurement.id)
                    
                    res = self.db.execute(stmt)
                    if res.scalar_one_or_none() is not None:
                        inserted += 1
                    else:
                        duplicates += 1

            if "cams_forecast_data" in normalized_data:
                cams_records = normalized_data["cams_forecast_data"]
                result.records_accepted += len(cams_records)
                
                for record in cams_records:
                    if record["pollutant_code"] not in pollutants:
                        continue
                        
                    pollutant_id = pollutants[record["pollutant_code"]]
                    location_wkt = f"POINT({record['longitude']} {record['latitude']})"
                    
                    stmt = insert(CAMSForecastData).values(
                        reference_time=record["reference_time"],
                        valid_time=record["valid_time"],
                        location=WKTElement(location_wkt, srid=4326),
                        pollutant_id=pollutant_id,
                        value=record["value"],
                        unit=record["unit"],
                        source=record["source"]
                    ).on_conflict_do_nothing(
                        index_elements=['reference_time', 'valid_time', 'location', 'pollutant_id']
                    ).returning(CAMSForecastData.id)
                    
                    res = self.db.execute(stmt)
                    if res.scalar_one_or_none() is not None:
                        inserted += 1
                    else:
                        duplicates += 1
                        
            self.db.commit()
            result.records_inserted = inserted
            result.records_skipped_as_duplicates = duplicates
            
            logger.info(f"{self.source_name} accepted {result.records_accepted} records")
            logger.info(f"{self.source_name} inserted {inserted} records")
            logger.info(f"{self.source_name} skipped {duplicates} duplicates")

        except IngestionError as e:
            result.errors.append(str(e))
            result.status = "failed"
            logger.error(f"{self.source_name} ingestion failed: {e}")
        except Exception as e:
            result.errors.append(f"Unexpected error: {str(e)}")
            result.status = "error"
            logger.exception(f"Unexpected error during {self.source_name} ingestion")
            
        result.execution_end = datetime.now()
        if result.status == "started":
            result.status = "completed"
            
        return result

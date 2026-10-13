from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from app.db.database import Base

"""
SPATIAL REFERENCE SYSTEM DOCUMENTATION:
- SRID 4326 (WGS84) is used as the canonical storage and interchange CRS.
- This is appropriate for storage, API responses, and Leaflet frontend integration.
- IMPORTANT: Distance, area, grid-generation, and spatial-statistical operations 
  (such as Kriging) MUST NOT blindly treat longitude/latitude degrees as planar distances.
  They must either cast to a projected CRS (e.g., EPSG:32643 for Bengaluru) or use 
  geodesic distance calculations in the application/ML layer.
"""

class Ward(Base):
    __tablename__ = "wards"
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    geometry = Column(Geometry('MULTIPOLYGON', srid=4326, spatial_index=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class MonitoringStation(Base):
    __tablename__ = "monitoring_stations"
    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    source = Column(String, index=True, nullable=False) # e.g. CPCB, OpenAQ
    location = Column(Geometry('POINT', srid=4326, spatial_index=True), nullable=False)
    is_active = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class SpatialGrid(Base):
    __tablename__ = "spatial_grid"
    id = Column(Integer, primary_key=True, index=True)
    geometry = Column(Geometry('POLYGON', srid=4326, spatial_index=True), nullable=False)
    resolution = Column(String, nullable=False) # e.g. 1km x 1km
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class Pollutant(Base):
    __tablename__ = "pollutants"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False) # e.g. PM2.5, PM10, NO2
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class StationMeasurement(Base):
    __tablename__ = "station_measurements"
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id"), nullable=False)
    pollutant_id = Column(Integer, ForeignKey("pollutants.id"), nullable=False)
    observation_timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    source = Column(String, nullable=False)
    quality_status = Column(String)
    ingestion_timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('station_id', 'pollutant_id', 'observation_timestamp', 'source', name='uix_station_pollutant_time'),
    )

class AQIObservation(Base):
    __tablename__ = "aqi_observations"
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("monitoring_stations.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    aqi_value = Column(Float, nullable=False)
    dominant_pollutant = Column(String)
    sub_indexes = Column(JSON) # e.g. {"PM2.5": 120, "PM10": 90}
    calculation_source = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('station_id', 'timestamp', name='uix_aqi_station_time'),
    )

class WeatherObservation(Base):
    __tablename__ = "weather_observations"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    location = Column(Geometry('POINT', srid=4326, spatial_index=True), nullable=False)
    temperature = Column(Float)
    wind_speed = Column(Float)
    wind_direction = Column(Float)
    humidity = Column(Float)
    pressure = Column(Float)
    precipitation = Column(Float)
    source = Column(String, nullable=False)
    ingestion_timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class CAMSForecastData(Base):
    __tablename__ = "cams_forecast_data"
    id = Column(Integer, primary_key=True, index=True)
    reference_time = Column(DateTime(timezone=True), index=True, nullable=False) # When forecast made
    valid_time = Column(DateTime(timezone=True), index=True, nullable=False) # When forecast applies
    location = Column(Geometry('POINT', srid=4326, spatial_index=True), nullable=False)
    pollutant_id = Column(Integer, ForeignKey("pollutants.id"), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    source = Column(String, nullable=False)
    ingestion_timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        # Used coordinates in constraint implicitly through location geometry bytes.
        UniqueConstraint('reference_time', 'valid_time', 'location', 'pollutant_id', name='uix_cams_forecast'),
    )

class KrigingPrediction(Base):
    __tablename__ = "kriging_predictions"
    id = Column(Integer, primary_key=True, index=True)
    prediction_timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    grid_id = Column(Integer, ForeignKey("spatial_grid.id"), nullable=False)
    pollutant_id = Column(Integer, ForeignKey("pollutants.id"), nullable=False)
    predicted_value = Column(Float, nullable=False)
    uncertainty = Column(Float)
    model_version = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('prediction_timestamp', 'grid_id', 'pollutant_id', name='uix_kriging_prediction'),
    )

class ForecastCorrection(Base):
    __tablename__ = "forecast_corrections"
    id = Column(Integer, primary_key=True, index=True)
    raw_forecast_id = Column(Integer, ForeignKey("cams_forecast_data.id"), nullable=False)
    predicted_error = Column(Float, nullable=False)
    corrected_value = Column(Float, nullable=False)
    actual_observed_value = Column(Float, nullable=True) # Evaluated later
    model_version = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class SatelliteNO2Observation(Base):
    __tablename__ = "satellite_no2_observations"
    id = Column(Integer, primary_key=True, index=True)
    observation_timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    geometry = Column(Geometry('POLYGON', srid=4326, spatial_index=True), nullable=False)
    no2_value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    source = Column(String, nullable=False)
    quality_flag = Column(String)
    ingestion_timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class FireHotspot(Base):
    __tablename__ = "fire_hotspots"
    id = Column(Integer, primary_key=True, index=True)
    detection_timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    location = Column(Geometry('POINT', srid=4326, spatial_index=True), nullable=False)
    confidence = Column(String) 
    frp = Column(Float) 
    source = Column(String, nullable=False)
    ingestion_timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class PollutionReport(Base):
    __tablename__ = "pollution_reports"
    id = Column(Integer, primary_key=True, index=True)
    report_timestamp = Column(DateTime(timezone=True), index=True, nullable=False)
    location = Column(Geometry('POINT', srid=4326, spatial_index=True), nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text)
    image_path = Column(String)
    predicted_class = Column(String)
    confidence = Column(Float)
    status = Column(String, server_default='pending', nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class IngestionRun(Base):
    __tablename__ = "ingestion_runs"
    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, index=True)  # "completed", "failed", "running"
    started_at = Column(DateTime(timezone=True), nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    records_fetched = Column(Integer, default=0, nullable=False)
    records_accepted = Column(Integer, default=0, nullable=False)
    records_inserted = Column(Integer, default=0, nullable=False)
    records_skipped_as_duplicates = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


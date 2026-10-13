"""initial_schema

Revision ID: 994909cf17e9
Revises: 
Create Date: 2026-09-26 13:00:07.902702

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision: str = '994909cf17e9'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable PostGIS extension
    op.execute('CREATE EXTENSION IF NOT EXISTS postgis;')

    op.create_table('spatial_grid',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('geometry', geoalchemy2.types.Geometry(geometry_type='POLYGON', srid=4326, from_text='ST_GeomFromEWKT', name='geometry', spatial_index=False), nullable=False),
        sa.Column('resolution', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('idx_spatial_grid_geometry', 'spatial_grid', ['geometry'], postgresql_using='gist', if_not_exists=True)

    op.create_table('wards',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('external_id', sa.String(), unique=True, index=True, nullable=False),
        sa.Column('name', sa.String(), index=True, nullable=False),
        sa.Column('geometry', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326, from_text='ST_GeomFromEWKT', name='geometry', spatial_index=False), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('idx_wards_geometry', 'wards', ['geometry'], postgresql_using='gist', if_not_exists=True)

    op.create_table('pollutants',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('code', sa.String(), unique=True, index=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table('monitoring_stations',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('external_id', sa.String(), unique=True, index=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('source', sa.String(), index=True, nullable=False),
        sa.Column('location', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326, from_text='ST_GeomFromEWKT', name='geometry', spatial_index=False), nullable=False),
        sa.Column('is_active', sa.Integer(), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('idx_monitoring_stations_location', 'monitoring_stations', ['location'], postgresql_using='gist', if_not_exists=True)

    op.create_table('station_measurements',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('station_id', sa.Integer(), sa.ForeignKey('monitoring_stations.id'), nullable=False),
        sa.Column('pollutant_id', sa.Integer(), sa.ForeignKey('pollutants.id'), nullable=False),
        sa.Column('observation_timestamp', sa.DateTime(timezone=True), index=True, nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('quality_status', sa.String()),
        sa.Column('ingestion_timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('station_id', 'pollutant_id', 'observation_timestamp', 'source', name='uix_station_pollutant_time')
    )

    op.create_table('aqi_observations',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('station_id', sa.Integer(), sa.ForeignKey('monitoring_stations.id'), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), index=True, nullable=False),
        sa.Column('aqi_value', sa.Float(), nullable=False),
        sa.Column('dominant_pollutant', sa.String()),
        sa.Column('sub_indexes', sa.JSON()),
        sa.Column('calculation_source', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('station_id', 'timestamp', name='uix_aqi_station_time')
    )

    op.create_table('weather_observations',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), index=True, nullable=False),
        sa.Column('location', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326, from_text='ST_GeomFromEWKT', name='geometry', spatial_index=False), nullable=False),
        sa.Column('temperature', sa.Float()),
        sa.Column('wind_speed', sa.Float()),
        sa.Column('wind_direction', sa.Float()),
        sa.Column('humidity', sa.Float()),
        sa.Column('pressure', sa.Float()),
        sa.Column('precipitation', sa.Float()),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('ingestion_timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('idx_weather_observations_location', 'weather_observations', ['location'], postgresql_using='gist', if_not_exists=True)

    op.create_table('cams_forecast_data',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('reference_time', sa.DateTime(timezone=True), index=True, nullable=False),
        sa.Column('valid_time', sa.DateTime(timezone=True), index=True, nullable=False),
        sa.Column('location', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326, from_text='ST_GeomFromEWKT', name='geometry', spatial_index=False), nullable=False),
        sa.Column('pollutant_id', sa.Integer(), sa.ForeignKey('pollutants.id'), nullable=False),
        sa.Column('value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('ingestion_timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('reference_time', 'valid_time', 'location', 'pollutant_id', name='uix_cams_forecast')
    )
    op.create_index('idx_cams_forecast_location', 'cams_forecast_data', ['location'], postgresql_using='gist', if_not_exists=True)

    op.create_table('kriging_predictions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('prediction_timestamp', sa.DateTime(timezone=True), index=True, nullable=False),
        sa.Column('grid_id', sa.Integer(), sa.ForeignKey('spatial_grid.id'), nullable=False),
        sa.Column('pollutant_id', sa.Integer(), sa.ForeignKey('pollutants.id'), nullable=False),
        sa.Column('predicted_value', sa.Float(), nullable=False),
        sa.Column('uncertainty', sa.Float()),
        sa.Column('model_version', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.UniqueConstraint('prediction_timestamp', 'grid_id', 'pollutant_id', name='uix_kriging_prediction')
    )

    op.create_table('forecast_corrections',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('raw_forecast_id', sa.Integer(), sa.ForeignKey('cams_forecast_data.id'), nullable=False),
        sa.Column('predicted_error', sa.Float(), nullable=False),
        sa.Column('corrected_value', sa.Float(), nullable=False),
        sa.Column('actual_observed_value', sa.Float(), nullable=True),
        sa.Column('model_version', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table('satellite_no2_observations',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('observation_timestamp', sa.DateTime(timezone=True), index=True, nullable=False),
        sa.Column('geometry', geoalchemy2.types.Geometry(geometry_type='POLYGON', srid=4326, from_text='ST_GeomFromEWKT', name='geometry', spatial_index=False), nullable=False),
        sa.Column('no2_value', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('quality_flag', sa.String()),
        sa.Column('ingestion_timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('idx_satellite_no2_geometry', 'satellite_no2_observations', ['geometry'], postgresql_using='gist', if_not_exists=True)

    op.create_table('fire_hotspots',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('detection_timestamp', sa.DateTime(timezone=True), index=True, nullable=False),
        sa.Column('location', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326, from_text='ST_GeomFromEWKT', name='geometry', spatial_index=False), nullable=False),
        sa.Column('confidence', sa.String()),
        sa.Column('frp', sa.Float()),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('ingestion_timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('idx_fire_hotspots_location', 'fire_hotspots', ['location'], postgresql_using='gist', if_not_exists=True)

    op.create_table('pollution_reports',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('report_timestamp', sa.DateTime(timezone=True), index=True, nullable=False),
        sa.Column('location', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326, from_text='ST_GeomFromEWKT', name='geometry', spatial_index=False), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('image_path', sa.String()),
        sa.Column('predicted_class', sa.String()),
        sa.Column('confidence', sa.Float()),
        sa.Column('status', sa.String(), server_default='pending', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )
    op.create_index('idx_pollution_reports_location', 'pollution_reports', ['location'], postgresql_using='gist', if_not_exists=True)


def downgrade() -> None:
    op.drop_index('idx_pollution_reports_location', table_name='pollution_reports')
    op.drop_table('pollution_reports')
    op.drop_index('idx_fire_hotspots_location', table_name='fire_hotspots')
    op.drop_table('fire_hotspots')
    op.drop_index('idx_satellite_no2_geometry', table_name='satellite_no2_observations')
    op.drop_table('satellite_no2_observations')
    op.drop_table('forecast_corrections')
    op.drop_table('kriging_predictions')
    op.drop_index('idx_cams_forecast_location', table_name='cams_forecast_data')
    op.drop_table('cams_forecast_data')
    op.drop_index('idx_weather_observations_location', table_name='weather_observations')
    op.drop_table('weather_observations')
    op.drop_table('aqi_observations')
    op.drop_table('station_measurements')
    op.drop_index('idx_monitoring_stations_location', table_name='monitoring_stations')
    op.drop_table('monitoring_stations')
    op.drop_table('pollutants')
    op.drop_index('idx_wards_geometry', table_name='wards')
    op.drop_table('wards')
    op.drop_index('idx_spatial_grid_geometry', table_name='spatial_grid')
    op.drop_table('spatial_grid')

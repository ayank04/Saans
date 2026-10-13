import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.main import app
from app.db.database import get_db
from app.models.schema import MonitoringStation, StationMeasurement, Pollutant
from geoalchemy2.elements import WKTElement

client = TestClient(app)


def test_health_check():
    """Verify health endpoint is preserved and returns ok."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "saans-backend"


def test_get_stations_empty_state():
    """Test GET /api/v1/stations when database has zero stations."""
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.count.return_value = 0

    def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db
    try:
        response = client.get("/api/v1/stations")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["stations"] == []
        assert data["is_live"] is True
    finally:
        app.dependency_overrides.clear()


def test_get_stations_with_data_and_pollutants():
    """Test GET /api/v1/stations returning valid stations and joined pollutants."""
    mock_db = MagicMock()
    
    # Mock station
    station = MonitoringStation(
        id=1,
        external_id="btm_layout_cpcb",
        name="BTM Layout, Bengaluru - CPCB",
        source="cpcb_datagov",
        location=WKTElement("POINT(77.61 12.91)", srid=4326),
        is_active=1,
        updated_at=datetime(2026, 10, 13, 18, 0, 0, tzinfo=timezone.utc)
    )

    # Mock pollutant reading
    meas = StationMeasurement(
        id=10,
        station_id=1,
        pollutant_id=1,
        observation_timestamp=datetime(2026, 10, 13, 18, 0, 0, tzinfo=timezone.utc),
        value=55.4,
        unit="μg/m³",
        source="cpcb_datagov"
    )

    # Setup mock returns
    # Count query
    mock_db.query.return_value.filter.return_value.count.return_value = 1
    # Stations select query
    mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [station]
    # Measurements join query
    mock_db.query.return_value.join.return_value.filter.return_value.order_by.return_value.all.return_value = [(meas, "PM2.5")]

    def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db
    try:
        response = client.get("/api/v1/stations")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["stations"]) == 1
        
        st = data["stations"][0]
        assert st["id"] == "btm_layout_cpcb"
        assert st["name"] == "BTM Layout, Bengaluru - CPCB"
        assert st["source"] == "cpcb_datagov"
        assert st["latitude"] == pytest.approx(12.91, 0.001)
        assert st["longitude"] == pytest.approx(77.61, 0.001)
        assert "PM2.5" in st["pollutants"]
        assert st["pollutants"]["PM2.5"]["value"] == 55.4
        assert st["pollutants"]["PM2.5"]["unit"] == "μg/m³"
        assert st["is_live"] is True
    finally:
        app.dependency_overrides.clear()


def test_get_stations_missing_coordinates():
    """Test station with null/missing coordinates handles safely without error."""
    mock_db = MagicMock()
    
    station_no_geo = MonitoringStation(
        id=2,
        external_id="unknown_location_stn",
        name="Unknown Station",
        source="cpcb_datagov",
        location=None,
        is_active=1,
        updated_at=datetime(2026, 10, 13, 18, 0, 0, tzinfo=timezone.utc)
    )

    mock_db.query.return_value.filter.return_value.count.return_value = 1
    mock_db.query.return_value.filter.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [station_no_geo]
    mock_db.query.return_value.join.return_value.filter.return_value.order_by.return_value.all.return_value = []

    def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db
    try:
        response = client.get("/api/v1/stations")
        assert response.status_code == 200
        data = response.json()
        assert len(data["stations"]) == 1
        st = data["stations"][0]
        assert st["latitude"] is None
        assert st["longitude"] is None
        assert st["pollutants"] == {}
    finally:
        app.dependency_overrides.clear()


def test_get_stations_database_error():
    """Test 503 response when database raises an OperationalError."""
    mock_db = MagicMock()
    mock_db.query.side_effect = OperationalError("connection refused", {}, None)

    def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db
    try:
        response = client.get("/api/v1/stations")
        assert response.status_code == 503
        assert "Database service unavailable" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()


def test_get_station_by_id_not_found():
    """Test 404 response when station ID does not exist."""
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db
    try:
        response = client.get("/api/v1/stations/nonexistent_id")
        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()

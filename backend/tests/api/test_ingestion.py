import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import get_db

client = TestClient(app)


def test_get_ingestion_status_endpoint():
    """Verify GET /api/v1/ingestion/status returns complete freshness and scheduler metadata."""
    mock_db = MagicMock()
    mock_db.query.return_value.scalar.side_effect = [None, None]
    mock_db.query.return_value.order_by.return_value.first.return_value = None

    def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db
    try:
        response = client.get("/api/v1/ingestion/status")
        assert response.status_code == 200
        data = response.json()
        assert "freshness_status" in data
        assert "scheduler" in data
        assert "staleness_threshold_hours" in data
        assert data["source"] == "CPCB / data.gov.in"
    finally:
        app.dependency_overrides.clear()


def test_trigger_ingestion_endpoint_success():
    """Verify POST /api/v1/ingestion/trigger triggers execution and returns result."""
    mock_db = MagicMock()

    def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db
    try:
        mock_result = {
            "status": "completed",
            "run_id": 42,
            "records_fetched": 70,
            "records_inserted": 52,
            "records_skipped_as_duplicates": 0
        }
        with patch("app.api.v1.ingestion.execute_cpcb_ingestion", return_value=mock_result):
            response = client.post("/api/v1/ingestion/trigger")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "completed"
            assert "Successfully ingested CPCB data" in data["message"]
            assert data["details"]["run_id"] == 42
    finally:
        app.dependency_overrides.clear()


def test_trigger_ingestion_endpoint_skipped_when_locked():
    """Verify POST /api/v1/ingestion/trigger handles advisory lock skip gracefully."""
    mock_db = MagicMock()

    def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db
    try:
        mock_result = {
            "status": "skipped",
            "reason": "advisory_lock_held",
            "message": "Another worker process is currently running ingestion (advisory lock held)."
        }
        with patch("app.api.v1.ingestion.execute_cpcb_ingestion", return_value=mock_result):
            response = client.post("/api/v1/ingestion/trigger")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "skipped"
            assert "advisory lock held" in data["message"]
    finally:
        app.dependency_overrides.clear()

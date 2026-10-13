import pytest
import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.config import settings
from app.services.ingestion_service import (
    acquire_advisory_lock,
    release_advisory_lock,
    fetch_with_retry,
    execute_cpcb_ingestion,
    get_freshness_status,
    CPCB_ADVISORY_LOCK_ID
)
from app.scheduler import CPCBIngestionScheduler
from app.ingestion.exceptions import FetchError, IngestionError


@pytest.mark.asyncio
async def test_scheduler_configuration():
    """Verify scheduler respects configurable intervals and flags."""
    sched = CPCBIngestionScheduler(interval_seconds=600, enabled=False)
    assert sched.interval_seconds == 600
    assert sched.enabled is False

    default_sched = CPCBIngestionScheduler()
    assert default_sched.interval_seconds == settings.CPCB_INGESTION_INTERVAL_SECONDS
    assert default_sched.enabled == settings.CPCB_SCHEDULER_ENABLED


@pytest.mark.asyncio
async def test_fetch_with_retry_bounded_failure():
    """Verify fetcher retries with backoff up to max_retries and never retries indefinitely."""
    mock_fetcher = MagicMock()
    mock_fetcher.fetch = AsyncMock(side_effect=FetchError("CPCB API 500 Internal Error"))

    with pytest.raises(FetchError) as exc_info:
        await fetch_with_retry(mock_fetcher, max_retries=3, backoff_base=0.01)

    assert "CPCB API 500 Internal Error" in str(exc_info.value)
    # Exactly 3 attempts made
    assert mock_fetcher.fetch.call_count == 3


@pytest.mark.asyncio
async def test_scheduler_overlap_prevention_advisory_lock():
    """Verify ingestion run is skipped when another process holds the PostgreSQL advisory lock."""
    mock_db = MagicMock()
    
    with patch("app.services.ingestion_service.acquire_advisory_lock", return_value=False):
        result = await execute_cpcb_ingestion(mock_db)

    assert result["status"] == "skipped"
    assert "advisory_lock_held" in result["reason"]
    # Ensure no fetch was initiated
    mock_db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_empty_api_response_handling():
    """Verify empty API responses are handled safely without crashing."""
    mock_db = MagicMock()
    # Mock lock acquisition
    mock_db.bind.dialect.name = "postgresql"
    mock_db.execute.return_value.scalar.return_value = True

    mock_run = MagicMock()
    mock_run.id = 1
    mock_db.query.return_value.get.return_value = mock_run

    with patch("app.services.ingestion_service.acquire_advisory_lock", return_value=True), \
         patch("app.services.ingestion_service.release_advisory_lock", return_value=True), \
         patch("app.services.ingestion_service.fetch_with_retry", return_value=[]):
        
        result = await execute_cpcb_ingestion(mock_db)

    assert result["status"] == "completed"
    assert result["records_fetched"] == 0
    assert result["records_inserted"] == 0


@pytest.mark.asyncio
async def test_database_outage_handling():
    """Verify database exceptions are safely caught and error status returned."""
    mock_db = MagicMock()
    mock_db.bind.dialect.name = "postgresql"
    mock_db.execute.side_effect = Exception("Database connection lost (Supabase unreachable)")

    with patch("app.services.ingestion_service.acquire_advisory_lock", return_value=True), \
         patch("app.services.ingestion_service.release_advisory_lock") as mock_release:
        
        result = await execute_cpcb_ingestion(mock_db)

    assert result["status"] == "failed"
    assert "Database connection lost" in result["error"]
    # Advisory lock must be released even on failure
    mock_release.assert_called_once()


def test_freshness_status_evaluations():
    """Verify distinction between fresh, stale, outdated, and unavailable data."""
    now = datetime.now(timezone.utc)
    mock_db = MagicMock()

    # Case 1: Fresh observation (1 hour ago)
    mock_db.query.return_value.scalar.side_effect = [
        now - timedelta(hours=1),  # latest_obs
        now,                       # latest_ingest
    ]
    mock_db.query.return_value.order_by.return_value.first.return_value = None

    status_fresh = get_freshness_status(mock_db)
    assert status_fresh["freshness_status"] == "fresh"
    assert status_fresh["is_stale"] is False
    assert status_fresh["observation_age_hours"] == 1.0

    # Case 2: Stale observation (6 hours ago > 4.0h threshold)
    mock_db.query.return_value.scalar.side_effect = [
        now - timedelta(hours=6),
        now,
    ]
    status_stale = get_freshness_status(mock_db)
    assert status_stale["freshness_status"] == "stale"
    assert status_stale["is_stale"] is True
    assert status_stale["observation_age_hours"] == 6.0

    # Case 3: Outdated observation (36 hours ago > 24.0h threshold)
    mock_db.query.return_value.scalar.side_effect = [
        now - timedelta(hours=36),
        now,
    ]
    status_outdated = get_freshness_status(mock_db)
    assert status_outdated["freshness_status"] == "outdated"
    assert status_outdated["is_stale"] is True

    # Case 4: Unavailable (no observations recorded)
    mock_db.query.return_value.scalar.side_effect = [None, None]
    status_unavail = get_freshness_status(mock_db)
    assert status_unavail["freshness_status"] == "unavailable"
    assert status_unavail["is_stale"] is True


@pytest.mark.asyncio
async def test_scheduler_graceful_stop():
    """Verify scheduler stops gracefully without hanging."""
    sched = CPCBIngestionScheduler(interval_seconds=1, enabled=True)
    task = sched.start()
    assert sched.is_running is True

    await asyncio.sleep(0.05)
    await sched.stop()
    assert sched.is_running is False
    await asyncio.sleep(0.05)

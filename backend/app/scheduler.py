import asyncio
import logging
import signal
import sys
from typing import Optional
from datetime import datetime, timezone

from app.core.config import settings
from app.db.database import SessionLocal
from app.services.ingestion_service import execute_cpcb_ingestion, get_freshness_status

logger = logging.getLogger("saans.scheduler")


class CPCBIngestionScheduler:
    """
    Periodic CPCB/data.gov.in Ingestion Scheduler.
    
    Provides reliable, non-blocking scheduled polling with:
    - Configurable refresh interval (default: 900s / 15m)
    - Graceful cancellation & interruptible sleeps
    - Process-level & distributed overlap prevention via PostgreSQL advisory lock
    - Bounded exponential retries (never retries indefinitely)
    - Secret hygiene (zero credential logging)
    """

    def __init__(
        self,
        interval_seconds: Optional[int] = None,
        enabled: Optional[bool] = None,
    ):
        self.interval_seconds = (
            interval_seconds
            if interval_seconds is not None
            else settings.CPCB_INGESTION_INTERVAL_SECONDS
        )
        self.enabled = (
            enabled if enabled is not None else settings.CPCB_SCHEDULER_ENABLED
        )
        self.is_running = False
        self._task: Optional[asyncio.Task] = None
        self._stop_event = asyncio.Event()

    async def run_once(self) -> dict:
        """Execute a single ingestion cycle immediately."""
        logger.info("Executing on-demand CPCB ingestion cycle...")
        with SessionLocal() as db:
            result = await execute_cpcb_ingestion(db)
            return result

    async def _loop(self):
        """Main periodic polling loop."""
        logger.info(
            f"CPCB Scheduler started: interval={self.interval_seconds}s "
            f"({self.interval_seconds / 60:.1f}m), enabled={self.enabled}"
        )
        
        while self.is_running and not self._stop_event.is_set():
            if self.enabled:
                try:
                    logger.info("Scheduler cycle starting...")
                    with SessionLocal() as db:
                        result = await execute_cpcb_ingestion(db)
                        logger.info(f"Scheduler cycle finished: status={result.get('status')}")
                except Exception as e:
                    logger.error(f"Scheduler encountered an unexpected error: {type(e).__name__} - {e}")
            else:
                logger.info("Scheduler is disabled by configuration (CPCB_SCHEDULER_ENABLED=False). Skipping cycle.")

            # Interruptible sleep: wait for interval or until stop_event is signaled
            try:
                await asyncio.wait_for(self._stop_event.wait(), timeout=float(self.interval_seconds))
                # Stop event fired
                break
            except asyncio.TimeoutError:
                # Interval elapsed, proceed to next cycle
                continue

        logger.info("CPCB Scheduler loop terminated gracefully.")

    def start(self) -> asyncio.Task:
        """Start the scheduler background task in the running event loop."""
        if self.is_running:
            logger.warning("Scheduler start requested but already running.")
            return self._task

        self.is_running = True
        self._stop_event.clear()
        self._task = asyncio.create_task(self._loop(), name="cpcb_periodic_scheduler")
        return self._task

    async def stop(self):
        """Signal the scheduler to stop and await task termination."""
        if not self.is_running:
            return

        logger.info("Stopping CPCB Scheduler...")
        self.is_running = False
        self._stop_event.set()
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._task = None
        logger.info("CPCB Scheduler stopped.")


# Global singleton instance for application use
scheduler = CPCBIngestionScheduler()


async def run_standalone_worker():
    """Entrypoint for standalone worker process."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    loop = asyncio.get_running_loop()
    worker_scheduler = CPCBIngestionScheduler()

    def handle_signal():
        logger.info("Received termination signal. Shutting down worker...")
        asyncio.create_task(worker_scheduler.stop())

    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, handle_signal)
        except NotImplementedError:
            # Signal handling on Windows
            pass

    task = worker_scheduler.start()
    try:
        await task
    except asyncio.CancelledError:
        pass


if __name__ == "__main__":
    try:
        asyncio.run(run_standalone_worker())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Worker process terminated.")

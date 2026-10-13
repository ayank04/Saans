import sys
import argparse
import asyncio
import logging
from pathlib import Path

# Add backend to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.scheduler import CPCBIngestionScheduler, run_standalone_worker
from app.core.config import settings

def main():
    parser = argparse.ArgumentParser(description="SAANS CPCB Ingestion Scheduler Worker")
    parser.add_argument(
        "--interval",
        type=int,
        default=None,
        help=f"Refresh interval in seconds (default from env: {settings.CPCB_INGESTION_INTERVAL_SECONDS}s)"
    )
    parser.add_argument(
        "--run-once",
        action="store_true",
        help="Run a single ingestion cycle immediately and exit"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable DEBUG logging level"
    )
    args = parser.parse_args()

    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )
    # Ensure sensitive query parameters (API keys) are never logged by HTTP client loggers
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    scheduler = CPCBIngestionScheduler(interval_seconds=args.interval)

    if args.run_once:
        print("[SAANS Scheduler] Running single ingestion cycle...")
        result = asyncio.run(scheduler.run_once())
        print(f"[SAANS Scheduler] Completed cycle with status: {result.get('status')}")
        if result.get("records_inserted") is not None:
            print(f"  Records fetched: {result.get('records_fetched')}")
            print(f"  Records inserted: {result.get('records_inserted')}")
            print(f"  Records skipped: {result.get('records_skipped_as_duplicates')}")
        sys.exit(0 if result.get("status") in ("completed", "skipped") else 1)
    else:
        print(f"[SAANS Scheduler] Starting background worker loop (interval={scheduler.interval_seconds}s)...")
        print("Press Ctrl+C to terminate.")
        try:
            asyncio.run(run_standalone_worker())
        except (KeyboardInterrupt, SystemExit):
            print("\n[SAANS Scheduler] Worker stopped cleanly.")

if __name__ == "__main__":
    main()

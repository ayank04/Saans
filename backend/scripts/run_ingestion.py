import sys
import asyncio
import logging
from pathlib import Path

# Add backend to path for module importing
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.database import SessionLocal
from app.ingestion.sources.open_meteo import OpenMeteoFetcher
from app.ingestion.normalizers.open_meteo import OpenMeteoNormalizer
from app.ingestion.pipeline import IngestionPipeline

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

async def main():
    db = SessionLocal()
    try:
        fetcher = OpenMeteoFetcher()
        normalizer = OpenMeteoNormalizer()
        pipeline = IngestionPipeline(db, fetcher, normalizer, "Open-Meteo")
        
        result = await pipeline.run(latitude=12.9716, longitude=77.5946)
        
        print("\n--- Ingestion Result ---")
        print(f"Status: {result.status}")
        print(f"Fetched: {result.records_fetched}")
        print(f"Accepted: {result.records_accepted}")
        print(f"Inserted: {result.records_inserted}")
        print(f"Skipped (Dupes): {result.records_skipped_as_duplicates}")
        if result.errors:
            print(f"Errors: {result.errors}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())

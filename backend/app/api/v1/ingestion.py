import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError, SQLAlchemyError

from app.db.database import get_db
from app.services.ingestion_service import get_freshness_status, execute_cpcb_ingestion
from app.schemas.ingestion import IngestionStatusResponse, IngestionTriggerResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ingestion", tags=["ingestion"])


@router.get("/status", response_model=IngestionStatusResponse)
def get_ingestion_status(db: Session = Depends(get_db)):
    """
    Expose latest successful ingestion time, source observation timestamp,
    staleness evaluation, and scheduler configuration.
    """
    try:
        status_data = get_freshness_status(db)
        return IngestionStatusResponse(**status_data)
    except OperationalError as e:
        logger.error(f"Database error in get_ingestion_status: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable."
        )
    except Exception as e:
        logger.error(f"Unexpected error in get_ingestion_status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve ingestion status: {str(e)}"
        )


@router.post("/trigger", response_model=IngestionTriggerResponse)
async def trigger_ingestion(db: Session = Depends(get_db)):
    """
    Trigger an on-demand CPCB ingestion cycle.
    Respects in-process and PostgreSQL advisory locks to prevent overlapping runs.
    """
    try:
        result = await execute_cpcb_ingestion(db)
        if result.get("status") == "skipped":
            msg = result.get("message") or result.get("reason") or "Ingestion skipped."
            return IngestionTriggerResponse(
                status="skipped",
                message=msg,
                details=result
            )
        elif result.get("status") == "completed":
            return IngestionTriggerResponse(
                status="completed",
                message=(
                    f"Successfully ingested CPCB data: {result.get('records_inserted', 0)} inserted, "
                    f"{result.get('records_skipped_as_duplicates', 0)} duplicates skipped."
                ),
                details=result
            )
        else:
            return IngestionTriggerResponse(
                status="failed",
                message=f"Ingestion run failed: {result.get('error')}",
                details=result
            )
    except OperationalError as e:
        logger.error(f"Database error in trigger_ingestion: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable."
        )
    except Exception as e:
        logger.error(f"Unexpected error in trigger_ingestion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion execution failed: {str(e)}"
        )

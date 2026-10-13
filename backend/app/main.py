from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.stations import router as stations_router
from app.api.v1.ingestion import router as ingestion_router
from app.scheduler import scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Optional embedded scheduler if enabled via configuration
    if settings.ENABLE_EMBEDDED_SCHEDULER:
        scheduler.start()
    yield
    if scheduler.is_running:
        await scheduler.stop()

app = FastAPI(
    title="SAANS Backend API",
    description="Backend API for Hyperlocal Air Intelligence for Bengaluru",
    version="0.1.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stations_router, prefix="/api/v1")
app.include_router(ingestion_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "saans-backend"
    }


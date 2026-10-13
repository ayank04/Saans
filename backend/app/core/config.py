from pathlib import Path
from typing import List, Union, Any
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(ROOT_DIR / ".env"), ".env", "backend/.env"),
        extra="ignore"
    )

    DATABASE_URL: str = "postgresql+psycopg2://saans_user:saans_password@localhost:5432/saans"
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173", "*"]
    NASA_FIRMS_API_KEY: str = ""
    DATA_GOV_IN_API_KEY: str = ""
    OPENAQ_API_KEY: str = ""

    # Periodic Ingestion & Freshness Configuration
    CPCB_INGESTION_INTERVAL_SECONDS: int = 900  # Default: 15 minutes (900 seconds)
    CPCB_SCHEDULER_ENABLED: bool = True
    ENABLE_EMBEDDED_SCHEDULER: bool = False  # Default False so multiple workers don't start duplicate schedulers
    CPCB_MAX_RETRIES: int = 3
    CPCB_RETRY_BACKOFF_SECONDS: float = 2.0
    DATA_STALENESS_HOURS: float = 4.0

    @field_validator("DATABASE_URL")
    @classmethod
    def sanitize_database_url(cls, v: str) -> str:
        """
        Safely ensure password in DATABASE_URL is URL-encoded if it contains '@'.
        Preserves scheme, host, port, database, and query params without double-encoding.
        """
        if not v or "://" not in v:
            return v
        scheme, rest = v.split("://", 1)
        last_at = rest.rfind("@")
        if last_at != -1:
            userinfo = rest[:last_at]
            host_part = rest[last_at + 1:]
            if ":" in userinfo:
                user, pwd = userinfo.split(":", 1)
                if "%40" not in pwd and "@" in pwd:
                    from urllib.parse import quote
                    pwd = quote(pwd, safe="")
                    return f"{scheme}://{user}:{pwd}@{host_part}"
        return v

    @field_validator("CORS_ORIGINS")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

settings = Settings()

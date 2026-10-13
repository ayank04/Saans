class IngestionError(Exception):
    """Base exception for ingestion errors."""
    pass

class FetchError(IngestionError):
    """Raised when fetching data from an external API fails."""
    pass

class ValidationError(IngestionError):
    """Raised when raw data fails schema validation."""
    pass

class NormalizationError(IngestionError):
    """Raised when data cannot be normalized into the domain model."""
    pass

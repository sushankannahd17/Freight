"""
Structured Logging Configuration for FreightIQ

Provides JSON-structured logs with request IDs, provider tracking, and performance metrics.
"""

import logging
import sys
import uuid
from contextvars import ContextVar
from typing import Any, Dict

from pythonjsonlogger import jsonlogger

from app.core.config import settings

# Context variable for request tracking
request_id_var: ContextVar[str] = ContextVar("request_id", default="")


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional fields."""

    def add_fields(
        self,
        log_record: Dict[str, Any],
        record: logging.LogRecord,
        message_dict: Dict[str, Any],
    ) -> None:
        """Add custom fields to log record."""
        super().add_fields(log_record, record, message_dict)

        # Add standard fields
        log_record["timestamp"] = self.formatTime(record, self.datefmt)
        log_record["level"] = record.levelname
        log_record["logger"] = record.name
        log_record["app"] = settings.app_name
        log_record["environment"] = settings.environment

        # Add request ID if available
        request_id = request_id_var.get()
        if request_id:
            log_record["request_id"] = request_id

        # Add function context
        if record.funcName:
            log_record["function"] = record.funcName
        if record.pathname:
            log_record["file"] = record.pathname
        if record.lineno:
            log_record["line"] = record.lineno


def setup_logging() -> None:
    """Configure structured logging for the application."""

    # Create handler
    handler = logging.StreamHandler(sys.stdout)

    # Set formatter
    formatter = CustomJsonFormatter(
        "%(timestamp)s %(level)s %(logger)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )
    handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.log_level.upper()))
    root_logger.addHandler(handler)

    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("celery").setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a specific module.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Logger instance
    """
    return logging.getLogger(name)


def set_request_id(request_id: str | None = None) -> str:
    """
    Set request ID for current context.

    Args:
        request_id: Optional request ID, generates one if not provided

    Returns:
        The request ID that was set
    """
    if request_id is None:
        request_id = str(uuid.uuid4())
    request_id_var.set(request_id)
    return request_id


def get_request_id() -> str:
    """
    Get current request ID.

    Returns:
        Current request ID or empty string
    """
    return request_id_var.get()


# Provider-specific logging helpers
def log_provider_request(
    logger: logging.Logger,
    provider: str,
    endpoint: str,
    **kwargs: Any,
) -> None:
    """Log API provider request."""
    logger.info(
        "API provider request",
        extra={
            "event_type": "provider_request",
            "provider": provider,
            "endpoint": endpoint,
            **kwargs,
        },
    )


def log_provider_response(
    logger: logging.Logger,
    provider: str,
    endpoint: str,
    status_code: int,
    latency_ms: float,
    **kwargs: Any,
) -> None:
    """Log API provider response."""
    logger.info(
        "API provider response",
        extra={
            "event_type": "provider_response",
            "provider": provider,
            "endpoint": endpoint,
            "status_code": status_code,
            "latency_ms": latency_ms,
            **kwargs,
        },
    )


def log_provider_error(
    logger: logging.Logger,
    provider: str,
    endpoint: str,
    error: str,
    **kwargs: Any,
) -> None:
    """Log API provider error."""
    logger.error(
        "API provider error",
        extra={
            "event_type": "provider_error",
            "provider": provider,
            "endpoint": endpoint,
            "error": error,
            **kwargs,
        },
    )


def log_ingestion_start(
    logger: logging.Logger,
    provider: str,
    ingestion_type: str,
    **kwargs: Any,
) -> None:
    """Log data ingestion start."""
    logger.info(
        "Data ingestion started",
        extra={
            "event_type": "ingestion_start",
            "provider": provider,
            "ingestion_type": ingestion_type,
            **kwargs,
        },
    )


def log_ingestion_complete(
    logger: logging.Logger,
    provider: str,
    ingestion_type: str,
    records_received: int,
    records_inserted: int,
    records_updated: int,
    records_rejected: int,
    duration_seconds: float,
    **kwargs: Any,
) -> None:
    """Log data ingestion completion."""
    logger.info(
        "Data ingestion completed",
        extra={
            "event_type": "ingestion_complete",
            "provider": provider,
            "ingestion_type": ingestion_type,
            "records_received": records_received,
            "records_inserted": records_inserted,
            "records_updated": records_updated,
            "records_rejected": records_rejected,
            "duration_seconds": duration_seconds,
            **kwargs,
        },
    )


def log_forecast_generated(
    logger: logging.Logger,
    model_name: str,
    model_version: str,
    route: str,
    horizon_days: int,
    latency_ms: float,
    **kwargs: Any,
) -> None:
    """Log forecast generation."""
    logger.info(
        "Forecast generated",
        extra={
            "event_type": "forecast_generated",
            "model_name": model_name,
            "model_version": model_version,
            "route": route,
            "horizon_days": horizon_days,
            "latency_ms": latency_ms,
            **kwargs,
        },
    )

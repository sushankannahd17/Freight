"""
Common Pydantic schemas and base classes.
"""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class DataStatusEnum(str, Enum):
    """Data origin and reliability status."""

    OBSERVED = "OBSERVED"
    DERIVED = "DERIVED"
    MODELLED = "MODELLED"
    ESTIMATED = "ESTIMATED"
    ASSUMED = "ASSUMED"
    SYNTHETIC = "SYNTHETIC"


class DataQualityEnum(str, Enum):
    """Data quality classification."""

    EXCELLENT = "EXCELLENT"
    GOOD = "GOOD"
    FAIR = "FAIR"
    POOR = "POOR"
    UNKNOWN = "UNKNOWN"


class ProviderStatusEnum(str, Enum):
    """Data provider availability status."""

    LIVE = "LIVE"
    RECENT = "RECENT"
    STALE = "STALE"
    UNAVAILABLE = "UNAVAILABLE"
    CONFIGURATION_REQUIRED = "CONFIGURATION_REQUIRED"


class TimestampMixin(BaseModel):
    """Timestamp fields for created/updated tracking."""

    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class ProvenanceInfo(BaseModel):
    """Data provenance information."""

    source_id: str = Field(..., description="Source system identifier")
    source_name: str = Field(..., description="Human-readable source name")
    source_url: str | None = Field(None, description="Source URL")
    retrieved_at: datetime = Field(..., description="When data was retrieved")
    published_at: datetime | None = Field(None, description="Official publication time")
    valid_from: datetime = Field(..., description="Validity start")
    valid_to: datetime | None = Field(None, description="Validity end")
    data_status: DataStatusEnum = Field(..., description="Data classification")
    data_quality: DataQualityEnum = Field(..., description="Data quality assessment")


class DataFreshnessResponse(BaseModel):
    """Data freshness status."""

    status: ProviderStatusEnum = Field(..., description="Provider status")
    last_updated: datetime | None = Field(None, description="Last successful update")
    data_age_minutes: int | None = Field(None, description="Age of data in minutes")
    source: str = Field(..., description="Data source name")

    model_config = ConfigDict(from_attributes=True)


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Overall status")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    environment: str = Field(..., description="Environment")
    components: dict = Field(..., description="Component health status")

    model_config = ConfigDict(from_attributes=True)


class PaginationParams(BaseModel):
    """Pagination parameters."""

    page: int = Field(1, ge=1, description="Page number")
    page_size: int = Field(50, ge=1, le=1000, description="Items per page")

    @property
    def offset(self) -> int:
        """Calculate offset for database query."""
        return (self.page - 1) * self.page_size


class PaginatedResponse(BaseModel):
    """Paginated response wrapper."""

    items: list = Field(..., description="Items in current page")
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")

    model_config = ConfigDict(from_attributes=True)

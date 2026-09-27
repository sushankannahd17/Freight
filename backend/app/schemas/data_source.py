"""
Data source schemas for provenance tracking.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import DataStatusEnum, ProviderStatusEnum, TimestampMixin


class DataSourceBase(BaseModel):
    """Base data source schema."""

    source_id: str = Field(..., min_length=1, max_length=100, description="Unique source ID")
    source_name: str = Field(..., min_length=1, max_length=255, description="Source name")
    source_type: str = Field(..., description="Source type (API, FILE, DB, MANUAL)")
    provider: str = Field(..., description="Provider name")
    base_url: str | None = Field(None, description="Base URL for API sources")
    requires_auth: bool = Field(False, description="Whether authentication is required")
    is_active: bool = Field(True, description="Whether source is active")
    update_frequency: str | None = Field(None, description="Update frequency")


class DataSourceCreate(DataSourceBase):
    """Schema for creating a data source."""

    pass


class DataSourceUpdate(BaseModel):
    """Schema for updating a data source."""

    source_name: str | None = None
    base_url: str | None = None
    is_active: bool | None = None
    update_frequency: str | None = None
    last_successful_fetch: datetime | None = None


class DataSourceResponse(DataSourceBase, TimestampMixin):
    """Data source response schema."""

    id: int = Field(..., description="Database ID")
    last_successful_fetch: datetime | None = Field(None, description="Last successful fetch")

    model_config = ConfigDict(from_attributes=True)


class DataIngestionRunBase(BaseModel):
    """Base ingestion run schema."""

    run_id: str = Field(..., description="Unique run identifier")
    source_id: int = Field(..., description="Data source ID")
    status: str = Field(..., description="Run status (RUNNING, SUCCESS, FAILED)")
    records_received: int = Field(0, ge=0, description="Records received")
    records_inserted: int = Field(0, ge=0, description="Records inserted")
    records_updated: int = Field(0, ge=0, description="Records updated")
    records_rejected: int = Field(0, ge=0, description="Records rejected")
    errors: list[str] | None = Field(None, description="Error messages")
    raw_payload_path: str | None = Field(None, description="Path to raw payload")


class DataIngestionRunCreate(BaseModel):
    """Schema for creating an ingestion run."""

    run_id: str
    source_id: int


class DataIngestionRunUpdate(BaseModel):
    """Schema for updating an ingestion run."""

    status: str | None = None
    completed_at: datetime | None = None
    records_received: int | None = None
    records_inserted: int | None = None
    records_updated: int | None = None
    records_rejected: int | None = None
    errors: list[str] | None = None
    raw_payload_path: str | None = None


class DataIngestionRunResponse(DataIngestionRunBase, TimestampMixin):
    """Ingestion run response schema."""

    id: int = Field(..., description="Database ID")
    started_at: datetime = Field(..., description="Start timestamp")
    completed_at: datetime | None = Field(None, description="Completion timestamp")
    duration_seconds: float | None = Field(None, description="Duration in seconds")

    model_config = ConfigDict(from_attributes=True)


class DataQualityCheckBase(BaseModel):
    """Base quality check schema."""

    run_id: str = Field(..., description="Ingestion run ID")
    table_name: str = Field(..., description="Table name")
    check_type: str = Field(..., description="Type of check")
    passed: bool = Field(..., description="Whether check passed")
    records_checked: int = Field(0, ge=0, description="Records checked")
    records_failed: int = Field(0, ge=0, description="Records failed")
    failure_details: dict | None = Field(None, description="Failure details")


class DataQualityCheckCreate(DataQualityCheckBase):
    """Schema for creating a quality check."""

    pass


class DataQualityCheckResponse(DataQualityCheckBase, TimestampMixin):
    """Quality check response schema."""

    id: int = Field(..., description="Database ID")
    check_time: datetime = Field(..., description="Check timestamp")

    model_config = ConfigDict(from_attributes=True)


class DataSourceStatusResponse(BaseModel):
    """Data source status summary."""

    source: DataSourceResponse
    status: ProviderStatusEnum
    last_run: DataIngestionRunResponse | None = None
    total_runs: int = Field(..., description="Total ingestion runs")
    success_rate: float = Field(..., ge=0, le=1, description="Success rate (0-1)")
    data_freshness_hours: float | None = Field(None, description="Hours since last data")

    model_config = ConfigDict(from_attributes=True)

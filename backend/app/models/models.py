"""
FreightIQ Database Models - Consolidated

All database models for the freight intelligence platform.
"""

from datetime import datetime
from typing import Any, List

from geoalchemy2 import Geography, Geometry
from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import (
    DataProvenanceMixin,
    GeospatialMixin,
    TimestampMixin,
)


# ============================================================================
# MARKET TABLES
# ============================================================================
class FreightRate(Base, TimestampMixin, DataProvenanceMixin):
    """Freight rates for specific routes."""

    __tablename__ = "freight_rates"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    date: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)
    route_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    vessel_class: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    rate_usd_per_mt: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")

    __table_args__ = (
        Index("idx_freight_rates_date_route", "date", "route_id"),
        UniqueConstraint("date", "route_id", "vessel_class", "source_id",
                        name="uq_freight_rate_observation"),
    )


class FreightIndex(Base, TimestampMixin, DataProvenanceMixin):
    """Baltic Exchange indices (BDI, BCI, BPI, BSI, BHSI)."""

    __tablename__ = "freight_indices"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    date: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)
    index_code: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    index_name: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    change: Mapped[float | None] = mapped_column(Float, nullable=True)
    change_percent: Mapped[float | None] = mapped_column(Float, nullable=True)

    __table_args__ = (
        UniqueConstraint("date", "index_code", "source_id", name="uq_index_observation"),
    )


# ============================================================================
# VESSEL TABLES
# ============================================================================
class Vessel(Base, TimestampMixin):
    """Vessel master data."""

    __tablename__ = "vessels"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    imo: Mapped[int] = mapped_column(Integer, unique=True, nullable=False, index=True)
    mmsi: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    vessel_name: Mapped[str] = mapped_column(String(255), nullable=False)
    vessel_class: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    vessel_type: Mapped[str] = mapped_column(String(100), nullable=False)

    # Dimensions
    dwt: Mapped[int] = mapped_column(Integer, nullable=False)
    loa_m: Mapped[float] = mapped_column(Float, nullable=False)
    beam_m: Mapped[float] = mapped_column(Float, nullable=False)
    draft_m: Mapped[float] = mapped_column(Float, nullable=False)

    # Build info
    built_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    flag: Mapped[str | None] = mapped_column(String(3), nullable=True)

    positions: Mapped[List["VesselPosition"]] = relationship(
        back_populates="vessel", cascade="all, delete-orphan"
    )


class VesselPosition(Base, TimestampMixin, GeospatialMixin, DataProvenanceMixin):
    """Real-time vessel positions from AIS."""

    __tablename__ = "vessel_positions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    vessel_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("vessels.id"), nullable=False, index=True
    )
    imo: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    # AIS data
    speed_knots: Mapped[float | None] = mapped_column(Float, nullable=True)
    course_degrees: Mapped[float | None] = mapped_column(Float, nullable=True)
    heading_degrees: Mapped[int | None] = mapped_column(Integer, nullable=True)
    navigation_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    destination: Mapped[str | None] = mapped_column(String(255), nullable=True)
    eta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    vessel: Mapped["Vessel"] = relationship(back_populates="positions")

    __table_args__ = (
        Index("idx_vessel_positions_spatial", "location", postgresql_using="gist"),
        Index("idx_vessel_positions_timestamp", "timestamp"),
    )


# ============================================================================
# PORT TABLES
# ============================================================================
class Port(Base, TimestampMixin, GeospatialMixin):
    """Port master data."""

    __tablename__ = "ports"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    port_code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    port_name: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[str] = mapped_column(String(3), nullable=False)
    region: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Port type
    is_origin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_destination: Mapped[bool] = mapped_column(Boolean, default=False)

    berths: Mapped[List["PortBerth"]] = relationship(
        back_populates="port", cascade="all, delete-orphan"
    )


class PortBerth(Base, TimestampMixin):
    """Port berth-level constraints."""

    __tablename__ = "port_berths"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    port_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("ports.id"), nullable=False, index=True
    )
    berth_name: Mapped[str] = mapped_column(String(255), nullable=False)
    terminal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Physical constraints
    max_loa_m: Mapped[float] = mapped_column(Float, nullable=False)
    max_beam_m: Mapped[float] = mapped_column(Float, nullable=False)
    max_draft_m: Mapped[float] = mapped_column(Float, nullable=False)
    max_dwt: Mapped[int | None] = mapped_column(Integer, nullable=True)
    berth_length_m: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Operational
    loading_rate_tph: Mapped[int | None] = mapped_column(Integer, nullable=True)
    discharge_rate_tph: Mapped[int | None] = mapped_column(Integer, nullable=True)
    storage_capacity_mt: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Restrictions
    tide_restricted: Mapped[bool] = mapped_column(Boolean, default=False)
    channel_restricted: Mapped[bool] = mapped_column(Boolean, default=False)

    port: Mapped["Port"] = relationship(back_populates="berths")


class PortCongestion(Base, TimestampMixin, DataProvenanceMixin):
    """Port congestion metrics."""

    __tablename__ = "port_congestion"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    port_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("ports.id"), nullable=False, index=True
    )
    date: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)

    # Observed data
    vessels_waiting: Mapped[int] = mapped_column(Integer, nullable=False)
    vessels_at_berth: Mapped[int] = mapped_column(Integer, nullable=False)
    avg_waiting_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    avg_turnaround_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    berth_utilization_pct: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Derived metric
    congestion_index: Mapped[float | None] = mapped_column(Float, nullable=True)


# ============================================================================
# WEATHER TABLES
# ============================================================================
class WeatherObservation(Base, TimestampMixin, GeospatialMixin, DataProvenanceMixin):
    """Weather observations."""

    __tablename__ = "weather_observations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    observation_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    temperature_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind_speed_knots: Mapped[float | None] = mapped_column(Float, nullable=True)
    wind_direction_degrees: Mapped[int | None] = mapped_column(Integer, nullable=True)
    precipitation_mm: Mapped[float | None] = mapped_column(Float, nullable=True)
    visibility_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    pressure_hpa: Mapped[float | None] = mapped_column(Float, nullable=True)


class MarineCondition(Base, TimestampMixin, GeospatialMixin, DataProvenanceMixin):
    """Marine and ocean conditions."""

    __tablename__ = "marine_conditions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    observation_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    # Wave data
    wave_height_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    wave_direction_degrees: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wave_period_s: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Swell
    swell_height_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    swell_direction_degrees: Mapped[int | None] = mapped_column(Integer, nullable=True)
    swell_period_s: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Current
    current_speed_knots: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_direction_degrees: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Ocean
    sea_surface_temp_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    sea_level_m: Mapped[float | None] = mapped_column(Float, nullable=True)


# ============================================================================
# TRADE TABLES
# ============================================================================
class TradeFlow(Base, TimestampMixin, DataProvenanceMixin):
    """International trade flows."""

    __tablename__ = "trade_flows"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    period: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)
    reporter_country: Mapped[str] = mapped_column(String(3), nullable=False, index=True)
    partner_country: Mapped[str] = mapped_column(String(3), nullable=False, index=True)
    hs_code: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    commodity_name: Mapped[str] = mapped_column(String(255), nullable=False)

    quantity_mt: Mapped[float | None] = mapped_column(Float, nullable=True)
    value_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str | None] = mapped_column(String(20), nullable=True)


class CoalImport(Base, TimestampMixin, DataProvenanceMixin):
    """Coal import statistics (India Ministry of Coal)."""

    __tablename__ = "coal_imports"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    period: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)
    origin_country: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    coal_type: Mapped[str] = mapped_column(String(50), nullable=False)  # coking/non-coking

    quantity_mt: Mapped[float] = mapped_column(Float, nullable=False)
    value_inr: Mapped[float | None] = mapped_column(Float, nullable=True)

    source_document: Mapped[str | None] = mapped_column(Text, nullable=True)
    table_number: Mapped[str | None] = mapped_column(String(50), nullable=True)


# ============================================================================
# ECONOMICS TABLES
# ============================================================================
class FuelPrice(Base, TimestampMixin, DataProvenanceMixin):
    """Bunker fuel prices."""

    __tablename__ = "fuel_prices"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    date: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    fuel_type: Mapped[str] = mapped_column(String(50), nullable=False)  # VLSFO, HSFO, MGO

    price_usd_per_mt: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")


class FXRate(Base, TimestampMixin, DataProvenanceMixin):
    """Foreign exchange rates."""

    __tablename__ = "fx_rates"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    date: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)
    from_currency: Mapped[str] = mapped_column(String(3), nullable=False, index=True)
    to_currency: Mapped[str] = mapped_column(String(3), nullable=False, index=True)
    rate: Mapped[float] = mapped_column(Float, nullable=False)

    __table_args__ = (
        UniqueConstraint("date", "from_currency", "to_currency", "source_id",
                        name="uq_fx_rate_observation"),
    )


# ============================================================================
# ROUTE TABLES
# ============================================================================
class SeaRoute(Base, TimestampMixin):
    """Predefined sea routes."""

    __tablename__ = "sea_routes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    route_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    route_name: Mapped[str] = mapped_column(String(255), nullable=False)

    origin_port_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("ports.id"), nullable=False
    )
    destination_port_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("ports.id"), nullable=False
    )

    distance_nm: Mapped[float] = mapped_column(Float, nullable=False)
    typical_duration_days: Mapped[float | None] = mapped_column(Float, nullable=True)

    # PostGIS geometry for route path
    route_geometry: Mapped[Any | None] = mapped_column(
        Geography(geometry_type="LINESTRING", srid=4326), nullable=True
    )


# ============================================================================
# ML TABLES
# ============================================================================
class ModelRegistry(Base, TimestampMixin):
    """ML model registry."""

    __tablename__ = "model_registry"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    model_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    model_type: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # MLflow integration
    mlflow_experiment_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mlflow_run_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    versions: Mapped[List["ModelVersion"]] = relationship(
        back_populates="model", cascade="all, delete-orphan"
    )


class ModelVersion(Base, TimestampMixin):
    """Model versions."""

    __tablename__ = "model_versions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    model_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("model_registry.id"), nullable=False, index=True
    )
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    is_production: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    training_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    training_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    training_cutoff: Mapped[datetime] = mapped_column(Date, nullable=False)

    hyperparameters: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    metrics: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    artifact_path: Mapped[str | None] = mapped_column(Text, nullable=True)

    model: Mapped["ModelRegistry"] = relationship(back_populates="versions")

    __table_args__ = (
        UniqueConstraint("model_id", "version", name="uq_model_version"),
    )


class Prediction(Base, TimestampMixin):
    """Model predictions."""

    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    model_version_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("model_versions.id"), nullable=False, index=True
    )

    prediction_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    target_date: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)
    horizon_days: Mapped[int] = mapped_column(Integer, nullable=False)

    route_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    vessel_class: Mapped[str | None] = mapped_column(String(50), nullable=True)

    prediction: Mapped[float] = mapped_column(Float, nullable=False)
    lower_bound: Mapped[float | None] = mapped_column(Float, nullable=True)
    upper_bound: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    features_used: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    shap_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)


# ============================================================================
# OPTIMIZATION TABLES
# ============================================================================
class VoyageCalculation(Base, TimestampMixin):
    """Voyage cost calculations."""

    __tablename__ = "voyage_calculations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    calculation_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    route_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    vessel_imo: Mapped[int] = mapped_column(Integer, nullable=False)
    cargo_mt: Mapped[float] = mapped_column(Float, nullable=False)

    # Time components
    sailing_time_hours: Mapped[float] = mapped_column(Float, nullable=False)
    loading_time_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    discharge_time_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    port_waiting_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    weather_delay_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_duration_hours: Mapped[float] = mapped_column(Float, nullable=False)

    # Cost components
    freight_cost_usd: Mapped[float] = mapped_column(Float, nullable=False)
    fuel_cost_usd: Mapped[float] = mapped_column(Float, nullable=False)
    port_cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    canal_cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    demurrage_usd: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_cost_usd: Mapped[float] = mapped_column(Float, nullable=False)
    cost_per_mt_usd: Mapped[float] = mapped_column(Float, nullable=False)

    calculation_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class Recommendation(Base, TimestampMixin):
    """Charter recommendations."""

    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    request_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    route_id: Mapped[str] = mapped_column(String(100), nullable=False)
    cargo_mt: Mapped[float] = mapped_column(Float, nullable=False)

    # Recommendation
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # CHARTER, WAIT
    vessel_class: Mapped[str] = mapped_column(String(50), nullable=False)
    vessel_count: Mapped[int] = mapped_column(Integer, nullable=False)

    expected_cost_per_mt: Mapped[float] = mapped_column(Float, nullable=False)
    forecast_lower: Mapped[float | None] = mapped_column(Float, nullable=True)
    forecast_upper: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)  # LOW, MEDIUM, HIGH

    reasoning: Mapped[list | None] = mapped_column(JSON, nullable=True)
    model_version_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("model_versions.id"), nullable=True
    )


# ============================================================================
# DATA GOVERNANCE TABLES
# ============================================================================
class DataSource(Base, TimestampMixin):
    """Registry of data sources."""

    __tablename__ = "data_sources"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    source_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    source_name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(100), nullable=False)  # API, FILE, DB
    provider: Mapped[str] = mapped_column(String(255), nullable=False)

    base_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    requires_auth: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    update_frequency: Mapped[str | None] = mapped_column(String(50), nullable=True)
    last_successful_fetch: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    ingestion_runs: Mapped[List["DataIngestionRun"]] = relationship(
        back_populates="source", cascade="all, delete-orphan"
    )


class DataIngestionRun(Base, TimestampMixin):
    """Data ingestion execution records."""

    __tablename__ = "data_ingestion_runs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    run_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    source_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("data_sources.id"), nullable=False, index=True
    )

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # RUNNING, SUCCESS, FAILED

    records_received: Mapped[int] = mapped_column(Integer, default=0)
    records_inserted: Mapped[int] = mapped_column(Integer, default=0)
    records_updated: Mapped[int] = mapped_column(Integer, default=0)
    records_rejected: Mapped[int] = mapped_column(Integer, default=0)

    errors: Mapped[list | None] = mapped_column(JSON, nullable=True)
    raw_payload_path: Mapped[str | None] = mapped_column(Text, nullable=True)

    source: Mapped["DataSource"] = relationship(back_populates="ingestion_runs")


class DataQualityCheck(Base, TimestampMixin):
    """Data quality validation results."""

    __tablename__ = "data_quality_checks"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    run_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    table_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    check_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    check_type: Mapped[str] = mapped_column(String(100), nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False, index=True)

    records_checked: Mapped[int] = mapped_column(Integer, default=0)
    records_failed: Mapped[int] = mapped_column(Integer, default=0)
    failure_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)

"""
Voyage calculation schemas.
"""

from pydantic import BaseModel, ConfigDict, Field


class VesselCompatibilityRequest(BaseModel):
    """Request to check vessel-port compatibility."""

    vessel_imo: int = Field(..., description="Vessel IMO number")
    port_code: str = Field(..., description="Port code")
    berth_name: str | None = Field(None, description="Specific berth name")


class VesselCompatibilityResponse(BaseModel):
    """Vessel-port compatibility response."""

    compatible: bool = Field(..., description="Whether vessel is compatible")
    vessel_imo: int = Field(..., description="Vessel IMO number")
    port_code: str = Field(..., description="Port code")
    berth_name: str | None = Field(None, description="Berth name if specific")
    reasons: list[str] = Field(default_factory=list, description="Incompatibility reasons")
    vessel_dimensions: dict | None = Field(None, description="Vessel dimensions")
    berth_constraints: dict | None = Field(None, description="Berth constraints")

    model_config = ConfigDict(from_attributes=True)


class VoyageCalculationRequest(BaseModel):
    """Request for voyage cost calculation."""

    route_id: str = Field(..., description="Route identifier")
    vessel_imo: int = Field(..., description="Vessel IMO number")
    cargo_mt: float = Field(..., gt=0, description="Cargo quantity in MT")
    origin_port: str = Field(..., description="Origin port code")
    destination_port: str = Field(..., description="Destination port code")
    freight_rate_usd_per_mt: float | None = Field(None, description="Override freight rate")
    include_weather: bool = Field(True, description="Include weather delay estimates")
    include_congestion: bool = Field(True, description="Include port congestion")


class VoyageCalculationResponse(BaseModel):
    """Voyage calculation result."""

    route_id: str = Field(..., description="Route identifier")
    vessel_imo: int = Field(..., description="Vessel IMO number")
    cargo_mt: float = Field(..., description="Cargo quantity in MT")

    # Time components (hours)
    sailing_time_hours: float = Field(..., description="Sailing time")
    loading_time_hours: float | None = Field(None, description="Loading time")
    discharge_time_hours: float | None = Field(None, description="Discharge time")
    port_waiting_hours: float | None = Field(None, description="Port waiting time")
    weather_delay_hours: float | None = Field(None, description="Weather delay")
    total_duration_hours: float = Field(..., description="Total voyage duration")

    # Cost components (USD)
    freight_cost_usd: float = Field(..., description="Freight cost")
    fuel_cost_usd: float = Field(..., description="Fuel cost")
    port_cost_usd: float | None = Field(None, description="Port charges")
    canal_cost_usd: float | None = Field(None, description="Canal charges")
    demurrage_usd: float | None = Field(None, description="Demurrage")
    total_cost_usd: float = Field(..., description="Total voyage cost")
    cost_per_mt_usd: float = Field(..., description="Cost per tonne")

    # Additional details
    distance_nm: float | None = Field(None, description="Distance in nautical miles")
    effective_speed_knots: float | None = Field(None, description="Effective speed")
    calculation_timestamp: str = Field(..., description="Calculation timestamp")
    calculation_details: dict | None = Field(None, description="Detailed breakdown")

    model_config = ConfigDict(from_attributes=True)

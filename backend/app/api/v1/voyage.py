"""
Voyage calculation API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.schemas.voyage import (
    VesselCompatibilityRequest,
    VesselCompatibilityResponse,
    VoyageCalculationRequest,
    VoyageCalculationResponse,
)
from app.services.vessel_compatibility import VesselCompatibilityService
from app.services.voyage_service import VoyageCalculationService

router = APIRouter(prefix="/voyage", tags=["voyage"])


@router.post("/calculate", response_model=VoyageCalculationResponse)
async def calculate_voyage(
    request: VoyageCalculationRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Calculate comprehensive voyage costs.

    Calculates:
    - Sailing time based on distance and vessel speed
    - Loading/discharge time based on port facilities and cargo quantity
    - Port waiting time from congestion data
    - Weather delay estimates
    - Fuel consumption (laden + ballast)
    - Freight cost
    - Port charges
    - Demurrage
    - Total voyage cost
    - Cost per tonne

    Args:
        request: Voyage calculation parameters

    Returns:
        Detailed voyage calculation with time and cost breakdown

    Raises:
        HTTPException: If vessel or ports not found, or calculation fails
    """
    service = VoyageCalculationService(session)

    try:
        result = await service.calculate_voyage(request)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")


@router.post("/compatibility", response_model=VesselCompatibilityResponse)
async def check_vessel_compatibility(
    request: VesselCompatibilityRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Check vessel-port compatibility.

    Validates vessel against port/berth physical constraints:
    - Length overall (LOA)
    - Beam
    - Draft
    - Deadweight tonnage (DWT)

    Returns exact failure reasons if incompatible.

    Args:
        request: Compatibility check parameters

    Returns:
        Compatibility result with detailed reasons

    Example:
        ```json
        {
          "compatible": false,
          "reasons": [
            "Draft exceeds berth limit: 15.2m > 14.5m (excess: 0.7m)"
          ]
        }
        ```
    """
    service = VesselCompatibilityService(session)

    try:
        result = await service.check_compatibility(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compatibility check failed: {str(e)}")


@router.get("/compatible-vessels/{port_code}")
async def get_compatible_vessels(
    port_code: str,
    berth_name: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    """
    Get all vessels compatible with a port/berth.

    Args:
        port_code: Port code
        berth_name: Optional specific berth name

    Returns:
        List of compatible vessels
    """
    service = VesselCompatibilityService(session)

    try:
        vessels = await service.get_compatible_vessels(port_code, berth_name)
        return {
            "port_code": port_code,
            "berth_name": berth_name,
            "compatible_vessels": [
                {
                    "imo": v.imo,
                    "name": v.vessel_name,
                    "class": v.vessel_class,
                    "dwt": v.dwt,
                    "loa_m": v.loa_m,
                    "beam_m": v.beam_m,
                    "draft_m": v.draft_m,
                }
                for v in vessels
            ],
            "total": len(vessels),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

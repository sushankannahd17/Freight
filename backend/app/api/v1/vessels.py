"""
Vessel API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.vessels import Vessel, VesselPosition

router = APIRouter(prefix="/vessels", tags=["vessels"])


@router.get("")
async def get_vessels(
    vessel_class: str | None = None,
    min_dwt: int | None = None,
    max_dwt: int | None = None,
    limit: int = Query(100, ge=1, le=1000),
    session: AsyncSession = Depends(get_session),
):
    """
    Get vessels with optional filters.

    Args:
        vessel_class: Filter by vessel class
        min_dwt: Minimum DWT
        max_dwt: Maximum DWT
        limit: Maximum records

    Returns:
        List of vessels
    """
    query = select(Vessel)

    if vessel_class:
        query = query.where(Vessel.vessel_class == vessel_class)

    if min_dwt:
        query = query.where(Vessel.dwt >= min_dwt)

    if max_dwt:
        query = query.where(Vessel.dwt <= max_dwt)

    query = query.limit(limit)

    result = await session.execute(query)
    vessels = result.scalars().all()

    return {
        "vessels": [
            {
                "imo": v.imo,
                "mmsi": v.mmsi,
                "name": v.vessel_name,
                "class": v.vessel_class,
                "type": v.vessel_type,
                "dwt": v.dwt,
                "loa_m": v.loa_m,
                "beam_m": v.beam_m,
                "draft_m": v.draft_m,
                "built_year": v.built_year,
                "flag": v.flag,
            }
            for v in vessels
        ],
        "total": len(vessels),
    }


@router.get("/{imo}")
async def get_vessel(
    imo: int,
    session: AsyncSession = Depends(get_session),
):
    """
    Get vessel details by IMO number.

    Args:
        imo: Vessel IMO number

    Returns:
        Vessel details

    Raises:
        HTTPException: If vessel not found
    """
    result = await session.execute(select(Vessel).where(Vessel.imo == imo))
    vessel = result.scalar_one_or_none()

    if not vessel:
        raise HTTPException(status_code=404, detail=f"Vessel not found: IMO {imo}")

    return {
        "imo": vessel.imo,
        "mmsi": vessel.mmsi,
        "name": vessel.vessel_name,
        "class": vessel.vessel_class,
        "type": vessel.vessel_type,
        "dimensions": {
            "dwt": vessel.dwt,
            "loa_m": vessel.loa_m,
            "beam_m": vessel.beam_m,
            "draft_m": vessel.draft_m,
        },
        "built_year": vessel.built_year,
        "flag": vessel.flag,
    }


@router.get("/{imo}/position")
async def get_vessel_position(
    imo: int,
    session: AsyncSession = Depends(get_session),
):
    """
    Get latest vessel position.

    Args:
        imo: Vessel IMO number

    Returns:
        Latest AIS position

    Raises:
        HTTPException: If vessel or position not found
    """
    # Get vessel
    vessel_result = await session.execute(select(Vessel).where(Vessel.imo == imo))
    vessel = vessel_result.scalar_one_or_none()

    if not vessel:
        raise HTTPException(status_code=404, detail=f"Vessel not found: IMO {imo}")

    # Get latest position
    position_result = await session.execute(
        select(VesselPosition)
        .where(VesselPosition.imo == imo)
        .order_by(VesselPosition.timestamp.desc())
        .limit(1)
    )
    position = position_result.scalar_one_or_none()

    if not position:
        raise HTTPException(
            status_code=404, detail=f"No position data available for IMO {imo}"
        )

    return {
        "imo": imo,
        "vessel_name": vessel.vessel_name,
        "position": {
            "latitude": position.latitude,
            "longitude": position.longitude,
            "timestamp": position.timestamp.isoformat(),
            "speed_knots": position.speed_knots,
            "course_degrees": position.course_degrees,
            "heading_degrees": position.heading_degrees,
            "navigation_status": position.navigation_status,
            "destination": position.destination,
            "eta": position.eta.isoformat() if position.eta else None,
        },
        "source": position.source_name,
        "data_status": position.data_status.value,
    }


@router.get("/classes")
async def get_vessel_classes(
    session: AsyncSession = Depends(get_session),
):
    """
    Get all vessel classes with statistics.

    Returns:
        List of vessel classes with counts
    """
    # Get distinct classes
    query = select(Vessel.vessel_class).distinct()
    result = await session.execute(query)
    classes = [row[0] for row in result.all()]

    class_stats = []
    for vessel_class in classes:
        count_query = select(Vessel).where(Vessel.vessel_class == vessel_class)
        count_result = await session.execute(count_query)
        vessels = count_result.scalars().all()

        if vessels:
            avg_dwt = sum(v.dwt for v in vessels) / len(vessels)
            class_stats.append({
                "class": vessel_class,
                "count": len(vessels),
                "avg_dwt": round(avg_dwt, 0),
                "min_dwt": min(v.dwt for v in vessels),
                "max_dwt": max(v.dwt for v in vessels),
            })

    return {
        "classes": sorted(class_stats, key=lambda x: x["avg_dwt"]),
        "total_classes": len(class_stats),
    }

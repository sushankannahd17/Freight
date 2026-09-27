"""
Port API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.ports import Port, PortBerth, PortCongestion

router = APIRouter(prefix="/ports", tags=["ports"])


@router.get("")
async def get_ports(
    country: str | None = None,
    is_origin: bool | None = None,
    is_destination: bool | None = None,
    session: AsyncSession = Depends(get_session),
):
    """
    Get all ports with optional filters.

    Args:
        country: Filter by country code (ISO 3166-1 alpha-3)
        is_origin: Filter origin ports
        is_destination: Filter destination ports

    Returns:
        List of ports
    """
    query = select(Port)

    if country:
        query = query.where(Port.country == country.upper())

    if is_origin is not None:
        query = query.where(Port.is_origin == is_origin)

    if is_destination is not None:
        query = query.where(Port.is_destination == is_destination)

    result = await session.execute(query)
    ports = result.scalars().all()

    return {
        "ports": [
            {
                "port_code": p.port_code,
                "port_name": p.port_name,
                "country": p.country,
                "region": p.region,
                "latitude": p.latitude,
                "longitude": p.longitude,
                "is_origin": p.is_origin,
                "is_destination": p.is_destination,
            }
            for p in ports
        ],
        "total": len(ports),
    }


@router.get("/{port_code}")
async def get_port(
    port_code: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Get port details.

    Args:
        port_code: Port code

    Returns:
        Port details with berths

    Raises:
        HTTPException: If port not found
    """
    # Get port
    result = await session.execute(select(Port).where(Port.port_code == port_code.upper()))
    port = result.scalar_one_or_none()

    if not port:
        raise HTTPException(status_code=404, detail=f"Port not found: {port_code}")

    # Get berths
    berths_result = await session.execute(
        select(PortBerth).where(PortBerth.port_id == port.id)
    )
    berths = berths_result.scalars().all()

    return {
        "port_code": port.port_code,
        "port_name": port.port_name,
        "country": port.country,
        "region": port.region,
        "coordinates": {
            "latitude": port.latitude,
            "longitude": port.longitude,
        },
        "is_origin": port.is_origin,
        "is_destination": port.is_destination,
        "berths": [
            {
                "berth_name": b.berth_name,
                "terminal_name": b.terminal_name,
                "constraints": {
                    "max_loa_m": b.max_loa_m,
                    "max_beam_m": b.max_beam_m,
                    "max_draft_m": b.max_draft_m,
                    "max_dwt": b.max_dwt,
                    "berth_length_m": b.berth_length_m,
                },
                "operations": {
                    "loading_rate_tph": b.loading_rate_tph,
                    "discharge_rate_tph": b.discharge_rate_tph,
                    "storage_capacity_mt": b.storage_capacity_mt,
                },
                "restrictions": {
                    "tide_restricted": b.tide_restricted,
                    "channel_restricted": b.channel_restricted,
                },
            }
            for b in berths
        ],
        "total_berths": len(berths),
    }


@router.get("/{port_code}/congestion")
async def get_port_congestion(
    port_code: str,
    limit: int = Query(30, ge=1, le=365),
    session: AsyncSession = Depends(get_session),
):
    """
    Get port congestion data.

    Args:
        port_code: Port code
        limit: Number of days of history

    Returns:
        Congestion time series

    Raises:
        HTTPException: If port not found
    """
    # Get port
    port_result = await session.execute(
        select(Port).where(Port.port_code == port_code.upper())
    )
    port = port_result.scalar_one_or_none()

    if not port:
        raise HTTPException(status_code=404, detail=f"Port not found: {port_code}")

    # Get congestion data
    congestion_result = await session.execute(
        select(PortCongestion)
        .where(PortCongestion.port_id == port.id)
        .order_by(desc(PortCongestion.date))
        .limit(limit)
    )
    congestion_data = congestion_result.scalars().all()

    # Get latest
    latest = congestion_data[0] if congestion_data else None

    return {
        "port_code": port_code,
        "port_name": port.port_name,
        "latest": {
            "date": latest.date.isoformat() if latest else None,
            "vessels_waiting": latest.vessels_waiting if latest else None,
            "vessels_at_berth": latest.vessels_at_berth if latest else None,
            "avg_waiting_hours": latest.avg_waiting_hours if latest else None,
            "avg_turnaround_hours": latest.avg_turnaround_hours if latest else None,
            "berth_utilization_pct": latest.berth_utilization_pct if latest else None,
            "congestion_index": latest.congestion_index if latest else None,
        },
        "history": [
            {
                "date": c.date.isoformat(),
                "vessels_waiting": c.vessels_waiting,
                "vessels_at_berth": c.vessels_at_berth,
                "avg_waiting_hours": c.avg_waiting_hours,
                "congestion_index": c.congestion_index,
            }
            for c in reversed(congestion_data)
        ],
        "data_points": len(congestion_data),
    }


@router.get("/{port_code}/berths")
async def get_port_berths(
    port_code: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Get all berths for a port.

    Args:
        port_code: Port code

    Returns:
        List of berths with constraints

    Raises:
        HTTPException: If port not found
    """
    # Get port
    port_result = await session.execute(
        select(Port).where(Port.port_code == port_code.upper())
    )
    port = port_result.scalar_one_or_none()

    if not port:
        raise HTTPException(status_code=404, detail=f"Port not found: {port_code}")

    # Get berths
    berths_result = await session.execute(
        select(PortBerth).where(PortBerth.port_id == port.id)
    )
    berths = berths_result.scalars().all()

    return {
        "port_code": port_code,
        "port_name": port.port_name,
        "berths": [
            {
                "berth_name": b.berth_name,
                "terminal_name": b.terminal_name,
                "max_loa_m": b.max_loa_m,
                "max_beam_m": b.max_beam_m,
                "max_draft_m": b.max_draft_m,
                "max_dwt": b.max_dwt,
                "loading_rate_tph": b.loading_rate_tph,
                "discharge_rate_tph": b.discharge_rate_tph,
                "tide_restricted": b.tide_restricted,
                "channel_restricted": b.channel_restricted,
            }
            for b in berths
        ],
        "total": len(berths),
    }

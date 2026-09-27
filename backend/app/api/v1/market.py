"""
Market data API endpoints.
"""

from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.models.market import FreightIndex, FreightRate
from app.schemas.common import PaginatedResponse, PaginationParams

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/indices")
async def get_freight_indices(
    index_code: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = Query(100, ge=1, le=1000),
    session: AsyncSession = Depends(get_session),
):
    """
    Get Baltic Exchange freight indices.

    Supports indices:
    - BDI (Baltic Dry Index)
    - BCI (Baltic Capesize Index)
    - BPI (Baltic Panamax Index)
    - BSI (Baltic Supramax Index)
    - BHSI (Baltic Handysize Index)

    Args:
        index_code: Filter by specific index (e.g., BDI, BCI)
        start_date: Start date filter (YYYY-MM-DD)
        end_date: End date filter (YYYY-MM-DD)
        limit: Maximum number of records

    Returns:
        List of index values with dates
    """
    query = select(FreightIndex).order_by(desc(FreightIndex.date))

    if index_code:
        query = query.where(FreightIndex.index_code == index_code.upper())

    if start_date:
        query = query.where(FreightIndex.date >= start_date)

    if end_date:
        query = query.where(FreightIndex.date <= end_date)

    query = query.limit(limit)

    result = await session.execute(query)
    indices = result.scalars().all()

    return {
        "indices": [
            {
                "date": idx.date.isoformat(),
                "index_code": idx.index_code,
                "index_name": idx.index_name,
                "value": idx.value,
                "change": idx.change,
                "change_percent": idx.change_percent,
                "source": idx.source_name,
                "data_status": idx.data_status.value,
            }
            for idx in indices
        ],
        "total": len(indices),
    }


@router.get("/freight-rates")
async def get_freight_rates(
    route_id: str | None = None,
    vessel_class: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = Query(100, ge=1, le=1000),
    session: AsyncSession = Depends(get_session),
):
    """
    Get freight rates for specific routes and vessel classes.

    Args:
        route_id: Filter by route (e.g., aus-paradip)
        vessel_class: Filter by vessel class (Handysize, Supramax, Panamax, Capesize)
        start_date: Start date filter
        end_date: End date filter
        limit: Maximum number of records

    Returns:
        List of freight rates
    """
    query = select(FreightRate).order_by(desc(FreightRate.date))

    if route_id:
        query = query.where(FreightRate.route_id == route_id)

    if vessel_class:
        query = query.where(FreightRate.vessel_class == vessel_class)

    if start_date:
        query = query.where(FreightRate.date >= start_date)

    if end_date:
        query = query.where(FreightRate.date <= end_date)

    query = query.limit(limit)

    result = await session.execute(query)
    rates = result.scalars().all()

    return {
        "rates": [
            {
                "date": rate.date.isoformat(),
                "route_id": rate.route_id,
                "vessel_class": rate.vessel_class,
                "rate_usd_per_mt": rate.rate_usd_per_mt,
                "currency": rate.currency,
                "source": rate.source_name,
                "data_status": rate.data_status.value,
                "data_quality": rate.data_quality.value,
            }
            for rate in rates
        ],
        "total": len(rates),
    }


@router.get("/routes")
async def get_available_routes(
    session: AsyncSession = Depends(get_session),
):
    """
    Get all available freight routes.

    Returns:
        List of unique routes with recent rates
    """
    # Get distinct routes
    query = select(FreightRate.route_id).distinct()
    result = await session.execute(query)
    route_ids = [row[0] for row in result.all()]

    routes = []
    for route_id in route_ids:
        # Get latest rate for each route
        latest_query = (
            select(FreightRate)
            .where(FreightRate.route_id == route_id)
            .order_by(desc(FreightRate.date))
            .limit(1)
        )
        latest_result = await session.execute(latest_query)
        latest_rate = latest_result.scalar_one_or_none()

        if latest_rate:
            routes.append({
                "route_id": route_id,
                "latest_date": latest_rate.date.isoformat(),
                "latest_rate_usd_per_mt": latest_rate.rate_usd_per_mt,
                "vessel_class": latest_rate.vessel_class,
            })

    return {
        "routes": routes,
        "total": len(routes),
    }


@router.get("/snapshot")
async def get_market_snapshot(
    session: AsyncSession = Depends(get_session),
):
    """
    Get current market snapshot.

    Returns latest values for:
    - All major indices
    - Representative route rates

    Returns:
        Market snapshot with latest values
    """
    # Get latest index values
    indices_query = (
        select(FreightIndex)
        .distinct(FreightIndex.index_code)
        .order_by(FreightIndex.index_code, desc(FreightIndex.date))
    )
    indices_result = await session.execute(indices_query)
    indices = indices_result.scalars().all()

    # Get latest rates for major routes
    routes_query = (
        select(FreightRate)
        .distinct(FreightRate.route_id)
        .order_by(FreightRate.route_id, desc(FreightRate.date))
        .limit(10)
    )
    routes_result = await session.execute(routes_query)
    rates = routes_result.scalars().all()

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "indices": [
            {
                "code": idx.index_code,
                "name": idx.index_name,
                "value": idx.value,
                "change": idx.change,
                "date": idx.date.isoformat(),
            }
            for idx in indices
        ],
        "rates": [
            {
                "route": rate.route_id,
                "vessel_class": rate.vessel_class,
                "rate_usd_per_mt": rate.rate_usd_per_mt,
                "date": rate.date.isoformat(),
            }
            for rate in rates
        ],
    }

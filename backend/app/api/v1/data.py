"""
Data source and governance API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.schemas.data_source import (
    DataSourceCreate,
    DataSourceResponse,
    DataSourceStatusResponse,
)
from app.services.data_source_service import DataSourceService

router = APIRouter(prefix="/data", tags=["data"])


@router.get("/sources", response_model=list[DataSourceResponse])
async def get_data_sources(
    session: AsyncSession = Depends(get_session),
):
    """
    Get all data sources.

    Returns list of registered data sources with metadata.
    """
    service = DataSourceService(session)
    sources = await service.get_all_sources()
    return sources


@router.get("/sources/active", response_model=list[DataSourceResponse])
async def get_active_sources(
    session: AsyncSession = Depends(get_session),
):
    """
    Get all active data sources.

    Returns only sources marked as active.
    """
    service = DataSourceService(session)
    sources = await service.get_active_sources()
    return sources


@router.get("/sources/{source_id}", response_model=DataSourceResponse)
async def get_data_source(
    source_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Get data source by ID.

    Args:
        source_id: Source identifier

    Returns:
        Data source details

    Raises:
        HTTPException: If source not found
    """
    service = DataSourceService(session)
    source = await service.get_source(source_id)

    if not source:
        raise HTTPException(status_code=404, detail=f"Data source not found: {source_id}")

    return source


@router.get("/sources/{source_id}/status", response_model=DataSourceStatusResponse)
async def get_source_status(
    source_id: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Get comprehensive status for a data source.

    Includes:
    - Source metadata
    - Provider status (LIVE, RECENT, STALE, UNAVAILABLE, CONFIGURATION_REQUIRED)
    - Latest ingestion run
    - Success rate
    - Data freshness

    Args:
        source_id: Source identifier

    Returns:
        Source status summary

    Raises:
        HTTPException: If source not found
    """
    service = DataSourceService(session)
    status = await service.get_source_status(source_id)

    if not status:
        raise HTTPException(status_code=404, detail=f"Data source not found: {source_id}")

    return status


@router.post("/sources", response_model=DataSourceResponse, status_code=201)
async def register_data_source(
    source: DataSourceCreate,
    session: AsyncSession = Depends(get_session),
):
    """
    Register a new data source.

    Args:
        source: Source registration data

    Returns:
        Created data source
    """
    service = DataSourceService(session)
    created = await service.register_source(source)
    return created


@router.get("/status")
async def get_data_status(
    session: AsyncSession = Depends(get_session),
):
    """
    Get overall data status summary.

    Returns:
        Summary of all data sources and their freshness
    """
    service = DataSourceService(session)
    sources = await service.get_active_sources()

    statuses = []
    for source in sources:
        status = await service.get_source_status(source.source_id)
        if status:
            statuses.append({
                "source_id": source.source_id,
                "source_name": source.source_name,
                "status": status.status,
                "data_freshness_hours": status.data_freshness_hours,
                "success_rate": status.success_rate,
            })

    return {
        "total_sources": len(sources),
        "sources": statuses,
    }

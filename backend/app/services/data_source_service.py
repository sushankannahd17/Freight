"""
Data source service for provenance tracking.
"""

import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import get_logger, log_ingestion_complete, log_ingestion_start
from app.repositories.data_source import (
    DataIngestionRunRepository,
    DataQualityCheckRepository,
    DataSourceRepository,
)
from app.schemas.common import ProviderStatusEnum
from app.schemas.data_source import (
    DataIngestionRunCreate,
    DataIngestionRunResponse,
    DataIngestionRunUpdate,
    DataQualityCheckCreate,
    DataQualityCheckResponse,
    DataSourceCreate,
    DataSourceResponse,
    DataSourceStatusResponse,
    DataSourceUpdate,
)

logger = get_logger(__name__)


class DataSourceService:
    """Service for managing data sources and provenance."""

    def __init__(self, session: AsyncSession):
        """
        Initialize service.

        Args:
            session: Database session
        """
        self.session = session
        self.source_repo = DataSourceRepository(session)
        self.run_repo = DataIngestionRunRepository(session)
        self.quality_repo = DataQualityCheckRepository(session)

    async def register_source(
        self,
        source_data: DataSourceCreate,
    ) -> DataSourceResponse:
        """
        Register a new data source.

        Args:
            source_data: Source registration data

        Returns:
            Created data source
        """
        logger.info(f"Registering data source: {source_data.source_id}")

        # Check if source already exists
        existing = await self.source_repo.get_by_source_id(source_data.source_id)
        if existing:
            logger.warning(f"Data source already exists: {source_data.source_id}")
            return DataSourceResponse.model_validate(existing)

        # Create source
        source = await self.source_repo.create(source_data.model_dump())
        logger.info(f"Data source registered: {source_data.source_id}")

        return DataSourceResponse.model_validate(source)

    async def update_source(
        self,
        source_id: str,
        update_data: DataSourceUpdate,
    ) -> DataSourceResponse | None:
        """
        Update data source.

        Args:
            source_id: Source identifier
            update_data: Update data

        Returns:
            Updated source or None
        """
        source = await self.source_repo.get_by_source_id(source_id)
        if not source:
            logger.warning(f"Data source not found: {source_id}")
            return None

        updated = await self.source_repo.update(
            source.id,
            update_data.model_dump(exclude_unset=True),
        )

        if updated:
            logger.info(f"Data source updated: {source_id}")
            return DataSourceResponse.model_validate(updated)

        return None

    async def get_source(self, source_id: str) -> DataSourceResponse | None:
        """
        Get data source by ID.

        Args:
            source_id: Source identifier

        Returns:
            Data source or None
        """
        source = await self.source_repo.get_by_source_id(source_id)
        if source:
            return DataSourceResponse.model_validate(source)
        return None

    async def get_all_sources(self) -> list[DataSourceResponse]:
        """
        Get all data sources.

        Returns:
            List of data sources
        """
        sources = await self.source_repo.get_all()
        return [DataSourceResponse.model_validate(s) for s in sources]

    async def get_active_sources(self) -> list[DataSourceResponse]:
        """
        Get all active data sources.

        Returns:
            List of active sources
        """
        sources = await self.source_repo.get_active_sources()
        return [DataSourceResponse.model_validate(s) for s in sources]

    async def start_ingestion_run(
        self,
        source_id: str,
    ) -> DataIngestionRunResponse:
        """
        Start a new ingestion run.

        Args:
            source_id: Source identifier

        Returns:
            Created ingestion run
        """
        source = await self.source_repo.get_by_source_id(source_id)
        if not source:
            raise ValueError(f"Data source not found: {source_id}")

        run_id = f"{source_id}_{uuid.uuid4().hex[:8]}"

        run_data = {
            "run_id": run_id,
            "source_id": source.id,
            "started_at": datetime.utcnow(),
            "status": "RUNNING",
            "records_received": 0,
            "records_inserted": 0,
            "records_updated": 0,
            "records_rejected": 0,
        }

        run = await self.run_repo.create(run_data)

        log_ingestion_start(
            logger,
            provider=source.source_name,
            ingestion_type=source.source_type,
            run_id=run_id,
        )

        return DataIngestionRunResponse.model_validate(run)

    async def complete_ingestion_run(
        self,
        run_id: str,
        status: str,
        records_received: int = 0,
        records_inserted: int = 0,
        records_updated: int = 0,
        records_rejected: int = 0,
        errors: list[str] | None = None,
        raw_payload_path: str | None = None,
    ) -> DataIngestionRunResponse:
        """
        Complete an ingestion run.

        Args:
            run_id: Run identifier
            status: Final status (SUCCESS or FAILED)
            records_received: Total records received
            records_inserted: Records inserted
            records_updated: Records updated
            records_rejected: Records rejected
            errors: Error messages
            raw_payload_path: Path to raw payload

        Returns:
            Updated ingestion run
        """
        run = await self.run_repo.get_by_run_id(run_id)
        if not run:
            raise ValueError(f"Ingestion run not found: {run_id}")

        completed_at = datetime.utcnow()
        duration = (completed_at - run.started_at).total_seconds()

        update_data = {
            "status": status,
            "completed_at": completed_at,
            "records_received": records_received,
            "records_inserted": records_inserted,
            "records_updated": records_updated,
            "records_rejected": records_rejected,
            "errors": errors,
            "raw_payload_path": raw_payload_path,
        }

        updated = await self.run_repo.update(run.id, update_data)

        if updated and status == "SUCCESS":
            # Update source last successful fetch
            source = await self.source_repo.get(run.source_id)
            if source:
                await self.source_repo.update_last_fetch(
                    source.source_id,
                    completed_at,
                )

        # Log completion
        if updated:
            source = await self.source_repo.get(run.source_id)
            log_ingestion_complete(
                logger,
                provider=source.source_name if source else "Unknown",
                ingestion_type=source.source_type if source else "Unknown",
                records_received=records_received,
                records_inserted=records_inserted,
                records_updated=records_updated,
                records_rejected=records_rejected,
                duration_seconds=duration,
                run_id=run_id,
                status=status,
            )

        return DataIngestionRunResponse.model_validate(updated)

    async def create_quality_check(
        self,
        check_data: DataQualityCheckCreate,
    ) -> DataQualityCheckResponse:
        """
        Create a quality check record.

        Args:
            check_data: Quality check data

        Returns:
            Created quality check
        """
        check = await self.quality_repo.create(
            {
                **check_data.model_dump(),
                "check_time": datetime.utcnow(),
            }
        )

        return DataQualityCheckResponse.model_validate(check)

    async def get_source_status(
        self,
        source_id: str,
    ) -> DataSourceStatusResponse | None:
        """
        Get comprehensive status for a data source.

        Args:
            source_id: Source identifier

        Returns:
            Source status summary or None
        """
        source = await self.source_repo.get_by_source_id(source_id)
        if not source:
            return None

        # Get latest run
        latest_run = await self.run_repo.get_latest_successful(source.id)

        # Get run statistics
        total_runs = await self.run_repo.count_by_source(source.id)
        success_rate = await self.run_repo.get_success_rate(source.id)

        # Determine provider status
        status = self._determine_provider_status(source, latest_run)

        # Calculate data freshness
        data_freshness_hours = None
        if source.last_successful_fetch:
            freshness = datetime.utcnow() - source.last_successful_fetch
            data_freshness_hours = freshness.total_seconds() / 3600

        return DataSourceStatusResponse(
            source=DataSourceResponse.model_validate(source),
            status=status,
            last_run=(
                DataIngestionRunResponse.model_validate(latest_run)
                if latest_run
                else None
            ),
            total_runs=total_runs,
            success_rate=success_rate,
            data_freshness_hours=data_freshness_hours,
        )

    def _determine_provider_status(
        self,
        source: Any,
        latest_run: Any | None,
    ) -> ProviderStatusEnum:
        """
        Determine provider status based on source and run data.

        Args:
            source: Data source
            latest_run: Latest successful run

        Returns:
            Provider status
        """
        if not source.is_active:
            return ProviderStatusEnum.UNAVAILABLE

        if source.requires_auth and not latest_run:
            return ProviderStatusEnum.CONFIGURATION_REQUIRED

        if not source.last_successful_fetch:
            return ProviderStatusEnum.UNAVAILABLE

        age = datetime.utcnow() - source.last_successful_fetch

        # Determine freshness thresholds
        warning_threshold = timedelta(hours=settings.data_freshness_warning_hours)
        error_threshold = timedelta(hours=settings.data_freshness_error_hours)

        if age > error_threshold:
            return ProviderStatusEnum.STALE
        elif age > warning_threshold:
            return ProviderStatusEnum.RECENT
        else:
            return ProviderStatusEnum.LIVE

    async def save_raw_payload(
        self,
        source_id: str,
        run_id: str,
        payload: Any,
    ) -> str:
        """
        Save raw API response/data for provenance.

        Args:
            source_id: Source identifier
            run_id: Run identifier
            payload: Raw payload data

        Returns:
            Path to saved file
        """
        import json

        # Create directory structure
        now = datetime.utcnow()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        day = now.strftime("%d")

        raw_dir = Path("data/raw") / source_id / year / month / day
        raw_dir.mkdir(parents=True, exist_ok=True)

        # Save payload
        filename = f"{run_id}_{now.strftime('%H%M%S')}.json"
        filepath = raw_dir / filename

        with open(filepath, "w") as f:
            if isinstance(payload, (dict, list)):
                json.dump(payload, f, indent=2, default=str)
            else:
                f.write(str(payload))

        logger.info(f"Raw payload saved: {filepath}")
        return str(filepath)

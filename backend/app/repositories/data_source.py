"""
Data source repository for provenance tracking.
"""

from datetime import datetime

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.governance import DataIngestionRun, DataQualityCheck, DataSource
from app.repositories.base import BaseRepository


class DataSourceRepository(BaseRepository[DataSource]):
    """Repository for data source operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(DataSource, session)

    async def get_by_source_id(self, source_id: str) -> DataSource | None:
        """
        Get data source by source_id.

        Args:
            source_id: Source identifier

        Returns:
            DataSource or None
        """
        result = await self.session.execute(
            select(DataSource).where(DataSource.source_id == source_id)
        )
        return result.scalar_one_or_none()

    async def get_active_sources(self) -> list[DataSource]:
        """
        Get all active data sources.

        Returns:
            List of active data sources
        """
        result = await self.session.execute(
            select(DataSource).where(DataSource.is_active == True)
        )
        return list(result.scalars().all())

    async def update_last_fetch(self, source_id: str, timestamp: datetime) -> bool:
        """
        Update last successful fetch timestamp.

        Args:
            source_id: Source identifier
            timestamp: Fetch timestamp

        Returns:
            True if updated
        """
        source = await self.get_by_source_id(source_id)
        if source is None:
            return False

        source.last_successful_fetch = timestamp
        await self.session.commit()
        return True


class DataIngestionRunRepository(BaseRepository[DataIngestionRun]):
    """Repository for ingestion run operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(DataIngestionRun, session)

    async def get_by_run_id(self, run_id: str) -> DataIngestionRun | None:
        """
        Get ingestion run by run_id.

        Args:
            run_id: Run identifier

        Returns:
            DataIngestionRun or None
        """
        result = await self.session.execute(
            select(DataIngestionRun).where(DataIngestionRun.run_id == run_id)
        )
        return result.scalar_one_or_none()

    async def get_by_source(
        self,
        source_id: int,
        limit: int = 10,
    ) -> list[DataIngestionRun]:
        """
        Get recent runs for a data source.

        Args:
            source_id: Data source ID
            limit: Maximum number of runs

        Returns:
            List of ingestion runs
        """
        result = await self.session.execute(
            select(DataIngestionRun)
            .where(DataIngestionRun.source_id == source_id)
            .order_by(desc(DataIngestionRun.started_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_latest_successful(self, source_id: int) -> DataIngestionRun | None:
        """
        Get latest successful run for a source.

        Args:
            source_id: Data source ID

        Returns:
            Latest successful run or None
        """
        result = await self.session.execute(
            select(DataIngestionRun)
            .where(DataIngestionRun.source_id == source_id)
            .where(DataIngestionRun.status == "SUCCESS")
            .order_by(desc(DataIngestionRun.completed_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def count_by_source(self, source_id: int) -> int:
        """
        Count total runs for a source.

        Args:
            source_id: Data source ID

        Returns:
            Total count
        """
        result = await self.session.execute(
            select(func.count(DataIngestionRun.id)).where(
                DataIngestionRun.source_id == source_id
            )
        )
        return result.scalar() or 0

    async def get_success_rate(self, source_id: int) -> float:
        """
        Calculate success rate for a source.

        Args:
            source_id: Data source ID

        Returns:
            Success rate (0-1)
        """
        total = await self.count_by_source(source_id)
        if total == 0:
            return 0.0

        result = await self.session.execute(
            select(func.count(DataIngestionRun.id))
            .where(DataIngestionRun.source_id == source_id)
            .where(DataIngestionRun.status == "SUCCESS")
        )
        successful = result.scalar() or 0

        return successful / total


class DataQualityCheckRepository(BaseRepository[DataQualityCheck]):
    """Repository for quality check operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(DataQualityCheck, session)

    async def get_by_run_id(self, run_id: str) -> list[DataQualityCheck]:
        """
        Get all checks for an ingestion run.

        Args:
            run_id: Ingestion run ID

        Returns:
            List of quality checks
        """
        result = await self.session.execute(
            select(DataQualityCheck)
            .where(DataQualityCheck.run_id == run_id)
            .order_by(DataQualityCheck.check_time)
        )
        return list(result.scalars().all())

    async def get_failed_checks(
        self,
        table_name: str | None = None,
        limit: int = 100,
    ) -> list[DataQualityCheck]:
        """
        Get recent failed quality checks.

        Args:
            table_name: Optional table name filter
            limit: Maximum number of checks

        Returns:
            List of failed checks
        """
        query = select(DataQualityCheck).where(DataQualityCheck.passed == False)

        if table_name:
            query = query.where(DataQualityCheck.table_name == table_name)

        query = query.order_by(desc(DataQualityCheck.check_time)).limit(limit)

        result = await self.session.execute(query)
        return list(result.scalars().all())

"""
Historical data ingestion from Excel files.

Parses FreightIQ historical data files and loads into database.
"""

import asyncio
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from geoalchemy2.functions import ST_GeogFromText

from app.core.database import get_db_session
from app.core.logging import get_logger
from app.ingestion.excel_parser import ExcelDataParser
from app.models.economics import FuelPrice, FXRate
from app.models.governance import DataSource
from app.models.market import FreightIndex, FreightRate
from app.models.ports import Port, PortBerth
from app.models.routes import SeaRoute
from app.models.trade import CoalImport, TradeFlow
from app.schemas.data_source import DataSourceCreate
from app.services.data_source_service import DataSourceService

logger = get_logger(__name__)


class HistoricalDataIngestion:
    """Historical data ingestion coordinator."""

    def __init__(self, session: AsyncSession):
        """
        Initialize ingestion coordinator.

        Args:
            session: Database session
        """
        self.session = session
        self.data_source_service = DataSourceService(session)

    async def register_historical_source(
        self,
        source_id: str,
        source_name: str,
        file_path: str,
    ) -> None:
        """
        Register a historical data source.

        Args:
            source_id: Source identifier
            source_name: Source name
            file_path: Path to data file
        """
        source_data = DataSourceCreate(
            source_id=source_id,
            source_name=source_name,
            source_type="FILE",
            provider="Historical Excel Data",
            base_url=file_path,
            requires_auth=False,
            is_active=True,
            update_frequency="ONE_TIME",
        )

        await self.data_source_service.register_source(source_data)
        logger.info(f"Registered historical source: {source_id}")

    async def ingest_freight_rates(
        self,
        filepath: str | Path,
        source_id: str = "historical_freight_rates",
    ) -> int:
        """
        Ingest freight rates from Excel file.

        Args:
            filepath: Path to Excel file
            source_id: Source identifier

        Returns:
            Number of records inserted
        """
        logger.info(f"Starting freight rate ingestion from: {filepath}")

        # Register source
        await self.register_historical_source(
            source_id,
            "Historical Freight Rates",
            str(filepath),
        )

        # Start ingestion run
        run = await self.data_source_service.start_ingestion_run(source_id)

        try:
            # Parse Excel file
            parser = ExcelDataParser(filepath)
            records = parser.parse_freight_rates()

            # Save raw data
            raw_path = await self.data_source_service.save_raw_payload(
                source_id,
                run.run_id,
                {"records": records, "count": len(records)},
            )

            # Insert records
            inserted = 0
            rejected = 0

            for record in records:
                try:
                    # Check for duplicates
                    existing = await self.session.execute(
                        select(FreightRate).where(
                            FreightRate.date == record["date"],
                            FreightRate.route_id == record["route_id"],
                            FreightRate.vessel_class == record.get("vessel_class", "Panamax"),
                            FreightRate.source_id == source_id,
                        )
                    )

                    if existing.scalar_one_or_none():
                        logger.debug(f"Duplicate freight rate, skipping: {record}")
                        continue

                    # Create record
                    freight_rate = FreightRate(
                        date=record["date"],
                        route_id=record["route_id"],
                        vessel_class=record.get("vessel_class", "Panamax"),
                        rate_usd_per_mt=float(record["rate_usd_per_mt"]),
                        currency="USD",
                        # Provenance fields
                        source_id=source_id,
                        source_name="Historical Freight Rates",
                        retrieved_at=datetime.utcnow(),
                        published_at=record["date"],
                        valid_from=record["date"],
                        data_status="OBSERVED",
                        data_quality="GOOD",
                    )

                    self.session.add(freight_rate)
                    inserted += 1

                    if inserted % 100 == 0:
                        await self.session.commit()
                        logger.info(f"Inserted {inserted} freight rates...")

                except Exception as e:
                    logger.error(f"Error inserting freight rate: {e}", exc_info=True)
                    rejected += 1

            await self.session.commit()

            # Complete ingestion run
            await self.data_source_service.complete_ingestion_run(
                run.run_id,
                status="SUCCESS",
                records_received=len(records),
                records_inserted=inserted,
                records_updated=0,
                records_rejected=rejected,
                raw_payload_path=raw_path,
            )

            logger.info(
                f"Freight rate ingestion complete: {inserted} inserted, {rejected} rejected"
            )
            return inserted

        except Exception as e:
            logger.error(f"Freight rate ingestion failed: {e}", exc_info=True)

            await self.data_source_service.complete_ingestion_run(
                run.run_id,
                status="FAILED",
                errors=[str(e)],
            )
            raise

    async def ingest_coal_imports(
        self,
        filepath: str | Path,
        source_id: str = "historical_coal_imports",
    ) -> int:
        """
        Ingest coal import data from Excel file.

        Args:
            filepath: Path to Excel file
            source_id: Source identifier

        Returns:
            Number of records inserted
        """
        logger.info(f"Starting coal import ingestion from: {filepath}")

        # Register source
        await self.register_historical_source(
            source_id,
            "Historical Coal Imports",
            str(filepath),
        )

        # Start ingestion run
        run = await self.data_source_service.start_ingestion_run(source_id)

        try:
            # Parse Excel file
            parser = ExcelDataParser(filepath)
            records = parser.parse_coal_imports()

            # Save raw data
            raw_path = await self.data_source_service.save_raw_payload(
                source_id,
                run.run_id,
                {"records": records, "count": len(records)},
            )

            # Insert records
            inserted = 0
            rejected = 0

            for record in records:
                try:
                    # Check for duplicates
                    existing = await self.session.execute(
                        select(CoalImport).where(
                            CoalImport.period == record["period"],
                            CoalImport.origin_country == record["origin_country"],
                            CoalImport.coal_type == record.get("coal_type", "Non-Coking"),
                            CoalImport.source_id == source_id,
                        )
                    )

                    if existing.scalar_one_or_none():
                        logger.debug(f"Duplicate coal import, skipping: {record}")
                        continue

                    # Create record
                    coal_import = CoalImport(
                        period=record["period"],
                        origin_country=record["origin_country"],
                        coal_type=record.get("coal_type", "Non-Coking"),
                        quantity_mt=float(record["quantity_mt"]),
                        value_inr=float(record.get("value_inr", 0)) if record.get("value_inr") else None,
                        # Provenance fields
                        source_id=source_id,
                        source_name="Historical Coal Imports",
                        retrieved_at=datetime.utcnow(),
                        published_at=record["period"],
                        valid_from=record["period"],
                        data_status="OBSERVED",
                        data_quality="GOOD",
                    )

                    self.session.add(coal_import)
                    inserted += 1

                    if inserted % 100 == 0:
                        await self.session.commit()
                        logger.info(f"Inserted {inserted} coal imports...")

                except Exception as e:
                    logger.error(f"Error inserting coal import: {e}", exc_info=True)
                    rejected += 1

            await self.session.commit()

            # Complete ingestion run
            await self.data_source_service.complete_ingestion_run(
                run.run_id,
                status="SUCCESS",
                records_received=len(records),
                records_inserted=inserted,
                records_updated=0,
                records_rejected=rejected,
                raw_payload_path=raw_path,
            )

            logger.info(
                f"Coal import ingestion complete: {inserted} inserted, {rejected} rejected"
            )
            return inserted

        except Exception as e:
            logger.error(f"Coal import ingestion failed: {e}", exc_info=True)

            await self.data_source_service.complete_ingestion_run(
                run.run_id,
                status="FAILED",
                errors=[str(e)],
            )
            raise

    async def ingest_all_historical_data(self) -> dict[str, int]:
        """
        Ingest all historical data files in data directory.

        Returns:
            Dictionary of data type to records inserted
        """
        logger.info("Starting bulk historical data ingestion")

        dataset_dir = Path("../server/Dataset")
        if not dataset_dir.exists():
            dataset_dir = Path("server/Dataset")

        if not dataset_dir.exists():
            logger.error("Dataset directory not found")
            return {}

        results = {}

        # Find Excel files
        excel_files = list(dataset_dir.glob("*.xlsx"))
        logger.info(f"Found {len(excel_files)} Excel files")

        for filepath in excel_files:
            filename = filepath.name.lower()

            try:
                if "freight" in filename or "rate" in filename:
                    count = await self.ingest_freight_rates(filepath)
                    results["freight_rates"] = count

                elif "coal" in filename:
                    count = await self.ingest_coal_imports(filepath)
                    results["coal_imports"] = count

                else:
                    logger.warning(f"Unrecognized file type: {filename}")

            except Exception as e:
                logger.error(f"Failed to ingest {filename}: {e}", exc_info=True)

        logger.info(f"Bulk ingestion complete: {results}")
        return results


async def main():
    """Main entry point for historical data ingestion."""
    async with get_db_session() as session:
        ingestion = HistoricalDataIngestion(session)
        results = await ingestion.ingest_all_historical_data()

        print("\n" + "=" * 60)
        print("HISTORICAL DATA INGESTION COMPLETE")
        print("=" * 60)
        for data_type, count in results.items():
            print(f"  {data_type}: {count} records")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())

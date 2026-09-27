"""
Excel file parser for historical data ingestion.
"""

from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd

from app.core.logging import get_logger

logger = get_logger(__name__)


class ExcelDataParser:
    """Parser for Excel data files."""

    def __init__(self, filepath: str | Path):
        """
        Initialize parser.

        Args:
            filepath: Path to Excel file
        """
        self.filepath = Path(filepath)
        if not self.filepath.exists():
            raise FileNotFoundError(f"Excel file not found: {filepath}")

        logger.info(f"Initialized Excel parser for: {self.filepath.name}")

    def read_sheet(
        self,
        sheet_name: str | int = 0,
        skip_rows: int | None = None,
        header: int | None = 0,
    ) -> pd.DataFrame:
        """
        Read a sheet from Excel file.

        Args:
            sheet_name: Sheet name or index
            skip_rows: Number of rows to skip
            header: Row to use as header

        Returns:
            DataFrame
        """
        logger.info(f"Reading sheet: {sheet_name}")

        df = pd.read_excel(
            self.filepath,
            sheet_name=sheet_name,
            skiprows=skip_rows,
            header=header,
        )

        logger.info(f"Read {len(df)} rows from sheet: {sheet_name}")
        return df

    def list_sheets(self) -> list[str]:
        """
        List all sheet names in Excel file.

        Returns:
            List of sheet names
        """
        xl_file = pd.ExcelFile(self.filepath)
        sheets = xl_file.sheet_names
        logger.info(f"Found {len(sheets)} sheets: {sheets}")
        return sheets

    def parse_freight_rates(
        self,
        sheet_name: str | int = 0,
    ) -> list[dict[str, Any]]:
        """
        Parse freight rate data from Excel.

        Expected columns:
        - date or Date
        - route or Route or route_id
        - vessel_class or VesselClass
        - rate or Rate or rate_usd_per_mt

        Args:
            sheet_name: Sheet name or index

        Returns:
            List of freight rate records
        """
        df = self.read_sheet(sheet_name)

        # Normalize column names
        df.columns = df.columns.str.lower().str.replace(" ", "_")

        # Map column names
        column_mapping = {
            "date": "date",
            "route": "route_id",
            "route_id": "route_id",
            "vessel_class": "vessel_class",
            "vesselclass": "vessel_class",
            "rate": "rate_usd_per_mt",
            "rate_usd_per_mt": "rate_usd_per_mt",
            "rate_(usd/mt)": "rate_usd_per_mt",
        }

        for old_col, new_col in column_mapping.items():
            if old_col in df.columns:
                df.rename(columns={old_col: new_col}, inplace=True)

        # Drop rows with missing critical data
        required_columns = ["date", "route_id", "rate_usd_per_mt"]
        df.dropna(subset=required_columns, inplace=True)

        # Convert date column
        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"])

        # Add default vessel class if missing
        if "vessel_class" not in df.columns:
            df["vessel_class"] = "Panamax"  # Default assumption

        records = df.to_dict("records")
        logger.info(f"Parsed {len(records)} freight rate records")

        return records

    def parse_coal_imports(
        self,
        sheet_name: str | int = 0,
    ) -> list[dict[str, Any]]:
        """
        Parse coal import data from Excel.

        Expected columns:
        - period or Period or date
        - origin_country or Country or Origin
        - coal_type or CoalType or Type
        - quantity_mt or Quantity or quantity

        Args:
            sheet_name: Sheet name or index

        Returns:
            List of coal import records
        """
        df = self.read_sheet(sheet_name)

        # Normalize column names
        df.columns = df.columns.str.lower().str.replace(" ", "_")

        # Map column names
        column_mapping = {
            "period": "period",
            "date": "period",
            "country": "origin_country",
            "origin": "origin_country",
            "origin_country": "origin_country",
            "coal_type": "coal_type",
            "coaltype": "coal_type",
            "type": "coal_type",
            "quantity": "quantity_mt",
            "quantity_mt": "quantity_mt",
            "quantity_(mt)": "quantity_mt",
        }

        for old_col, new_col in column_mapping.items():
            if old_col in df.columns:
                df.rename(columns={old_col: new_col}, inplace=True)

        # Convert period to date
        if "period" in df.columns:
            df["period"] = pd.to_datetime(df["period"])

        # Add default coal type if missing
        if "coal_type" not in df.columns:
            df["coal_type"] = "Non-Coking"

        # Drop rows with missing critical data
        required_columns = ["period", "origin_country", "quantity_mt"]
        df.dropna(subset=required_columns, inplace=True)

        records = df.to_dict("records")
        logger.info(f"Parsed {len(records)} coal import records")

        return records

    def parse_trade_flows(
        self,
        sheet_name: str | int = 0,
    ) -> list[dict[str, Any]]:
        """
        Parse trade flow data from Excel.

        Expected columns:
        - period or Period or date
        - reporter_country or Reporter
        - partner_country or Partner
        - hs_code or HSCode
        - commodity_name or Commodity
        - quantity_mt or Quantity
        - value_usd or Value

        Args:
            sheet_name: Sheet name or index

        Returns:
            List of trade flow records
        """
        df = self.read_sheet(sheet_name)

        # Normalize column names
        df.columns = df.columns.str.lower().str.replace(" ", "_")

        # Convert period to date
        if "period" in df.columns:
            df["period"] = pd.to_datetime(df["period"])
        elif "date" in df.columns:
            df["period"] = pd.to_datetime(df["date"])

        # Drop rows with missing critical data
        required_columns = ["period"]
        df.dropna(subset=required_columns, inplace=True)

        records = df.to_dict("records")
        logger.info(f"Parsed {len(records)} trade flow records")

        return records

    def parse_port_data(
        self,
        sheet_name: str | int = 0,
    ) -> list[dict[str, Any]]:
        """
        Parse port data from Excel.

        Expected columns:
        - port_code or PortCode or Code
        - port_name or PortName or Name
        - country or Country
        - latitude or Latitude or lat
        - longitude or Longitude or lon

        Args:
            sheet_name: Sheet name or index

        Returns:
            List of port records
        """
        df = self.read_sheet(sheet_name)

        # Normalize column names
        df.columns = df.columns.str.lower().str.replace(" ", "_")

        # Map column names
        column_mapping = {
            "code": "port_code",
            "port_code": "port_code",
            "portcode": "port_code",
            "name": "port_name",
            "port_name": "port_name",
            "portname": "port_name",
            "lat": "latitude",
            "latitude": "latitude",
            "lon": "longitude",
            "long": "longitude",
            "longitude": "longitude",
        }

        for old_col, new_col in column_mapping.items():
            if old_col in df.columns:
                df.rename(columns={old_col: new_col}, inplace=True)

        # Drop rows with missing critical data
        required_columns = ["port_code", "port_name"]
        df.dropna(subset=required_columns, inplace=True)

        records = df.to_dict("records")
        logger.info(f"Parsed {len(records)} port records")

        return records

    def infer_data_type(self) -> str:
        """
        Infer data type from filename and sheet names.

        Returns:
            Inferred data type
        """
        filename = self.filepath.name.lower()
        sheets = [s.lower() for s in self.list_sheets()]

        # Check filename
        if "freight" in filename or "rate" in filename:
            return "freight_rates"
        elif "coal" in filename:
            return "coal_imports"
        elif "trade" in filename:
            return "trade_flows"
        elif "port" in filename:
            return "ports"

        # Check sheet names
        for sheet in sheets:
            if "freight" in sheet or "rate" in sheet:
                return "freight_rates"
            elif "coal" in sheet:
                return "coal_imports"
            elif "trade" in sheet:
                return "trade_flows"
            elif "port" in sheet:
                return "ports"

        logger.warning(f"Could not infer data type for: {self.filepath.name}")
        return "unknown"

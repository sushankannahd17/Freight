"""
Unit tests for database models.
"""

import pytest
from datetime import datetime

from app.models.base import DataStatus, DataQuality
from app.models.market import FreightRate, FreightIndex


def test_data_status_enum():
    """Test data status enumeration."""
    assert DataStatus.OBSERVED.value == "OBSERVED"
    assert DataStatus.DERIVED.value == "DERIVED"
    assert DataStatus.MODELLED.value == "MODELLED"
    assert DataStatus.SYNTHETIC.value == "SYNTHETIC"


def test_freight_rate_model():
    """Test freight rate model creation."""
    rate = FreightRate(
        date=datetime(2024, 1, 1),
        route_id="aus-paradip",
        vessel_class="Panamax",
        rate_usd_per_mt=35.50,
        currency="USD",
        source_id="test_source",
        source_name="Test Source",
        retrieved_at=datetime.utcnow(),
        valid_from=datetime(2024, 1, 1),
        data_status=DataStatus.OBSERVED,
        data_quality=DataQuality.GOOD,
    )

    assert rate.route_id == "aus-paradip"
    assert rate.vessel_class == "Panamax"
    assert rate.rate_usd_per_mt == 35.50
    assert rate.data_status == DataStatus.OBSERVED


def test_freight_index_model():
    """Test freight index model creation."""
    index = FreightIndex(
        date=datetime(2024, 1, 1),
        index_code="BDI",
        index_name="Baltic Dry Index",
        value=1500.0,
        change=50.0,
        change_percent=3.45,
        source_id="baltic",
        source_name="Baltic Exchange",
        retrieved_at=datetime.utcnow(),
        valid_from=datetime(2024, 1, 1),
        data_status=DataStatus.OBSERVED,
        data_quality=DataQuality.EXCELLENT,
    )

    assert index.index_code == "BDI"
    assert index.value == 1500.0
    assert index.change == 50.0

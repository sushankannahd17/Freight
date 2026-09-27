"""
Unit tests for voyage calculations.
"""

import pytest


def test_vessel_compatibility_validation():
    """Test vessel-port compatibility logic."""
    # Example vessel dimensions
    vessel = {
        "loa_m": 180.0,
        "beam_m": 32.0,
        "draft_m": 14.5,
        "dwt": 75000,
    }

    # Example berth constraints
    berth = {
        "max_loa_m": 200.0,
        "max_beam_m": 35.0,
        "max_draft_m": 15.0,
        "max_dwt": 80000,
    }

    # Check compatibility
    compatible = (
        vessel["loa_m"] <= berth["max_loa_m"]
        and vessel["beam_m"] <= berth["max_beam_m"]
        and vessel["draft_m"] <= berth["max_draft_m"]
        and vessel["dwt"] <= berth["max_dwt"]
    )

    assert compatible is True


def test_vessel_incompatibility_draft():
    """Test draft incompatibility."""
    vessel = {"loa_m": 180.0, "beam_m": 32.0, "draft_m": 16.0, "dwt": 75000}
    berth = {"max_loa_m": 200.0, "max_beam_m": 35.0, "max_draft_m": 15.0, "max_dwt": 80000}

    compatible = vessel["draft_m"] <= berth["max_draft_m"]
    assert compatible is False

    excess = vessel["draft_m"] - berth["max_draft_m"]
    assert excess == 1.0


def test_voyage_cost_calculation():
    """Test voyage cost calculation logic."""
    # Example voyage parameters
    cargo_mt = 75000
    freight_rate_usd_per_mt = 32.50
    fuel_consumption_mt = 450
    fuel_price_usd_per_mt = 650
    port_cost_usd = 50000
    demurrage_days = 2
    demurrage_rate_usd_per_day = 15000

    # Calculate costs
    freight_cost = cargo_mt * freight_rate_usd_per_mt
    fuel_cost = fuel_consumption_mt * fuel_price_usd_per_mt
    demurrage = demurrage_days * demurrage_rate_usd_per_day
    total_cost = freight_cost + fuel_cost + port_cost_usd + demurrage

    assert freight_cost == 2_437_500
    assert fuel_cost == 292_500
    assert demurrage == 30_000
    assert total_cost == 2_810_000

    cost_per_mt = total_cost / cargo_mt
    assert cost_per_mt == pytest.approx(37.47, rel=0.01)

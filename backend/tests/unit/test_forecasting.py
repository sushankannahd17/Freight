"""
Unit tests for forecasting models.
"""

import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

from app.forecasting.baseline_models import NaiveForecaster, MovingAverageForecaster
from app.forecasting.base import train_test_split_temporal, check_data_leakage


def create_sample_series(n_days: int = 100) -> pd.Series:
    """Create sample time series."""
    dates = pd.date_range(start="2024-01-01", periods=n_days, freq="D")
    values = np.random.randn(n_days).cumsum() + 100
    return pd.Series(values, index=dates)


def test_naive_forecaster():
    """Test naive forecasting model."""
    series = create_sample_series()

    model = NaiveForecaster()
    model.fit(series)

    assert model.is_fitted
    assert model.last_value == series.iloc[-1]

    forecast = model.predict(steps=7)
    assert len(forecast.predictions) == 7
    assert all(forecast.predictions == series.iloc[-1])


def test_moving_average_forecaster():
    """Test moving average forecasting."""
    series = create_sample_series()

    model = MovingAverageForecaster(window=7)
    model.fit(series)

    assert model.is_fitted
    assert len(model.recent_values) == 7

    forecast = model.predict(steps=7)
    assert len(forecast.predictions) == 7


def test_train_test_split_temporal():
    """Test temporal train/test split."""
    df = pd.DataFrame({
        "target": np.random.randn(100).cumsum(),
        "feature1": np.random.randn(100),
    }, index=pd.date_range("2024-01-01", periods=100))

    y_train, y_test, X_train, X_test = train_test_split_temporal(
        df, test_size=0.2, target_col="target"
    )

    assert len(y_train) == 80
    assert len(y_test) == 20
    assert y_train.index.max() < y_test.index.min()  # No temporal leakage


def test_data_leakage_detection():
    """Test data leakage detection."""
    train_index = pd.date_range("2024-01-01", periods=80)
    test_index = pd.date_range("2024-03-22", periods=20)

    # Should pass - no leakage
    assert check_data_leakage(train_index, test_index)

    # Should fail - test data before train data end
    bad_test_index = pd.date_range("2024-02-01", periods=20)
    with pytest.raises(ValueError, match="Data leakage detected"):
        check_data_leakage(train_index, bad_test_index)

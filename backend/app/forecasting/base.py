"""
Base forecasting model interface and utilities.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any

import numpy as np
import pandas as pd


@dataclass
class ForecastResult:
    """Forecast result container."""

    predictions: np.ndarray
    lower_bounds: np.ndarray | None = None
    upper_bounds: np.ndarray | None = None
    confidence: float | None = None
    model_name: str = "unknown"
    forecast_dates: list[datetime] | None = None
    feature_importance: dict[str, float] | None = None
    metadata: dict[str, Any] | None = None


@dataclass
class ModelMetrics:
    """Model evaluation metrics."""

    mae: float  # Mean Absolute Error
    rmse: float  # Root Mean Squared Error
    mape: float  # Mean Absolute Percentage Error
    smape: float  # Symmetric Mean Absolute Percentage Error
    r2: float  # R-squared
    directional_accuracy: float  # % correct direction predictions
    training_time_seconds: float | None = None
    n_train: int | None = None
    n_test: int | None = None


class BaseForecaster(ABC):
    """Base class for all forecasting models."""

    def __init__(self, name: str):
        """
        Initialize forecaster.

        Args:
            name: Model name
        """
        self.name = name
        self.is_fitted = False
        self.training_cutoff: datetime | None = None

    @abstractmethod
    def fit(
        self,
        y_train: pd.Series,
        X_train: pd.DataFrame | None = None,
    ) -> "BaseForecaster":
        """
        Fit the forecasting model.

        Args:
            y_train: Training target series (must have datetime index)
            X_train: Optional training features

        Returns:
            Self
        """
        pass

    @abstractmethod
    def predict(
        self,
        steps: int,
        X_test: pd.DataFrame | None = None,
    ) -> ForecastResult:
        """
        Generate forecasts.

        Args:
            steps: Number of steps ahead to forecast
            X_test: Optional test features

        Returns:
            Forecast results
        """
        pass

    def validate_data(self, y: pd.Series) -> None:
        """
        Validate time series data.

        Args:
            y: Time series to validate

        Raises:
            ValueError: If data is invalid
        """
        if not isinstance(y.index, pd.DatetimeIndex):
            raise ValueError("Series must have DatetimeIndex")

        if y.isnull().any():
            raise ValueError("Series contains missing values")

        if len(y) < 2:
            raise ValueError("Series must have at least 2 observations")

        # Check for temporal ordering
        if not y.index.is_monotonic_increasing:
            raise ValueError("Series index must be monotonically increasing")

    def compute_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
    ) -> ModelMetrics:
        """
        Compute forecast evaluation metrics.

        Args:
            y_true: Actual values
            y_pred: Predicted values

        Returns:
            Model metrics
        """
        # Mean Absolute Error
        mae = np.mean(np.abs(y_true - y_pred))

        # Root Mean Squared Error
        rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))

        # Mean Absolute Percentage Error
        epsilon = 1e-10  # Avoid division by zero
        mape = np.mean(np.abs((y_true - y_pred) / (y_true + epsilon))) * 100

        # Symmetric Mean Absolute Percentage Error
        smape = (
            np.mean(2 * np.abs(y_pred - y_true) / (np.abs(y_true) + np.abs(y_pred) + epsilon))
            * 100
        )

        # R-squared
        ss_res = np.sum((y_true - y_pred) ** 2)
        ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
        r2 = 1 - (ss_res / (ss_tot + epsilon))

        # Directional Accuracy
        if len(y_true) > 1:
            actual_direction = np.sign(np.diff(y_true))
            pred_direction = np.sign(np.diff(y_pred))
            directional_accuracy = np.mean(actual_direction == pred_direction) * 100
        else:
            directional_accuracy = 0.0

        return ModelMetrics(
            mae=mae,
            rmse=rmse,
            mape=mape,
            smape=smape,
            r2=r2,
            directional_accuracy=directional_accuracy,
        )


def train_test_split_temporal(
    df: pd.DataFrame,
    test_size: float = 0.2,
    target_col: str = "target",
) -> tuple[pd.Series, pd.Series, pd.DataFrame | None, pd.DataFrame | None]:
    """
    Split time series data chronologically.

    Args:
        df: DataFrame with datetime index
        test_size: Proportion of data for testing
        target_col: Name of target column

    Returns:
        Tuple of (y_train, y_test, X_train, X_test)
    """
    if not isinstance(df.index, pd.DatetimeIndex):
        raise ValueError("DataFrame must have DatetimeIndex")

    n = len(df)
    split_idx = int(n * (1 - test_size))

    y_train = df[target_col].iloc[:split_idx]
    y_test = df[target_col].iloc[split_idx:]

    # Extract features if present
    feature_cols = [col for col in df.columns if col != target_col]

    if feature_cols:
        X_train = df[feature_cols].iloc[:split_idx]
        X_test = df[feature_cols].iloc[split_idx:]
    else:
        X_train = None
        X_test = None

    return y_train, y_test, X_train, X_test


def check_data_leakage(
    train_index: pd.DatetimeIndex,
    test_index: pd.DatetimeIndex,
) -> bool:
    """
    Check for temporal data leakage.

    Args:
        train_index: Training data datetime index
        test_index: Test data datetime index

    Returns:
        True if no leakage detected

    Raises:
        ValueError: If leakage detected
    """
    train_max = train_index.max()
    test_min = test_index.min()

    if test_min <= train_max:
        raise ValueError(
            f"Data leakage detected: test data starts at {test_min} "
            f"but training data ends at {train_max}"
        )

    return True

"""
Baseline forecasting models for comparison.

Implements:
- Naive forecast
- Seasonal naive forecast
- Moving average
- Simple exponential smoothing
"""

from datetime import timedelta

import numpy as np
import pandas as pd
from statsmodels.tsa.holtwinters import ExponentialSmoothing

from app.core.logging import get_logger
from app.forecasting.base import BaseForecaster, ForecastResult

logger = get_logger(__name__)


class NaiveForecaster(BaseForecaster):
    """
    Naive forecast - uses last observed value for all future predictions.

    Simple baseline that assumes the next value equals the current value.
    """

    def __init__(self):
        super().__init__("naive")
        self.last_value: float | None = None

    def fit(
        self,
        y_train: pd.Series,
        X_train: pd.DataFrame | None = None,
    ) -> "NaiveForecaster":
        """Fit naive model (just stores last value)."""
        self.validate_data(y_train)
        self.last_value = y_train.iloc[-1]
        self.training_cutoff = y_train.index[-1]
        self.is_fitted = True
        logger.info(f"Naive model fitted with last value: {self.last_value:.2f}")
        return self

    def predict(
        self,
        steps: int,
        X_test: pd.DataFrame | None = None,
    ) -> ForecastResult:
        """Generate naive forecasts."""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")

        predictions = np.full(steps, self.last_value)

        return ForecastResult(
            predictions=predictions,
            model_name=self.name,
        )


class SeasonalNaiveForecaster(BaseForecaster):
    """
    Seasonal naive forecast.

    Uses the value from the same season in the previous year/period.
    """

    def __init__(self, seasonal_period: int = 12):
        """
        Initialize seasonal naive forecaster.

        Args:
            seasonal_period: Number of periods in a season (e.g., 12 for monthly data)
        """
        super().__init__("seasonal_naive")
        self.seasonal_period = seasonal_period
        self.seasonal_values: pd.Series | None = None

    def fit(
        self,
        y_train: pd.Series,
        X_train: pd.DataFrame | None = None,
    ) -> "SeasonalNaiveForecaster":
        """Fit seasonal naive model."""
        self.validate_data(y_train)

        if len(y_train) < self.seasonal_period:
            raise ValueError(
                f"Need at least {self.seasonal_period} observations for seasonal naive"
            )

        # Store last season
        self.seasonal_values = y_train.iloc[-self.seasonal_period :]
        self.training_cutoff = y_train.index[-1]
        self.is_fitted = True

        logger.info(
            f"Seasonal naive model fitted with period={self.seasonal_period}, "
            f"{len(self.seasonal_values)} seasonal values"
        )
        return self

    def predict(
        self,
        steps: int,
        X_test: pd.DataFrame | None = None,
    ) -> ForecastResult:
        """Generate seasonal naive forecasts."""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")

        # Repeat seasonal pattern
        predictions = []
        for i in range(steps):
            season_idx = i % self.seasonal_period
            predictions.append(self.seasonal_values.iloc[season_idx])

        return ForecastResult(
            predictions=np.array(predictions),
            model_name=self.name,
        )


class MovingAverageForecaster(BaseForecaster):
    """
    Moving average forecast.

    Uses average of last N observations for prediction.
    """

    def __init__(self, window: int = 7):
        """
        Initialize moving average forecaster.

        Args:
            window: Number of periods to average
        """
        super().__init__(f"moving_average_{window}")
        self.window = window
        self.recent_values: np.ndarray | None = None

    def fit(
        self,
        y_train: pd.Series,
        X_train: pd.DataFrame | None = None,
    ) -> "MovingAverageForecaster":
        """Fit moving average model."""
        self.validate_data(y_train)

        if len(y_train) < self.window:
            raise ValueError(f"Need at least {self.window} observations for moving average")

        # Store last window values
        self.recent_values = y_train.iloc[-self.window :].values
        self.training_cutoff = y_train.index[-1]
        self.is_fitted = True

        logger.info(f"Moving average model fitted with window={self.window}")
        return self

    def predict(
        self,
        steps: int,
        X_test: pd.DataFrame | None = None,
    ) -> ForecastResult:
        """Generate moving average forecasts."""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")

        # Use simple moving average of recent values
        ma_value = np.mean(self.recent_values)
        predictions = np.full(steps, ma_value)

        return ForecastResult(
            predictions=predictions,
            model_name=self.name,
        )


class SimpleExponentialSmoothingForecaster(BaseForecaster):
    """
    Simple exponential smoothing forecast.

    Uses exponentially weighted average with more weight on recent observations.
    """

    def __init__(self, alpha: float = 0.3):
        """
        Initialize exponential smoothing forecaster.

        Args:
            alpha: Smoothing parameter (0 < alpha < 1)
        """
        super().__init__(f"ses_alpha{alpha}")
        self.alpha = alpha
        self.model: ExponentialSmoothing | None = None
        self.fitted_model = None

    def fit(
        self,
        y_train: pd.Series,
        X_train: pd.DataFrame | None = None,
    ) -> "SimpleExponentialSmoothingForecaster":
        """Fit exponential smoothing model."""
        self.validate_data(y_train)

        try:
            # Fit statsmodels ExponentialSmoothing
            self.model = ExponentialSmoothing(
                y_train,
                trend=None,
                seasonal=None,
                initialization_method="estimated",
            )
            self.fitted_model = self.model.fit(smoothing_level=self.alpha)
            self.training_cutoff = y_train.index[-1]
            self.is_fitted = True

            logger.info(f"Exponential smoothing model fitted with alpha={self.alpha}")
        except Exception as e:
            logger.error(f"Failed to fit exponential smoothing: {e}")
            raise

        return self

    def predict(
        self,
        steps: int,
        X_test: pd.DataFrame | None = None,
    ) -> ForecastResult:
        """Generate exponential smoothing forecasts."""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")

        predictions = self.fitted_model.forecast(steps=steps)

        return ForecastResult(
            predictions=predictions.values,
            model_name=self.name,
        )


def create_baseline_ensemble(
    y_train: pd.Series,
    models: list[str] | None = None,
) -> dict[str, BaseForecaster]:
    """
    Create and fit multiple baseline models.

    Args:
        y_train: Training data
        models: List of model names to include (None = all)

    Returns:
        Dictionary of fitted models
    """
    available_models = {
        "naive": NaiveForecaster(),
        "seasonal_naive_12": SeasonalNaiveForecaster(seasonal_period=12),
        "ma_7": MovingAverageForecaster(window=7),
        "ma_30": MovingAverageForecaster(window=30),
        "ses_0.3": SimpleExponentialSmoothingForecaster(alpha=0.3),
    }

    if models is None:
        models_to_fit = available_models
    else:
        models_to_fit = {k: v for k, v in available_models.items() if k in models}

    fitted_models = {}

    for name, model in models_to_fit.items():
        try:
            model.fit(y_train)
            fitted_models[name] = model
            logger.info(f"✓ Fitted {name}")
        except Exception as e:
            logger.warning(f"✗ Failed to fit {name}: {e}")

    return fitted_models


def compare_baselines(
    y_train: pd.Series,
    y_test: pd.Series,
    steps: int | None = None,
) -> pd.DataFrame:
    """
    Compare all baseline models on test data.

    Args:
        y_train: Training data
        y_test: Test data
        steps: Number of steps to forecast (None = len(y_test))

    Returns:
        DataFrame with model comparison metrics
    """
    if steps is None:
        steps = len(y_test)

    # Fit all baseline models
    models = create_baseline_ensemble(y_train)

    results = []

    for name, model in models.items():
        try:
            # Generate forecast
            forecast = model.predict(steps)

            # Calculate metrics
            metrics = model.compute_metrics(
                y_test.values[:steps],
                forecast.predictions[:steps],
            )

            results.append({
                "model": name,
                "mae": metrics.mae,
                "rmse": metrics.rmse,
                "mape": metrics.mape,
                "smape": metrics.smape,
                "r2": metrics.r2,
                "directional_accuracy": metrics.directional_accuracy,
            })

        except Exception as e:
            logger.error(f"Failed to evaluate {name}: {e}")

    df_results = pd.DataFrame(results)

    if not df_results.empty:
        # Sort by MAE (lower is better)
        df_results = df_results.sort_values("mae")

    return df_results

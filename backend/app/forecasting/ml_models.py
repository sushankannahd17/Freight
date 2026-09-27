"""
Advanced ML forecasting models (XGBoost, LightGBM).
"""

import numpy as np
import pandas as pd
import xgboost as xgb
import lightgbm as lgb
import shap

from app.core.logging import get_logger
from app.forecasting.base import BaseForecaster, ForecastResult

logger = get_logger(__name__)


class XGBoostForecaster(BaseForecaster):
    """XGBoost regression forecaster with SHAP explainability."""

    def __init__(
        self,
        n_estimators: int = 100,
        max_depth: int = 6,
        learning_rate: float = 0.1,
        **kwargs,
    ):
        super().__init__("xgboost")
        self.params = {
            "n_estimators": n_estimators,
            "max_depth": max_depth,
            "learning_rate": learning_rate,
            "objective": "reg:squarederror",
            **kwargs,
        }
        self.model = None
        self.feature_names = None
        self.explainer = None

    def fit(
        self,
        y_train: pd.Series,
        X_train: pd.DataFrame | None = None,
    ) -> "XGBoostForecaster":
        """Fit XGBoost model."""
        self.validate_data(y_train)

        if X_train is None:
            raise ValueError("XGBoost requires feature matrix X_train")

        self.feature_names = X_train.columns.tolist()

        # Train model
        self.model = xgb.XGBRegressor(**self.params)
        self.model.fit(X_train, y_train)

        self.training_cutoff = y_train.index[-1]
        self.is_fitted = True

        # Create SHAP explainer
        try:
            self.explainer = shap.TreeExplainer(self.model)
        except Exception as e:
            logger.warning(f"Failed to create SHAP explainer: {e}")

        logger.info(
            f"XGBoost fitted with {len(X_train)} samples, "
            f"{len(self.feature_names)} features"
        )

        return self

    def predict(
        self,
        steps: int,
        X_test: pd.DataFrame | None = None,
    ) -> ForecastResult:
        """Generate XGBoost forecasts."""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")

        if X_test is None:
            raise ValueError("XGBoost requires feature matrix X_test")

        # Generate predictions
        predictions = self.model.predict(X_test[:steps])

        # Calculate feature importance
        feature_importance = None
        if self.feature_names:
            importance_scores = self.model.feature_importances_
            feature_importance = dict(zip(self.feature_names, importance_scores))
            # Sort by importance
            feature_importance = dict(
                sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
            )

        # Generate SHAP values if available
        shap_values = None
        if self.explainer:
            try:
                shap_values = self.explainer.shap_values(X_test[:steps])
            except Exception as e:
                logger.warning(f"Failed to compute SHAP values: {e}")

        return ForecastResult(
            predictions=predictions,
            model_name=self.name,
            feature_importance=feature_importance,
            metadata={"shap_values": shap_values} if shap_values is not None else None,
        )

    def get_feature_importance(self, top_n: int = 10) -> dict[str, float]:
        """Get top N most important features."""
        if not self.is_fitted:
            raise ValueError("Model must be fitted first")

        importance_scores = self.model.feature_importances_
        feature_importance = dict(zip(self.feature_names, importance_scores))

        # Sort and get top N
        sorted_features = sorted(
            feature_importance.items(), key=lambda x: x[1], reverse=True
        )

        return dict(sorted_features[:top_n])


class LightGBMForecaster(BaseForecaster):
    """LightGBM regression forecaster."""

    def __init__(
        self,
        n_estimators: int = 100,
        max_depth: int = 6,
        learning_rate: float = 0.1,
        **kwargs,
    ):
        super().__init__("lightgbm")
        self.params = {
            "n_estimators": n_estimators,
            "max_depth": max_depth,
            "learning_rate": learning_rate,
            "objective": "regression",
            "verbosity": -1,
            **kwargs,
        }
        self.model = None
        self.feature_names = None

    def fit(
        self,
        y_train: pd.Series,
        X_train: pd.DataFrame | None = None,
    ) -> "LightGBMForecaster":
        """Fit LightGBM model."""
        self.validate_data(y_train)

        if X_train is None:
            raise ValueError("LightGBM requires feature matrix X_train")

        self.feature_names = X_train.columns.tolist()

        # Train model
        self.model = lgb.LGBMRegressor(**self.params)
        self.model.fit(X_train, y_train)

        self.training_cutoff = y_train.index[-1]
        self.is_fitted = True

        logger.info(
            f"LightGBM fitted with {len(X_train)} samples, "
            f"{len(self.feature_names)} features"
        )

        return self

    def predict(
        self,
        steps: int,
        X_test: pd.DataFrame | None = None,
    ) -> ForecastResult:
        """Generate LightGBM forecasts."""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")

        if X_test is None:
            raise ValueError("LightGBM requires feature matrix X_test")

        # Generate predictions
        predictions = self.model.predict(X_test[:steps])

        # Calculate feature importance
        feature_importance = None
        if self.feature_names:
            importance_scores = self.model.feature_importances_
            feature_importance = dict(zip(self.feature_names, importance_scores))
            feature_importance = dict(
                sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
            )

        return ForecastResult(
            predictions=predictions,
            model_name=self.name,
            feature_importance=feature_importance,
        )

    def get_feature_importance(self, top_n: int = 10) -> dict[str, float]:
        """Get top N most important features."""
        if not self.is_fitted:
            raise ValueError("Model must be fitted first")

        importance_scores = self.model.feature_importances_
        feature_importance = dict(zip(self.feature_names, importance_scores))

        sorted_features = sorted(
            feature_importance.items(), key=lambda x: x[1], reverse=True
        )

        return dict(sorted_features[:top_n])


def explain_forecast(
    model: XGBoostForecaster | LightGBMForecaster,
    X_sample: pd.DataFrame,
    top_n: int = 5,
) -> dict[str, float]:
    """
    Explain forecast with top contributing features.

    Args:
        model: Fitted forecaster
        X_sample: Feature sample to explain
        top_n: Number of top features to return

    Returns:
        Dictionary of feature contributions
    """
    if not model.is_fitted:
        raise ValueError("Model must be fitted first")

    # Get feature importance
    importance = model.get_feature_importance(top_n=top_n)

    logger.info(f"Top {top_n} features: {list(importance.keys())}")

    return importance

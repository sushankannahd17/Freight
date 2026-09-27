"""
Lag feature generation for time series forecasting.
"""

import pandas as pd

from app.core.logging import get_logger

logger = get_logger(__name__)


def create_lag_features(
    df: pd.DataFrame,
    target_col: str,
    lags: list[int] | None = None,
) -> pd.DataFrame:
    """
    Create lag features for time series.

    Args:
        df: DataFrame with datetime index
        target_col: Target column name
        lags: List of lag periods (default: [1, 3, 7, 14, 30, 60, 90])

    Returns:
        DataFrame with lag features
    """
    if lags is None:
        lags = [1, 3, 7, 14, 30, 60, 90]

    df = df.copy()

    for lag in lags:
        col_name = f"{target_col}_lag_{lag}"
        df[col_name] = df[target_col].shift(lag)

    logger.info(f"Created {len(lags)} lag features")
    return df


def create_rolling_features(
    df: pd.DataFrame,
    target_col: str,
    windows: list[int] | None = None,
) -> pd.DataFrame:
    """
    Create rolling window features.

    Args:
        df: DataFrame with datetime index
        target_col: Target column name
        windows: List of window sizes (default: [7, 14, 30])

    Returns:
        DataFrame with rolling features
    """
    if windows is None:
        windows = [7, 14, 30]

    df = df.copy()

    for window in windows:
        # Rolling mean
        df[f"{target_col}_rolling_mean_{window}"] = (
            df[target_col].rolling(window=window, min_periods=1).mean()
        )

        # Rolling std
        df[f"{target_col}_rolling_std_{window}"] = (
            df[target_col].rolling(window=window, min_periods=1).std()
        )

        # Rolling min/max
        df[f"{target_col}_rolling_min_{window}"] = (
            df[target_col].rolling(window=window, min_periods=1).min()
        )

        df[f"{target_col}_rolling_max_{window}"] = (
            df[target_col].rolling(window=window, min_periods=1).max()
        )

    logger.info(f"Created rolling features for {len(windows)} windows")
    return df


def create_trend_features(
    df: pd.DataFrame,
    target_col: str,
    periods: list[int] | None = None,
) -> pd.DataFrame:
    """
    Create trend/change features.

    Args:
        df: DataFrame with datetime index
        target_col: Target column name
        periods: List of periods for change calculation

    Returns:
        DataFrame with trend features
    """
    if periods is None:
        periods = [7, 14, 30]

    df = df.copy()

    for period in periods:
        # Absolute change
        df[f"{target_col}_change_{period}d"] = df[target_col].diff(period)

        # Percentage change
        df[f"{target_col}_pct_change_{period}d"] = df[target_col].pct_change(period)

    logger.info(f"Created trend features for {periods}")
    return df


def create_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create time-based features from datetime index.

    Args:
        df: DataFrame with datetime index

    Returns:
        DataFrame with time features
    """
    df = df.copy()

    df["year"] = df.index.year
    df["month"] = df.index.month
    df["quarter"] = df.index.quarter
    df["day_of_week"] = df.index.dayofweek
    df["day_of_year"] = df.index.dayofyear
    df["week_of_year"] = df.index.isocalendar().week

    logger.info("Created time-based features")
    return df


def create_all_features(
    df: pd.DataFrame,
    target_col: str,
    include_lags: bool = True,
    include_rolling: bool = True,
    include_trend: bool = True,
    include_time: bool = True,
) -> pd.DataFrame:
    """
    Create all feature types.

    Args:
        df: DataFrame with datetime index
        target_col: Target column name
        include_lags: Include lag features
        include_rolling: Include rolling features
        include_trend: Include trend features
        include_time: Include time features

    Returns:
        DataFrame with all features
    """
    df = df.copy()

    if include_lags:
        df = create_lag_features(df, target_col)

    if include_rolling:
        df = create_rolling_features(df, target_col)

    if include_trend:
        df = create_trend_features(df, target_col)

    if include_time:
        df = create_time_features(df)

    # Drop rows with NaN (from initial lags)
    initial_rows = len(df)
    df = df.dropna()
    dropped_rows = initial_rows - len(df)

    logger.info(f"Created complete feature set, dropped {dropped_rows} rows with NaN")

    return df

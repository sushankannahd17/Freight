"""
Configuration Management for FreightIQ Backend

Uses Pydantic Settings for type-safe configuration with environment variable support.
"""

from functools import lru_cache
from typing import List

from pydantic import Field, PostgresDsn, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ========================================================================
    # APPLICATION
    # ========================================================================
    app_name: str = Field(default="FreightIQ", alias="APP_NAME")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    environment: str = Field(default="development", alias="ENVIRONMENT")
    debug: bool = Field(default=False, alias="DEBUG")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # API Configuration
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    api_prefix: str = Field(default="/api/v1", alias="API_PREFIX")
    cors_origins: str | List[str] = Field(
        default="http://localhost:5173,http://localhost:3000",
        alias="CORS_ORIGINS",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # ========================================================================
    # DATABASE
    # ========================================================================
    database_url: PostgresDsn = Field(
        ...,  # Required
        alias="DATABASE_URL",
    )
    database_pool_size: int = Field(default=20, alias="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=10, alias="DATABASE_MAX_OVERFLOW")
    database_echo: bool = Field(default=False, alias="DATABASE_ECHO")

    # ========================================================================
    # REDIS
    # ========================================================================
    redis_url: RedisDsn = Field(
        default="redis://localhost:6379/0",
        alias="REDIS_URL",
    )

    # Cache TTLs (seconds)
    cache_ttl_vessel_positions: int = Field(default=300, alias="CACHE_TTL_VESSEL_POSITIONS")
    cache_ttl_weather: int = Field(default=900, alias="CACHE_TTL_WEATHER")
    cache_ttl_congestion: int = Field(default=600, alias="CACHE_TTL_CONGESTION")
    cache_ttl_market: int = Field(default=3600, alias="CACHE_TTL_MARKET")
    cache_ttl_forecast: int = Field(default=1800, alias="CACHE_TTL_FORECAST")

    # ========================================================================
    # CELERY
    # ========================================================================
    celery_broker_url: str = Field(
        default="redis://localhost:6379/1",
        alias="CELERY_BROKER_URL",
    )
    celery_result_backend: str = Field(
        default="redis://localhost:6379/1",
        alias="CELERY_RESULT_BACKEND",
    )
    celery_task_track_started: bool = Field(default=True, alias="CELERY_TASK_TRACK_STARTED")
    celery_task_time_limit: int = Field(default=3600, alias="CELERY_TASK_TIME_LIMIT")

    # ========================================================================
    # SECURITY
    # ========================================================================
    secret_key: str = Field(..., alias="SECRET_KEY")
    jwt_secret_key: str = Field(..., alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_expiration_minutes: int = Field(default=60, alias="JWT_EXPIRATION_MINUTES")

    # Rate Limiting
    rate_limit_enabled: bool = Field(default=True, alias="RATE_LIMIT_ENABLED")
    rate_limit_per_minute: int = Field(default=60, alias="RATE_LIMIT_PER_MINUTE")

    # ========================================================================
    # MLFLOW
    # ========================================================================
    mlflow_tracking_uri: str = Field(
        default="http://localhost:5000",
        alias="MLFLOW_TRACKING_URI",
    )
    mlflow_experiment_name: str = Field(
        default="freightiq-forecasting",
        alias="MLFLOW_EXPERIMENT_NAME",
    )

    # ========================================================================
    # DATA PROVIDERS - MARKET
    # ========================================================================
    baltic_api_key: str = Field(default="", alias="BALTIC_API_KEY")
    baltic_api_url: str = Field(
        default="https://api.balticexchange.com/v1",
        alias="BALTIC_API_URL",
    )
    baltic_enabled: bool = Field(default=False, alias="BALTIC_ENABLED")

    # ========================================================================
    # DATA PROVIDERS - AIS
    # ========================================================================
    vesselfinder_api_key: str = Field(default="", alias="VESSELFINDER_API_KEY")
    vesselfinder_api_url: str = Field(
        default="https://api.vesselfinder.com/v1",
        alias="VESSELFINDER_API_URL",
    )
    vesselfinder_enabled: bool = Field(default=False, alias="VESSELFINDER_ENABLED")

    marinetraffic_api_key: str = Field(default="", alias="MARINETRAFFIC_API_KEY")
    marinetraffic_api_url: str = Field(
        default="https://services.marinetraffic.com/api",
        alias="MARINETRAFFIC_API_URL",
    )
    marinetraffic_enabled: bool = Field(default=False, alias="MARINETRAFFIC_ENABLED")

    # ========================================================================
    # DATA PROVIDERS - WEATHER
    # ========================================================================
    imd_api_key: str = Field(default="", alias="IMD_API_KEY")
    imd_api_url: str = Field(default="https://api.imd.gov.in", alias="IMD_API_URL")
    imd_enabled: bool = Field(default=False, alias="IMD_ENABLED")

    openmeteo_api_url: str = Field(
        default="https://marine-api.open-meteo.com/v1",
        alias="OPENMETEO_API_URL",
    )
    openmeteo_enabled: bool = Field(default=True, alias="OPENMETEO_ENABLED")

    # ========================================================================
    # DATA PROVIDERS - MARINE
    # ========================================================================
    copernicus_username: str = Field(default="", alias="COPERNICUS_USERNAME")
    copernicus_password: str = Field(default="", alias="COPERNICUS_PASSWORD")
    copernicus_api_url: str = Field(
        default="https://my.cmems-du.eu/motu-web",
        alias="COPERNICUS_API_URL",
    )
    copernicus_enabled: bool = Field(default=False, alias="COPERNICUS_ENABLED")

    # ========================================================================
    # DATA PROVIDERS - TRADE & ECONOMICS
    # ========================================================================
    comtrade_api_key: str = Field(default="", alias="COMTRADE_API_KEY")
    comtrade_enabled: bool = Field(default=False, alias="COMTRADE_ENABLED")

    fx_enabled: bool = Field(default=True, alias="FX_ENABLED")

    # ========================================================================
    # FORECASTING
    # ========================================================================
    forecast_horizons: str | List[int] = Field(
        default="1,3,7,14,30,60,90",
        alias="FORECAST_HORIZONS",
    )
    forecast_confidence_levels: str | List[float] = Field(
        default="0.80,0.95",
        alias="FORECAST_CONFIDENCE_LEVELS",
    )
    forecast_min_training_days: int = Field(
        default=365,
        alias="FORECAST_MIN_TRAINING_DAYS",
    )

    @field_validator("forecast_horizons", mode="before")
    @classmethod
    def parse_forecast_horizons(cls, v: str | List[int]) -> List[int]:
        if isinstance(v, str):
            return [int(x.strip()) for x in v.split(",")]
        return v

    @field_validator("forecast_confidence_levels", mode="before")
    @classmethod
    def parse_confidence_levels(cls, v: str | List[float]) -> List[float]:
        if isinstance(v, str):
            return [float(x.strip()) for x in v.split(",")]
        return v

    # ========================================================================
    # OPTIMIZATION
    # ========================================================================
    optimization_max_vessels: int = Field(default=10, alias="OPTIMIZATION_MAX_VESSELS")
    optimization_max_scenarios: int = Field(default=100, alias="OPTIMIZATION_MAX_SCENARIOS")
    optimization_timeout_seconds: int = Field(default=60, alias="OPTIMIZATION_TIMEOUT_SECONDS")

    # ========================================================================
    # DATA QUALITY
    # ========================================================================
    data_freshness_warning_hours: int = Field(
        default=6,
        alias="DATA_FRESHNESS_WARNING_HOURS",
    )
    data_freshness_error_hours: int = Field(
        default=24,
        alias="DATA_FRESHNESS_ERROR_HOURS",
    )
    data_quality_min_score: float = Field(default=0.7, alias="DATA_QUALITY_MIN_SCORE")

    # ========================================================================
    # MONITORING
    # ========================================================================
    prometheus_enabled: bool = Field(default=True, alias="PROMETHEUS_ENABLED")
    metrics_enabled: bool = Field(default=True, alias="METRICS_ENABLED")

    # ========================================================================
    # COMPUTED PROPERTIES
    # ========================================================================
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() == "development"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.

    Returns:
        Settings: Application settings
    """
    return Settings()


# Export settings instance
settings = get_settings()

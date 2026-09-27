"""Weather models - imported from consolidated models."""
from app.models.models import MarineCondition, WeatherObservation

# Placeholders for models not yet implemented
WeatherForecast = None
WaveCondition = None
OceanCurrent = None
MarineWarning = None

__all__ = ["WeatherObservation", "WeatherForecast", "MarineCondition", "WaveCondition", "OceanCurrent", "MarineWarning"]

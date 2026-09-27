"""
Open-Meteo Marine weather provider.

Free marine weather and ocean data API (no API key required).
"""

from datetime import datetime
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import log_provider_error, log_provider_request, log_provider_response
from app.providers.base import BaseDataProvider, ProviderResponse


class OpenMeteoProvider(BaseDataProvider):
    """Open-Meteo Marine API provider (free, no auth required)."""

    def __init__(self):
        """Initialize Open-Meteo provider."""
        super().__init__(
            provider_id="open_meteo",
            provider_name="Open-Meteo Marine",
            api_key=None,  # No key required
            api_url=settings.openmeteo_api_url,
        )

    def is_configured(self) -> bool:
        """Open-Meteo doesn't require API key."""
        return True

    async def health_check(self) -> bool:
        """Check Open-Meteo API health."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.api_url}/marine",
                    params={
                        "latitude": 0,
                        "longitude": 0,
                        "current": "wave_height",
                    },
                )
                return response.status_code == 200
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return False

    async def fetch_marine_conditions(
        self,
        latitude: float,
        longitude: float,
        hourly_params: list[str] | None = None,
    ) -> ProviderResponse:
        """
        Fetch marine conditions for location.

        Args:
            latitude: Location latitude
            longitude: Location longitude
            hourly_params: Marine parameters to fetch

        Returns:
            Provider response with marine data
        """
        if hourly_params is None:
            hourly_params = [
                "wave_height",
                "wave_direction",
                "wave_period",
                "wind_wave_height",
                "swell_wave_height",
                "swell_wave_direction",
                "swell_wave_period",
                "ocean_current_velocity",
                "ocean_current_direction",
            ]

        endpoint = "/marine"
        log_provider_request(self.logger, self.provider_name, endpoint)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                start_time = datetime.now()

                response = await client.get(
                    f"{self.api_url}{endpoint}",
                    params={
                        "latitude": latitude,
                        "longitude": longitude,
                        "hourly": ",".join(hourly_params),
                        "timezone": "UTC",
                    },
                )

                latency_ms = (datetime.now() - start_time).total_seconds() * 1000

                log_provider_response(
                    self.logger,
                    self.provider_name,
                    endpoint,
                    response.status_code,
                    latency_ms,
                )

                if response.status_code == 200:
                    data = response.json()
                    return ProviderResponse(
                        success=True,
                        data=data,
                        status_code=response.status_code,
                        retrieved_at=datetime.utcnow(),
                    )
                else:
                    return ProviderResponse(
                        success=False,
                        data=None,
                        status_code=response.status_code,
                        error_message=f"HTTP {response.status_code}",
                    )

        except Exception as e:
            log_provider_error(self.logger, self.provider_name, endpoint, str(e))
            return ProviderResponse(
                success=False,
                data=None,
                error_message=str(e),
            )

    async def fetch_route_conditions(
        self,
        waypoints: list[tuple[float, float]],
    ) -> ProviderResponse:
        """
        Fetch marine conditions along route.

        Args:
            waypoints: List of (latitude, longitude) tuples

        Returns:
            Provider response with conditions for each waypoint
        """
        all_conditions = []

        for i, (lat, lon) in enumerate(waypoints):
            result = await self.fetch_marine_conditions(lat, lon)

            if result.success:
                all_conditions.append({
                    "waypoint": i,
                    "latitude": lat,
                    "longitude": lon,
                    "conditions": result.data,
                })
            else:
                self.logger.warning(f"Failed to fetch conditions for waypoint {i}")

        if all_conditions:
            return ProviderResponse(
                success=True,
                data={"waypoints": all_conditions},
                retrieved_at=datetime.utcnow(),
            )
        else:
            return ProviderResponse(
                success=False,
                data=None,
                error_message="Failed to fetch any waypoint conditions",
            )

    async def fetch(self, **kwargs) -> ProviderResponse:
        """
        Fetch marine weather data.

        Kwargs:
            latitude, longitude: Single point
            waypoints: List of (lat, lon) tuples for route

        Returns:
            Provider response
        """
        if "waypoints" in kwargs:
            return await self.fetch_route_conditions(kwargs["waypoints"])
        elif "latitude" in kwargs and "longitude" in kwargs:
            return await self.fetch_marine_conditions(
                kwargs["latitude"],
                kwargs["longitude"],
                kwargs.get("hourly_params"),
            )
        else:
            return ProviderResponse(
                success=False,
                data=None,
                error_message="Either 'latitude'/'longitude' or 'waypoints' required",
            )

    def normalize(self, raw_data: Any) -> list[dict[str, Any]]:
        """
        Normalize Open-Meteo marine data.

        Args:
            raw_data: Raw API response

        Returns:
            Normalized marine condition records
        """
        if not raw_data:
            return []

        normalized = []

        try:
            # Handle waypoints vs single point
            if "waypoints" in raw_data:
                # Route data
                for waypoint_data in raw_data["waypoints"]:
                    conditions = self._normalize_single_point(
                        waypoint_data["conditions"],
                        waypoint_data["latitude"],
                        waypoint_data["longitude"],
                    )
                    normalized.extend(conditions)
            else:
                # Single point data
                normalized = self._normalize_single_point(
                    raw_data,
                    raw_data.get("latitude"),
                    raw_data.get("longitude"),
                )

        except Exception as e:
            self.logger.error(f"Failed to normalize data: {e}")
            return []

        self.logger.info(f"Normalized {len(normalized)} marine condition records")
        return normalized

    def _normalize_single_point(
        self,
        data: dict,
        latitude: float,
        longitude: float,
    ) -> list[dict[str, Any]]:
        """Normalize single point marine data."""
        normalized = []

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])

        for i, timestamp in enumerate(times):
            try:
                record = {
                    "latitude": latitude,
                    "longitude": longitude,
                    "observation_time": timestamp,
                    "wave_height_m": self._get_value(hourly, "wave_height", i),
                    "wave_direction_degrees": self._get_value(hourly, "wave_direction", i),
                    "wave_period_s": self._get_value(hourly, "wave_period", i),
                    "swell_height_m": self._get_value(hourly, "swell_wave_height", i),
                    "swell_direction_degrees": self._get_value(
                        hourly, "swell_wave_direction", i
                    ),
                    "swell_period_s": self._get_value(hourly, "swell_wave_period", i),
                    "current_speed_knots": self._get_value(
                        hourly, "ocean_current_velocity", i
                    ),
                    "current_direction_degrees": self._get_value(
                        hourly, "ocean_current_direction", i
                    ),
                }

                normalized.append(record)

            except Exception as e:
                self.logger.warning(f"Failed to normalize record {i}: {e}")
                continue

        return normalized

    def _get_value(self, data: dict, key: str, index: int) -> float | None:
        """Safely get value from array."""
        values = data.get(key, [])
        if index < len(values):
            value = values[index]
            return float(value) if value is not None else None
        return None

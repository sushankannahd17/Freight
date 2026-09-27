"""
India Meteorological Department (IMD) weather provider.

Provides weather data for Indian ports and coastal regions.
"""

from datetime import datetime
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import log_provider_error, log_provider_request, log_provider_response
from app.providers.base import BaseDataProvider, ProviderResponse


class IMDProvider(BaseDataProvider):
    """India Meteorological Department API provider."""

    def __init__(self):
        """Initialize IMD provider."""
        super().__init__(
            provider_id="imd",
            provider_name="India Meteorological Department",
            api_key=settings.imd_api_key,
            api_url=settings.imd_api_url,
        )

    async def health_check(self) -> bool:
        """Check IMD API health."""
        if not self.is_configured():
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.api_url}/weather/current",
                    headers=self._get_headers(),
                    params={"city": "Mumbai"},
                )
                return response.status_code in [200, 404]
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return False

    async def fetch_weather_for_port(
        self,
        port_name: str,
        city: str | None = None,
    ) -> ProviderResponse:
        """
        Fetch weather for Indian port.

        Args:
            port_name: Port name
            city: Nearest city

        Returns:
            Provider response with weather data
        """
        if not self.is_configured():
            return ProviderResponse(
                success=False,
                data=None,
                error_message="API key not configured",
            )

        endpoint = "/weather/current"
        location = city or port_name
        log_provider_request(self.logger, self.provider_name, endpoint)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                start_time = datetime.now()

                response = await client.get(
                    f"{self.api_url}{endpoint}",
                    headers=self._get_headers(),
                    params={"city": location},
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

    async def fetch_marine_warnings(self) -> ProviderResponse:
        """
        Fetch marine weather warnings for Indian coast.

        Returns:
            Provider response with warnings
        """
        if not self.is_configured():
            return ProviderResponse(
                success=False,
                data=None,
                error_message="API key not configured",
            )

        endpoint = "/warnings/marine"
        log_provider_request(self.logger, self.provider_name, endpoint)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                start_time = datetime.now()

                response = await client.get(
                    f"{self.api_url}{endpoint}",
                    headers=self._get_headers(),
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

    async def fetch(self, **kwargs) -> ProviderResponse:
        """
        Fetch weather data.

        Kwargs:
            port_name: Port name
            warnings: If True, fetch marine warnings

        Returns:
            Provider response
        """
        if kwargs.get("warnings"):
            return await self.fetch_marine_warnings()
        elif "port_name" in kwargs:
            return await self.fetch_weather_for_port(
                kwargs["port_name"],
                kwargs.get("city"),
            )
        else:
            return ProviderResponse(
                success=False,
                data=None,
                error_message="Either 'port_name' or 'warnings=True' required",
            )

    def normalize(self, raw_data: Any) -> list[dict[str, Any]]:
        """
        Normalize IMD weather data.

        Args:
            raw_data: Raw API response

        Returns:
            Normalized weather records
        """
        if not raw_data:
            return []

        normalized = []

        try:
            # Handle warnings vs weather observations
            if isinstance(raw_data, dict) and "warnings" in raw_data:
                # Marine warnings
                for warning in raw_data.get("warnings", []):
                    normalized.append({
                        "type": "warning",
                        "severity": warning.get("severity"),
                        "title": warning.get("title"),
                        "description": warning.get("description"),
                        "issued_at": warning.get("issued_at"),
                        "valid_until": warning.get("valid_until"),
                        "area": warning.get("area"),
                    })
            else:
                # Weather observation
                normalized.append({
                    "type": "observation",
                    "location": raw_data.get("city") or raw_data.get("location"),
                    "observation_time": raw_data.get("time") or raw_data.get("timestamp"),
                    "temperature_c": raw_data.get("temperature"),
                    "wind_speed_knots": raw_data.get("wind_speed"),
                    "wind_direction_degrees": raw_data.get("wind_direction"),
                    "precipitation_mm": raw_data.get("rainfall") or raw_data.get("precipitation"),
                    "visibility_km": raw_data.get("visibility"),
                    "pressure_hpa": raw_data.get("pressure"),
                    "humidity_pct": raw_data.get("humidity"),
                    "conditions": raw_data.get("conditions") or raw_data.get("weather"),
                })

        except Exception as e:
            self.logger.error(f"Failed to normalize data: {e}")
            return []

        self.logger.info(f"Normalized {len(normalized)} weather records")
        return normalized

    def _get_headers(self) -> dict[str, str]:
        """Get API request headers."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "FreightIQ/0.1.0",
        }

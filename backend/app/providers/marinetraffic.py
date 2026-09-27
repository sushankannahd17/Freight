"""
MarineTraffic AIS data provider.

Alternative AIS provider for vessel tracking.
"""

from datetime import datetime
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import log_provider_error, log_provider_request, log_provider_response
from app.providers.base import BaseDataProvider, ProviderResponse


class MarineTrafficProvider(BaseDataProvider):
    """MarineTraffic API provider."""

    def __init__(self):
        """Initialize MarineTraffic provider."""
        super().__init__(
            provider_id="marinetraffic",
            provider_name="MarineTraffic",
            api_key=settings.marinetraffic_api_key,
            api_url=settings.marinetraffic_api_url,
        )

    async def health_check(self) -> bool:
        """Check MarineTraffic API health."""
        if not self.is_configured():
            return False

        try:
            # MarineTraffic uses different endpoint structure
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.api_url}/exportvessel",
                    params={
                        "v": "8",
                        "protocol": "json",
                        "msgtype": "simple",
                        "imo": "9999999",
                    },
                    headers=self._get_headers(),
                )
                return response.status_code in [200, 404]
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return False

    async def fetch_vessel_by_imo(self, imo: int) -> ProviderResponse:
        """
        Fetch vessel data by IMO.

        Args:
            imo: Vessel IMO number

        Returns:
            Provider response with vessel data
        """
        if not self.is_configured():
            return ProviderResponse(
                success=False,
                data=None,
                error_message="API key not configured",
            )

        endpoint = "/exportvessel"
        log_provider_request(self.logger, self.provider_name, endpoint)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                start_time = datetime.now()

                response = await client.get(
                    f"{self.api_url}{endpoint}",
                    params={
                        "v": "8",
                        "protocol": "json",
                        "msgtype": "extended",
                        "imo": imo,
                    },
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

    async def fetch_vessels_in_area(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
    ) -> ProviderResponse:
        """
        Fetch vessels in bounding box.

        Args:
            min_lat: Minimum latitude
            max_lat: Maximum latitude
            min_lon: Minimum longitude
            max_lon: Maximum longitude

        Returns:
            Provider response with vessels
        """
        if not self.is_configured():
            return ProviderResponse(
                success=False,
                data=None,
                error_message="API key not configured",
            )

        endpoint = "/exportvessels"
        log_provider_request(self.logger, self.provider_name, endpoint)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                start_time = datetime.now()

                response = await client.get(
                    f"{self.api_url}{endpoint}",
                    params={
                        "v": "8",
                        "protocol": "json",
                        "msgtype": "simple",
                        "minlat": min_lat,
                        "maxlat": max_lat,
                        "minlon": min_lon,
                        "maxlon": max_lon,
                    },
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
        Fetch vessel data.

        Kwargs:
            imo: Vessel IMO number
            bbox: Bounding box (min_lat, max_lat, min_lon, max_lon)

        Returns:
            Provider response
        """
        if "imo" in kwargs:
            return await self.fetch_vessel_by_imo(kwargs["imo"])
        elif "bbox" in kwargs:
            bbox = kwargs["bbox"]
            return await self.fetch_vessels_in_area(*bbox)
        else:
            return ProviderResponse(
                success=False,
                data=None,
                error_message="Either 'imo' or 'bbox' required",
            )

    def normalize(self, raw_data: Any) -> list[dict[str, Any]]:
        """
        Normalize MarineTraffic data.

        Args:
            raw_data: Raw API response

        Returns:
            Normalized vessel position records
        """
        if not raw_data:
            return []

        normalized = []

        # MarineTraffic returns data in specific structure
        if isinstance(raw_data, dict):
            vessels = raw_data.get("data", [])
        elif isinstance(raw_data, list):
            vessels = raw_data
        else:
            return []

        for vessel in vessels:
            try:
                position_data = {
                    "imo": vessel.get("IMO"),
                    "mmsi": vessel.get("MMSI"),
                    "vessel_name": vessel.get("SHIPNAME"),
                    "latitude": float(vessel.get("LAT", 0)),
                    "longitude": float(vessel.get("LON", 0)),
                    "speed_knots": (
                        float(vessel.get("SPEED", 0)) if vessel.get("SPEED") else None
                    ),
                    "course_degrees": (
                        float(vessel.get("COURSE", 0)) if vessel.get("COURSE") else None
                    ),
                    "heading_degrees": (
                        int(vessel.get("HEADING", 0)) if vessel.get("HEADING") else None
                    ),
                    "navigation_status": vessel.get("STATUS"),
                    "destination": vessel.get("DESTINATION"),
                    "eta": vessel.get("ETA"),
                    "timestamp": vessel.get("TIMESTAMP") or vessel.get("LAST_POS"),
                }

                if position_data["imo"]:
                    normalized.append(position_data)

            except (ValueError, TypeError) as e:
                self.logger.warning(f"Failed to normalize vessel record: {e}")
                continue

        self.logger.info(f"Normalized {len(normalized)} vessel position records")
        return normalized

    def _get_headers(self) -> dict[str, str]:
        """Get API request headers."""
        return {
            "Content-Type": "application/json",
            "User-Agent": "FreightIQ/0.1.0",
        }

"""
VesselFinder AIS data provider.

Fetches real-time vessel positions and details.
"""

from datetime import datetime
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import log_provider_error, log_provider_request, log_provider_response
from app.providers.base import BaseDataProvider, ProviderResponse


class VesselFinderProvider(BaseDataProvider):
    """VesselFinder AIS API provider."""

    def __init__(self):
        """Initialize VesselFinder provider."""
        super().__init__(
            provider_id="vesselfinder",
            provider_name="VesselFinder",
            api_key=settings.vesselfinder_api_key,
            api_url=settings.vesselfinder_api_url,
        )

    async def health_check(self) -> bool:
        """Check VesselFinder API health."""
        if not self.is_configured():
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.api_url}/vessel",
                    headers=self._get_headers(),
                    params={"imo": "9999999"},  # Test with dummy IMO
                )
                # Any response means API is reachable
                return response.status_code in [200, 404]
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return False

    async def fetch_vessel_by_imo(self, imo: int) -> ProviderResponse:
        """
        Fetch vessel details and position by IMO.

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

        endpoint = f"/vessel/{imo}"
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
                elif response.status_code == 404:
                    return ProviderResponse(
                        success=False,
                        data=None,
                        status_code=404,
                        error_message="Vessel not found",
                    )
                else:
                    log_provider_error(
                        self.logger,
                        self.provider_name,
                        endpoint,
                        f"HTTP {response.status_code}",
                    )
                    return ProviderResponse(
                        success=False,
                        data=None,
                        status_code=response.status_code,
                        error_message=f"HTTP {response.status_code}",
                    )

        except httpx.TimeoutException:
            log_provider_error(self.logger, self.provider_name, endpoint, "Timeout")
            return ProviderResponse(
                success=False,
                data=None,
                error_message="Request timeout",
            )
        except Exception as e:
            log_provider_error(self.logger, self.provider_name, endpoint, str(e))
            return ProviderResponse(
                success=False,
                data=None,
                error_message=str(e),
            )

    async def fetch_vessels_near_port(
        self,
        latitude: float,
        longitude: float,
        radius_km: int = 50,
    ) -> ProviderResponse:
        """
        Fetch vessels near a location.

        Args:
            latitude: Port latitude
            longitude: Port longitude
            radius_km: Search radius in kilometers

        Returns:
            Provider response with vessels
        """
        if not self.is_configured():
            return ProviderResponse(
                success=False,
                data=None,
                error_message="API key not configured",
            )

        endpoint = "/vessels/nearby"
        log_provider_request(self.logger, self.provider_name, endpoint)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                start_time = datetime.now()

                response = await client.get(
                    f"{self.api_url}{endpoint}",
                    headers=self._get_headers(),
                    params={
                        "lat": latitude,
                        "lon": longitude,
                        "radius": radius_km,
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

    async def fetch(self, **kwargs) -> ProviderResponse:
        """
        Fetch vessel data.

        Kwargs:
            imo: Vessel IMO number (for single vessel)
            latitude, longitude, radius_km: For nearby vessels

        Returns:
            Provider response
        """
        if "imo" in kwargs:
            return await self.fetch_vessel_by_imo(kwargs["imo"])
        elif "latitude" in kwargs and "longitude" in kwargs:
            return await self.fetch_vessels_near_port(
                kwargs["latitude"],
                kwargs["longitude"],
                kwargs.get("radius_km", 50),
            )
        else:
            return ProviderResponse(
                success=False,
                data=None,
                error_message="Either 'imo' or 'latitude'/'longitude' required",
            )

    def normalize(self, raw_data: Any) -> list[dict[str, Any]]:
        """
        Normalize VesselFinder data to standard format.

        Args:
            raw_data: Raw API response

        Returns:
            Normalized vessel position records
        """
        if not raw_data:
            return []

        normalized = []

        # Handle single vessel vs multiple vessels
        vessels = raw_data if isinstance(raw_data, list) else [raw_data]

        for vessel in vessels:
            try:
                position_data = {
                    "imo": vessel.get("imo"),
                    "mmsi": vessel.get("mmsi"),
                    "vessel_name": vessel.get("name") or vessel.get("shipname"),
                    "latitude": float(vessel.get("lat") or vessel.get("latitude", 0)),
                    "longitude": float(vessel.get("lon") or vessel.get("longitude", 0)),
                    "speed_knots": (
                        float(vessel.get("speed", 0)) if vessel.get("speed") else None
                    ),
                    "course_degrees": (
                        float(vessel.get("course", 0)) if vessel.get("course") else None
                    ),
                    "heading_degrees": (
                        int(vessel.get("heading", 0)) if vessel.get("heading") else None
                    ),
                    "navigation_status": vessel.get("navstat") or vessel.get("status"),
                    "destination": vessel.get("destination"),
                    "eta": vessel.get("eta"),
                    "timestamp": vessel.get("timestamp") or vessel.get("lastPositionTime"),
                }

                # Only add if we have minimum required fields
                if position_data["imo"] and position_data["latitude"]:
                    normalized.append(position_data)

            except (ValueError, TypeError) as e:
                self.logger.warning(f"Failed to normalize vessel record: {e}")
                continue

        self.logger.info(f"Normalized {len(normalized)} vessel position records")
        return normalized

    def _get_headers(self) -> dict[str, str]:
        """Get API request headers."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "FreightIQ/0.1.0",
        }

"""
Baltic Exchange data provider.

Fetches freight indices (BDI, BCI, BPI, BSI, BHSI) and route assessments.
"""

from datetime import datetime
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging import log_provider_error, log_provider_request, log_provider_response
from app.providers.base import BaseDataProvider, ProviderResponse


class BalticProvider(BaseDataProvider):
    """Baltic Exchange API provider."""

    def __init__(self):
        """Initialize Baltic provider."""
        super().__init__(
            provider_id="baltic_exchange",
            provider_name="Baltic Exchange",
            api_key=settings.baltic_api_key,
            api_url=settings.baltic_api_url,
        )

    async def health_check(self) -> bool:
        """Check Baltic Exchange API health."""
        if not self.is_configured():
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.api_url}/health",
                    headers=self._get_headers(),
                )
                return response.status_code == 200
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            return False

    async def fetch_indices(self) -> ProviderResponse:
        """
        Fetch Baltic Exchange indices.

        Returns:
            Provider response with indices data
        """
        if not self.is_configured():
            return ProviderResponse(
                success=False,
                data=None,
                error_message="API key not configured",
            )

        log_provider_request(self.logger, self.provider_name, "/indices")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                start_time = datetime.now()

                response = await client.get(
                    f"{self.api_url}/indices",
                    headers=self._get_headers(),
                )

                latency_ms = (datetime.now() - start_time).total_seconds() * 1000

                log_provider_response(
                    self.logger,
                    self.provider_name,
                    "/indices",
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
                    log_provider_error(
                        self.logger,
                        self.provider_name,
                        "/indices",
                        f"HTTP {response.status_code}",
                    )
                    return ProviderResponse(
                        success=False,
                        data=None,
                        status_code=response.status_code,
                        error_message=f"HTTP {response.status_code}",
                    )

        except httpx.TimeoutException:
            log_provider_error(self.logger, self.provider_name, "/indices", "Timeout")
            return ProviderResponse(
                success=False,
                data=None,
                error_message="Request timeout",
            )
        except Exception as e:
            log_provider_error(self.logger, self.provider_name, "/indices", str(e))
            return ProviderResponse(
                success=False,
                data=None,
                error_message=str(e),
            )

    async def fetch(self, **kwargs) -> ProviderResponse:
        """
        Fetch Baltic data (default: indices).

        Returns:
            Provider response
        """
        return await self.fetch_indices()

    def normalize(self, raw_data: Any) -> list[dict[str, Any]]:
        """
        Normalize Baltic Exchange data.

        Args:
            raw_data: Raw API response

        Returns:
            Normalized records
        """
        if not raw_data:
            return []

        normalized = []

        # Handle different response formats
        if isinstance(raw_data, dict):
            indices = raw_data.get("indices", [])
        elif isinstance(raw_data, list):
            indices = raw_data
        else:
            self.logger.warning(f"Unexpected data format: {type(raw_data)}")
            return []

        for index in indices:
            try:
                normalized.append({
                    "date": index.get("date"),
                    "index_code": index.get("code") or index.get("index_code"),
                    "index_name": index.get("name") or index.get("index_name"),
                    "value": float(index.get("value", 0)),
                    "change": float(index.get("change", 0)) if index.get("change") else None,
                    "change_percent": (
                        float(index.get("change_percent", 0))
                        if index.get("change_percent")
                        else None
                    ),
                })
            except (ValueError, TypeError) as e:
                self.logger.warning(f"Failed to normalize record: {e}")
                continue

        self.logger.info(f"Normalized {len(normalized)} index records")
        return normalized

    def _get_headers(self) -> dict[str, str]:
        """Get API request headers."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "FreightIQ/0.1.0",
        }

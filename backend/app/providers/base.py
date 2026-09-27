"""
Base data provider interface.

All external data providers must implement this interface.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class ProviderResponse:
    """Standard provider response."""

    success: bool
    data: Any
    status_code: int | None = None
    error_message: str | None = None
    retrieved_at: datetime | None = None
    rate_limit_remaining: int | None = None


class BaseDataProvider(ABC):
    """Base class for all data providers."""

    def __init__(
        self,
        provider_id: str,
        provider_name: str,
        api_key: str | None = None,
        api_url: str | None = None,
    ):
        """
        Initialize provider.

        Args:
            provider_id: Unique provider identifier
            provider_name: Human-readable provider name
            api_key: API key for authentication
            api_url: Base API URL
        """
        self.provider_id = provider_id
        self.provider_name = provider_name
        self.api_key = api_key
        self.api_url = api_url
        self.logger = get_logger(f"providers.{provider_id}")

    @abstractmethod
    async def health_check(self) -> bool:
        """
        Check if provider is accessible.

        Returns:
            True if provider is healthy
        """
        pass

    @abstractmethod
    async def fetch(self, **kwargs) -> ProviderResponse:
        """
        Fetch data from provider.

        Returns:
            Provider response with data
        """
        pass

    @abstractmethod
    def normalize(self, raw_data: Any) -> list[dict[str, Any]]:
        """
        Normalize provider-specific data to standard format.

        Args:
            raw_data: Raw data from provider

        Returns:
            List of normalized records
        """
        pass

    def is_configured(self) -> bool:
        """
        Check if provider is properly configured.

        Returns:
            True if provider has required credentials
        """
        if not self.api_key:
            self.logger.warning(f"{self.provider_name} not configured: missing API key")
            return False
        return True

    def get_status(self) -> str:
        """
        Get provider configuration status.

        Returns:
            Status string
        """
        if not self.is_configured():
            return "CONFIGURATION_REQUIRED"
        return "CONFIGURED"

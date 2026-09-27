"""
Redis Connection Management for FreightIQ

Manages Redis connections for caching and background tasks.
"""

import json
from typing import Any, Optional

import redis.asyncio as aioredis
from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


# ============================================================================
# REDIS CLIENT
# ============================================================================
class RedisClient:
    """Redis client wrapper with connection management."""

    def __init__(self) -> None:
        """Initialize Redis client."""
        self.client: Optional[Redis] = None

    async def connect(self) -> None:
        """Establish Redis connection."""
        if self.client is None:
            logger.info("Connecting to Redis", extra={"url": str(settings.redis_url)})

            self.client = await aioredis.from_url(
                str(settings.redis_url),
                encoding="utf-8",
                decode_responses=True,
                max_connections=50,
            )

            logger.info("Redis connection established")

    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self.client:
            await self.client.close()
            self.client = None
            logger.info("Redis connection closed")

    async def ping(self) -> bool:
        """
        Check Redis connection.

        Returns:
            True if connection is alive
        """
        if self.client is None:
            return False

        try:
            await self.client.ping()
            return True
        except RedisError as e:
            logger.error(f"Redis ping failed: {e}")
            return False

    async def get(self, key: str) -> Optional[str]:
        """
        Get value by key.

        Args:
            key: Cache key

        Returns:
            Cached value or None
        """
        if self.client is None:
            await self.connect()

        try:
            value = await self.client.get(key)
            return value
        except RedisError as e:
            logger.error(f"Redis GET failed for key {key}: {e}")
            return None

    async def set(
        self,
        key: str,
        value: str,
        ttl: Optional[int] = None,
    ) -> bool:
        """
        Set key-value pair with optional TTL.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds

        Returns:
            True if successful
        """
        if self.client is None:
            await self.connect()

        try:
            await self.client.set(key, value, ex=ttl)
            return True
        except RedisError as e:
            logger.error(f"Redis SET failed for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete key.

        Args:
            key: Cache key

        Returns:
            True if successful
        """
        if self.client is None:
            await self.connect()

        try:
            await self.client.delete(key)
            return True
        except RedisError as e:
            logger.error(f"Redis DELETE failed for key {key}: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """
        Check if key exists.

        Args:
            key: Cache key

        Returns:
            True if key exists
        """
        if self.client is None:
            await self.connect()

        try:
            result = await self.client.exists(key)
            return bool(result)
        except RedisError as e:
            logger.error(f"Redis EXISTS failed for key {key}: {e}")
            return False

    async def get_json(self, key: str) -> Optional[Any]:
        """
        Get JSON value by key.

        Args:
            key: Cache key

        Returns:
            Deserialized JSON value or None
        """
        value = await self.get(key)
        if value is None:
            return None

        try:
            return json.loads(value)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode JSON for key {key}: {e}")
            return None

    async def set_json(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
    ) -> bool:
        """
        Set JSON value with optional TTL.

        Args:
            key: Cache key
            value: Value to serialize and cache
            ttl: Time to live in seconds

        Returns:
            True if successful
        """
        try:
            json_value = json.dumps(value)
            return await self.set(key, json_value, ttl)
        except (TypeError, ValueError) as e:
            logger.error(f"Failed to serialize JSON for key {key}: {e}")
            return False

    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """
        Increment counter.

        Args:
            key: Cache key
            amount: Increment amount

        Returns:
            New value or None
        """
        if self.client is None:
            await self.connect()

        try:
            result = await self.client.incrby(key, amount)
            return result
        except RedisError as e:
            logger.error(f"Redis INCRBY failed for key {key}: {e}")
            return None


# ============================================================================
# GLOBAL REDIS CLIENT
# ============================================================================
redis_client = RedisClient()


async def get_redis() -> Redis:
    """
    Get Redis client for dependency injection.

    Returns:
        Redis client instance
    """
    if redis_client.client is None:
        await redis_client.connect()

    return redis_client.client


async def check_redis_health() -> dict[str, Any]:
    """
    Check Redis connection health.

    Returns:
        Health check results
    """
    try:
        is_alive = await redis_client.ping()

        if is_alive:
            return {
                "status": "healthy",
                "cache": "redis",
            }
        else:
            return {
                "status": "unhealthy",
                "error": "Connection not established",
            }
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
        }


# ============================================================================
# CACHE KEY HELPERS
# ============================================================================
def make_cache_key(*parts: str) -> str:
    """
    Create cache key from parts.

    Args:
        *parts: Key components

    Returns:
        Cache key string
    """
    return ":".join(str(part) for part in parts)


def vessel_position_key(imo: int) -> str:
    """Create cache key for vessel position."""
    return make_cache_key("vessel", "position", imo)


def weather_key(lat: float, lon: float) -> str:
    """Create cache key for weather data."""
    return make_cache_key("weather", f"{lat:.2f}", f"{lon:.2f}")


def port_congestion_key(port_code: str) -> str:
    """Create cache key for port congestion."""
    return make_cache_key("port", "congestion", port_code)


def market_snapshot_key() -> str:
    """Create cache key for market snapshot."""
    return make_cache_key("market", "snapshot")


def forecast_key(route_id: str, horizon_days: int) -> str:
    """Create cache key for forecast."""
    return make_cache_key("forecast", route_id, horizon_days)

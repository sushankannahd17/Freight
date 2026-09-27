"""
Security Utilities for FreightIQ

Provides authentication, authorization, and security utilities.
"""

import secrets
from datetime import datetime, timedelta
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


# ============================================================================
# PASSWORD HASHING
# ============================================================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a password.

    Args:
        password: Plain text password

    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password

    Returns:
        True if password matches
    """
    return pwd_context.verify(plain_password, hashed_password)


# ============================================================================
# JWT TOKENS
# ============================================================================
def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[dict[str, Any]] = None,
) -> str:
    """
    Create JWT access token.

    Args:
        subject: Token subject (usually user ID)
        expires_delta: Token expiration time
        additional_claims: Additional claims to include

    Returns:
        Encoded JWT token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expiration_minutes)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.utcnow(),
    }

    if additional_claims:
        to_encode.update(additional_claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )

    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """
    Decode and verify JWT token.

    Args:
        token: Encoded JWT token

    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError as e:
        logger.warning(f"JWT decode failed: {e}")
        return None


# ============================================================================
# API KEYS
# ============================================================================
def generate_api_key() -> str:
    """
    Generate a secure random API key.

    Returns:
        API key string
    """
    return secrets.token_urlsafe(32)


def verify_api_key(api_key: str, valid_keys: list[str]) -> bool:
    """
    Verify API key against list of valid keys.

    Args:
        api_key: API key to verify
        valid_keys: List of valid API keys

    Returns:
        True if key is valid
    """
    return api_key in valid_keys


# ============================================================================
# RATE LIMITING
# ============================================================================
class RateLimiter:
    """Simple in-memory rate limiter."""

    def __init__(self, max_requests: int, window_seconds: int):
        """
        Initialize rate limiter.

        Args:
            max_requests: Maximum requests per window
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict[str, list[datetime]] = {}

    def is_allowed(self, key: str) -> bool:
        """
        Check if request is allowed for key.

        Args:
            key: Rate limit key (e.g., IP address or user ID)

        Returns:
            True if request is allowed
        """
        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=self.window_seconds)

        # Get or create request history for key
        if key not in self.requests:
            self.requests[key] = []

        # Remove old requests outside window
        self.requests[key] = [ts for ts in self.requests[key] if ts > cutoff]

        # Check if under limit
        if len(self.requests[key]) < self.max_requests:
            self.requests[key].append(now)
            return True

        return False

    def get_remaining(self, key: str) -> int:
        """
        Get remaining requests for key.

        Args:
            key: Rate limit key

        Returns:
            Number of remaining requests
        """
        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=self.window_seconds)

        if key not in self.requests:
            return self.max_requests

        # Count requests in current window
        recent_requests = [ts for ts in self.requests[key] if ts > cutoff]
        return max(0, self.max_requests - len(recent_requests))


# Global rate limiter instance
rate_limiter = RateLimiter(
    max_requests=settings.rate_limit_per_minute,
    window_seconds=60,
)


# ============================================================================
# INPUT VALIDATION
# ============================================================================
def sanitize_string(value: str, max_length: int = 1000) -> str:
    """
    Sanitize string input.

    Args:
        value: Input string
        max_length: Maximum allowed length

    Returns:
        Sanitized string
    """
    # Trim to max length
    value = value[:max_length]

    # Remove null bytes
    value = value.replace("\x00", "")

    # Strip whitespace
    value = value.strip()

    return value


def validate_imo_number(imo: int) -> bool:
    """
    Validate IMO ship identification number.

    Args:
        imo: IMO number

    Returns:
        True if valid IMO number
    """
    # IMO numbers are 7 digits
    if not (1000000 <= imo <= 9999999):
        return False

    # Convert to string and calculate checksum
    imo_str = str(imo)
    digits = [int(d) for d in imo_str]

    # Last digit is checksum
    checksum = digits[-1]

    # Calculate expected checksum
    total = sum(digit * (7 - i) for i, digit in enumerate(digits[:6]))
    expected_checksum = total % 10

    return checksum == expected_checksum


def validate_coordinates(lat: float, lon: float) -> bool:
    """
    Validate geographic coordinates.

    Args:
        lat: Latitude
        lon: Longitude

    Returns:
        True if valid coordinates
    """
    return -90 <= lat <= 90 and -180 <= lon <= 180

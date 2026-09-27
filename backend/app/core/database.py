"""
Database Connection Management for FreightIQ

Manages PostgreSQL/PostGIS connections using SQLAlchemy 2.x with async support.
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from sqlalchemy import create_engine, event, pool
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


# ============================================================================
# BASE MODEL
# ============================================================================
class Base(DeclarativeBase):
    """Base class for all database models."""

    pass


# ============================================================================
# DATABASE ENGINE
# ============================================================================
def create_db_engine() -> AsyncEngine:
    """
    Create async database engine.

    Returns:
        Configured async SQLAlchemy engine
    """
    # Convert PostgresDsn to string and replace postgresql with postgresql+psycopg
    db_url = str(settings.database_url)
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql+psycopg://"):
        pass  # Already correct
    else:
        # Ensure async driver
        if "+psycopg" not in db_url:
            db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

    logger.info(
        "Creating database engine",
        extra={
            "pool_size": settings.database_pool_size,
            "max_overflow": settings.database_max_overflow,
        },
    )

    engine = create_async_engine(
        db_url,
        echo=settings.database_echo,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_pre_ping=True,  # Enable connection health checks
        pool_recycle=3600,  # Recycle connections after 1 hour
    )

    return engine


# Global engine instance
engine: AsyncEngine = create_db_engine()

# Session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# ============================================================================
# SESSION MANAGEMENT
# ============================================================================
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Get database session for dependency injection.

    Yields:
        AsyncSession instance
    """
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Get database session context manager.

    Yields:
        AsyncSession instance
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================
async def init_db() -> None:
    """
    Initialize database.

    Creates all tables defined in models.
    Note: Use Alembic migrations in production.
    """
    logger.info("Initializing database")

    # Import all models to register them
    from app import models  # noqa: F401

    async with engine.begin() as conn:
        # Enable PostGIS extension
        await conn.execute("CREATE EXTENSION IF NOT EXISTS postgis")
        logger.info("PostGIS extension enabled")

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created")


async def drop_db() -> None:
    """
    Drop all database tables.

    WARNING: This will delete all data!
    Only use in development/testing.
    """
    if settings.is_production:
        raise RuntimeError("Cannot drop database in production environment")

    logger.warning("Dropping all database tables")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    logger.warning("All database tables dropped")


# ============================================================================
# DATABASE HEALTH CHECK
# ============================================================================
async def check_db_health() -> dict[str, Any]:
    """
    Check database connection health.

    Returns:
        Health check results
    """
    try:
        async with async_session_factory() as session:
            # Simple query to test connection
            result = await session.execute("SELECT 1")
            result.scalar()

            # Get PostGIS version
            postgis_result = await session.execute("SELECT PostGIS_Version()")
            postgis_version = postgis_result.scalar()

            return {
                "status": "healthy",
                "database": "postgresql",
                "postgis_version": postgis_version,
            }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
        }


# ============================================================================
# SYNCHRONOUS ENGINE (for Alembic migrations)
# ============================================================================
def create_sync_engine():
    """
    Create synchronous database engine for Alembic migrations.

    Returns:
        Synchronous SQLAlchemy engine
    """
    # Convert to sync URL
    db_url = str(settings.database_url)
    if db_url.startswith("postgresql+psycopg://"):
        db_url = db_url.replace("postgresql+psycopg://", "postgresql://", 1)

    engine = create_engine(
        db_url,
        echo=settings.database_echo,
        pool_size=settings.database_pool_size,
        max_overflow=settings.database_max_overflow,
        pool_pre_ping=True,
    )

    return engine


sync_engine = create_sync_engine()

sync_session_factory = sessionmaker(
    sync_engine,
    class_=Session,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


def get_sync_session() -> Session:
    """
    Get synchronous database session.

    Returns:
        Session instance
    """
    return sync_session_factory()

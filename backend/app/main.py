"""
FreightIQ Backend API Application

Production-grade FastAPI application for intelligent freight forecasting
and vessel chartering optimization.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import check_db_health, engine
from app.core.logging import get_logger, set_request_id, setup_logging
from app.core.redis import check_redis_health, redis_client

# Setup logging
setup_logging()
logger = get_logger(__name__)


# ============================================================================
# LIFESPAN MANAGEMENT
# ============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info(
        "Starting FreightIQ Backend",
        extra={
            "version": settings.app_version,
            "environment": settings.environment,
        },
    )

    # Connect to Redis
    await redis_client.connect()

    yield

    # Shutdown
    logger.info("Shutting down FreightIQ Backend")

    # Disconnect Redis
    await redis_client.disconnect()

    # Dispose database engine
    await engine.dispose()


# ============================================================================
# CREATE APPLICATION
# ============================================================================
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Production-grade intelligent freight forecasting and vessel chartering platform",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    openapi_url="/openapi.json" if settings.is_development else None,
    lifespan=lifespan,
)


# ============================================================================
# MIDDLEWARE
# ============================================================================
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add request ID to each request."""
    request_id = request.headers.get("X-Request-ID")
    set_request_id(request_id)

    response = await call_next(request)
    response.headers["X-Request-ID"] = set_request_id()

    return response


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(
        f"Unhandled exception: {exc}",
        extra={
            "path": request.url.path,
            "method": request.method,
        },
        exc_info=True,
    )

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.is_development else "An error occurred",
        },
    )


# ============================================================================
# HEALTH CHECK ENDPOINT
# ============================================================================
@app.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns application health status and component health.
    """
    db_health = await check_db_health()
    redis_health = await check_redis_health()

    overall_status = "healthy"
    if db_health["status"] != "healthy" or redis_health["status"] != "healthy":
        overall_status = "degraded"

    return {
        "status": overall_status,
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "components": {
            "database": db_health,
            "redis": redis_health,
        },
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "description": "Intelligent freight forecasting and vessel chartering platform",
        "docs_url": "/docs" if settings.is_development else None,
        "health_url": "/health",
    }


# ============================================================================
# MOUNT API ROUTES
# ============================================================================
from app.api.v1 import data, market, ports, vessels, voyage

# Mount all v1 API routers
app.include_router(data.router, prefix=settings.api_prefix, tags=["data"])
app.include_router(market.router, prefix=settings.api_prefix, tags=["market"])
app.include_router(vessels.router, prefix=settings.api_prefix, tags=["vessels"])
app.include_router(ports.router, prefix=settings.api_prefix, tags=["ports"])
app.include_router(voyage.router, prefix=settings.api_prefix, tags=["voyage"])

logger.info(f"Mounted API routes with prefix: {settings.api_prefix}")


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.is_development,
        log_level=settings.log_level.lower(),
    )

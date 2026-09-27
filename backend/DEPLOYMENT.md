# FreightIQ Backend - Deployment Guide

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services
docker compose up -d

# Check service status
docker compose ps

# View logs
docker compose logs -f api

# Run migrations
docker compose exec api alembic upgrade head
```

Services will be available at:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MLflow: http://localhost:5000
- PgAdmin: http://localhost:5050 (optional, use `--profile tools`)

### Option 2: Local Development

#### Prerequisites
- Python 3.12+
- PostgreSQL 15+ with PostGIS
- Redis 7+

#### Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .

# Copy and configure environment
cp .env.example .env
# Edit .env with your database and Redis URLs

# Run migrations
alembic upgrade head

# Start the API
python -m app.main
```

## 📦 Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── core/                   # Core utilities
│   │   ├── config.py          # Configuration management
│   │   ├── database.py        # Database connections
│   │   ├── redis.py           # Redis client
│   │   ├── logging.py         # Structured logging
│   │   └── security.py        # Authentication & security
│   ├── models/                 # Database models
│   │   ├── base.py            # Base mixins
│   │   ├── models.py          # All models (consolidated)
│   │   └── [module].py        # Module-specific imports
│   ├── schemas/                # Pydantic schemas (TODO)
│   ├── repositories/           # Data access layer (TODO)
│   ├── services/               # Business logic (TODO)
│   ├── providers/              # Data provider adapters (TODO)
│   ├── api/v1/                 # API endpoints (TODO)
│   ├── ingestion/              # Data ingestion (TODO)
│   ├── features/               # Feature engineering (TODO)
│   ├── forecasting/            # ML models (TODO)
│   └── optimization/           # Charter optimization (TODO)
├── migrations/                 # Alembic migrations
├── tests/                      # Test suite (TODO)
├── docker/                     # Docker configs
├── docker-compose.yml          # Docker Compose config
└── pyproject.toml              # Python project config
```

## 🗄️ Database Schema

### Implemented Tables

#### Market Data
- `freight_rates` - Freight rates by route and vessel class
- `freight_indices` - Baltic Exchange indices (BDI, BCI, BPI, BSI, BHSI)

#### Vessels
- `vessels` - Vessel master data (IMO, MMSI, dimensions)
- `vessel_positions` - Real-time AIS positions

#### Ports
- `ports` - Port master data
- `port_berths` - Berth-level constraints (draft, LOA, beam limits)
- `port_congestion` - Port congestion metrics

#### Weather & Marine
- `weather_observations` - Weather observations
- `marine_conditions` - Wave, swell, current, SST data

#### Trade
- `trade_flows` - International trade flows (TradeStat, UN Comtrade)
- `coal_imports` - India coal import statistics

#### Economics
- `fuel_prices` - Bunker fuel prices (VLSFO, HSFO, MGO)
- `fx_rates` - Foreign exchange rates

#### Routes
- `sea_routes` - Predefined maritime routes with distance and geometry

#### ML
- `model_registry` - ML model registry
- `model_versions` - Model versions with hyperparameters and metrics
- `predictions` - Model predictions with SHAP values

#### Optimization
- `voyage_calculations` - Voyage cost breakdowns
- `recommendations` - Charter recommendations with reasoning

#### Data Governance
- `data_sources` - Data source registry
- `data_ingestion_runs` - Ingestion execution records
- `data_quality_checks` - Data quality validation results

### Data Provenance

All data tables include mandatory provenance fields:
- `source_id` - Source system identifier
- `source_name` - Human-readable source name
- `retrieved_at` - When data was fetched
- `published_at` - Official publication time
- `valid_from` / `valid_to` - Validity period
- `data_status` - Classification (OBSERVED, DERIVED, MODELLED, etc.)
- `data_quality` - Quality assessment

## 🔧 Configuration

### Required Environment Variables

```bash
# Database (Required)
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/freightiq

# Redis (Required)
REDIS_URL=redis://localhost:6379/0

# Security (Required)
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here

# API Provider Keys (Optional - providers disabled without valid keys)
BALTIC_API_KEY=
VESSELFINDER_API_KEY=
MARINETRAFFIC_API_KEY=
IMD_API_KEY=
COPERNICUS_USERNAME=
COPERNICUS_PASSWORD=
```

### Provider Configuration

**IMPORTANT:** Providers without valid API keys will:
- Return `status: CONFIGURATION_REQUIRED`
- NOT generate synthetic replacement data
- NOT fabricate API responses

This ensures data integrity and prevents training on fake data.

## 🔍 Health Checks

```bash
# API health
curl http://localhost:8000/health

# Example response:
{
  "status": "healthy",
  "service": "FreightIQ",
  "version": "0.1.0",
  "environment": "development",
  "components": {
    "database": {
      "status": "healthy",
      "database": "postgresql",
      "postgis_version": "3.4"
    },
    "redis": {
      "status": "healthy",
      "cache": "redis"
    }
  }
}
```

## 🗃️ Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Add new table"

# Upgrade to latest
alembic upgrade head

# Downgrade one version
alembic downgrade -1

# View migration history
alembic history

# View current version
alembic current
```

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/unit/test_models.py

# Run integration tests only
pytest tests/integration/
```

## 📊 Monitoring

### Logs

All logs are JSON-structured:

```json
{
  "timestamp": "2026-09-25T10:30:00Z",
  "level": "INFO",
  "logger": "app.providers.baltic",
  "message": "API provider response",
  "event_type": "provider_response",
  "provider": "baltic",
  "endpoint": "/indices",
  "status_code": 200,
  "latency_ms": 245.3,
  "request_id": "abc-123-def"
}
```

### Metrics

Prometheus metrics available at `/metrics`:

- `freightiq_api_requests_total`
- `freightiq_provider_requests_total`
- `freightiq_provider_errors_total`
- `freightiq_ingestion_records_total`
- `freightiq_forecasts_total`

## 🔐 Security

### Authentication

The API uses JWT tokens for authentication:

```bash
# Generate API key
python -c "from app.core.security import generate_api_key; print(generate_api_key())"
```

### Rate Limiting

- Default: 60 requests per minute per IP
- Configurable via `RATE_LIMIT_PER_MINUTE`

### Input Validation

- IMO numbers validated with checksum
- Coordinates validated (-90/90, -180/180)
- All inputs sanitized against injection

## 🚨 Troubleshooting

### Database Connection Issues

```bash
# Test database connection
docker compose exec postgres psql -U freightiq_user -d freightiq -c "SELECT PostGIS_Version();"
```

### Redis Connection Issues

```bash
# Test Redis connection
docker compose exec redis redis-cli ping
```

### Application Logs

```bash
# View API logs
docker compose logs -f api

# View Celery worker logs
docker compose logs -f celery_worker
```

## 📝 Next Steps

1. ✅ Phase 1: Project structure and database schema
2. ✅ Phase 2: Core utilities and configuration
3. ⏳ Phase 3: Data ingestion adapters
4. ⏳ Phase 4-14: Remaining implementation phases

See main README.md for full implementation roadmap.

## 📞 Support

For issues or questions:
- Check logs: `docker compose logs -f`
- Health check: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`

# FreightIQ Backend

Production-grade Python backend for intelligent freight forecasting and vessel chartering optimization.

## 🏗️ Architecture

```
FastAPI Application
       ↓
┌──────────────────────────────────────┐
│         API Service Layer            │
│  (Market, Vessels, Ports, Weather,   │
│   Trade, Forecasts, Optimization)    │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│       Service & Business Logic       │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│      Data Providers & Ingestion      │
│  (Baltic, AIS, Weather, Trade, etc)  │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│  Validation & Normalization Layer    │
└──────────────────────────────────────┘
       ↓
┌──────────────────────────────────────┐
│     PostgreSQL/PostGIS + Redis       │
└──────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- PostgreSQL 15+ with PostGIS extension
- Redis 7+
- Docker & Docker Compose (optional but recommended)

### Installation

1. **Install dependencies:**

```bash
cd backend
pip install -e .
```

2. **Configure environment:**

```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Start PostgreSQL and Redis** (using Docker):

```bash
docker compose up -d postgres redis
```

4. **Run database migrations:**

```bash
alembic upgrade head
```

5. **Start the API server:**

```bash
python -m app.main
```

Or using uvicorn:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

## 📦 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI application
│   │
│   ├── api/
│   │   └── v1/                      # API endpoints
│   │       ├── market.py
│   │       ├── vessels.py
│   │       ├── ports.py
│   │       ├── weather.py
│   │       ├── marine.py
│   │       ├── trade.py
│   │       ├── forecasts.py
│   │       └── optimization.py
│   │
│   ├── core/                        # Core utilities
│   │   ├── config.py               # Configuration management
│   │   ├── database.py             # Database connections
│   │   ├── redis.py                # Redis client
│   │   ├── logging.py              # Structured logging
│   │   └── security.py             # Authentication & security
│   │
│   ├── models/                      # SQLAlchemy models
│   ├── schemas/                     # Pydantic schemas
│   ├── repositories/                # Data access layer
│   ├── services/                    # Business logic
│   │
│   ├── providers/                   # Data provider adapters
│   │   ├── baltic.py
│   │   ├── vesselfinder.py
│   │   ├── marinetraffic.py
│   │   ├── imd.py
│   │   ├── open_meteo.py
│   │   ├── copernicus.py
│   │   ├── tradestat.py
│   │   ├── comtrade.py
│   │   └── ...
│   │
│   ├── ingestion/                   # Data ingestion pipelines
│   ├── normalization/               # Data normalization
│   ├── features/                    # Feature engineering
│   ├── forecasting/                 # ML forecasting models
│   ├── optimization/                # Charter optimization
│   └── monitoring/                  # Model monitoring & drift
│
├── migrations/                      # Alembic migrations
├── tests/                          # Test suite
│   ├── unit/
│   └── integration/
├── scripts/                        # Utility scripts
├── docker/                         # Docker configs
├── data/                           # Data storage
│   ├── raw/                       # Raw API responses
│   ├── processed/                 # Processed data
│   └── manifests/                 # Data manifests
├── notebooks/                      # Jupyter notebooks
│
├── .env.example                    # Environment template
├── docker-compose.yml              # Docker Compose config
├── pyproject.toml                  # Python project config
└── README.md                       # This file
```

## 🔧 Configuration

All configuration is managed through environment variables. See `.env.example` for all available options.

### Required Configuration

```bash
# Database
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/freightiq

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
```

### Data Provider API Keys

Configure API keys for external data sources:

```bash
BALTIC_API_KEY=your-baltic-api-key
VESSELFINDER_API_KEY=your-vesselfinder-key
MARINETRAFFIC_API_KEY=your-marinetraffic-key
IMD_API_KEY=your-imd-key
COPERNICUS_USERNAME=your-copernicus-username
COPERNICUS_PASSWORD=your-copernicus-password
```

**Note:** Providers without valid credentials will return `CONFIGURATION_REQUIRED` status and not generate synthetic data.

## 🗄️ Database Schema

The system uses a normalized database design with separate tables for:

- **Market Data:** freight_rates, freight_indices, time_charter_rates
- **Vessels:** vessels, vessel_positions, vessel_availability
- **Ports:** ports, port_terminals, port_berths, port_congestion
- **Weather/Marine:** weather_observations, marine_conditions, wave_conditions
- **Trade:** trade_flows, coal_imports, steel_production
- **Economics:** fuel_prices, fx_rates, port_charges
- **Routes:** sea_routes, route_conditions
- **ML:** features, training_datasets, model_registry, predictions
- **Data Governance:** data_sources, data_ingestion_runs, data_quality_checks

## 🔄 Data Ingestion

### Historical Data

Load historical data from Excel files:

```bash
python -m app.ingestion.historical
```

### Live Data Ingestion

Start background workers for live data ingestion:

```bash
celery -A app.ingestion.celery worker --loglevel=info
celery -A app.ingestion.celery beat --loglevel=info
```

## 🤖 ML Models

### Training Models

```bash
python -m app.forecasting.train --route aus-paradip --model xgboost
```

### Model Registry

All models are tracked in MLflow:

```bash
mlflow ui --backend-store-uri sqlite:///mlflow.db
```

Access MLflow UI at `http://localhost:5000`

## 🧪 Testing

Run test suite:

```bash
# All tests
pytest

# Unit tests only
pytest tests/unit/

# Integration tests
pytest tests/integration/

# With coverage
pytest --cov=app --cov-report=html
```

## 🐳 Docker Deployment

Build and run with Docker Compose:

```bash
docker compose up --build
```

This starts:
- PostgreSQL with PostGIS
- Redis
- FastAPI application
- Celery workers
- MLflow tracking server

## 📊 API Documentation

Interactive API documentation is available at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Main Endpoints

- `GET /health` - Health check
- `GET /api/v1/market/indices` - Market indices (BDI, BCI, etc.)
- `GET /api/v1/vessels/available` - Available vessels
- `GET /api/v1/ports` - Port information
- `GET /api/v1/weather/forecast` - Weather forecasts
- `GET /api/v1/forecast/freight` - Freight rate forecasts
- `POST /api/v1/optimize/charter` - Charter optimization

## 📏 Data Integrity Rules

**CRITICAL**: The system enforces strict data integrity:

1. **No Synthetic Data** in production training datasets
2. **Data Provenance** tracked for every observation
3. **No Data Leakage** in time-series forecasting
4. **No Silent Imputation** of missing values
5. **Explicit Data Status** (OBSERVED, DERIVED, MODELLED, ESTIMATED)

Every data record includes:
- `source_id` - Source system identifier
- `retrieved_at` - When data was fetched
- `published_at` - Official publication time
- `data_status` - Data classification
- `data_quality` - Quality score

## 🔍 Monitoring

### Prometheus Metrics

Metrics endpoint: `http://localhost:8000/metrics`

Key metrics:
- `freightiq_api_requests_total` - Total API requests
- `freightiq_provider_requests_total` - External API calls
- `freightiq_provider_errors_total` - Provider errors
- `freightiq_ingestion_records_total` - Ingested records
- `freightiq_forecasts_total` - Forecasts generated

### Logging

All logs are JSON-structured and include:
- Request IDs for tracing
- Provider names and latency
- Data quality metrics
- Model performance

## 🛠️ Development

### Code Quality

```bash
# Format code
black app/

# Lint code
ruff check app/

# Type checking
mypy app/
```

### Pre-commit Hooks

```bash
pip install pre-commit
pre-commit install
```

## 📝 License

Proprietary - Smart India Hackathon 2026 Project

## 👥 Contributors

Ministry of Steel, Government of India - Smart India Hackathon 2026

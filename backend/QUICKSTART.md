# FreightIQ Backend - Quick Start Guide

**5-Minute Setup** | **Ready to Run** | **Production Architecture**

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start Services (1 min)
```bash
cd backend
docker compose up -d postgres redis
docker compose ps  # Verify running
```

### Step 2: Install (1 min)
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .
```

### Step 3: Configure (1 min)
```bash
cp .env.example .env

# Generate keys and update .env
python -c "import secrets; print(secrets.token_urlsafe(32))"  # SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"  # JWT_SECRET_KEY

# Edit .env:
# DATABASE_URL=postgresql+psycopg://freightiq_user:changeme_secure_password@localhost:5432/freightiq
```

### Step 4: Migrate (30 sec)
```bash
alembic upgrade head
```

### Step 5: Run (30 sec)
```bash
python -m app.main
# API running at http://localhost:8000
```

### Step 6: Test (30 sec)
```bash
# Health check
curl http://localhost:8000/health

# API docs
open http://localhost:8000/docs
```

---

## 📊 Load Historical Data

```bash
# Option 1: Direct Python
python -m app.ingestion.historical

# Option 2: Async
python -c "import asyncio; from app.ingestion.historical import main; asyncio.run(main())"

# Check data loaded
curl http://localhost:8000/api/v1/market/freight-rates?limit=10
```

---

## 🧪 Test API Endpoints

### Market Data
```bash
# Get freight rates
curl "http://localhost:8000/api/v1/market/freight-rates?limit=5"

# Get Baltic indices
curl "http://localhost:8000/api/v1/market/indices"

# Market snapshot
curl "http://localhost:8000/api/v1/market/snapshot"
```

### Voyage Calculations
```bash
# Calculate voyage cost
curl -X POST http://localhost:8000/api/v1/voyage/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "route_id": "aus-paradip",
    "vessel_imo": 9876543,
    "cargo_mt": 75000,
    "origin_port": "AUBNE",
    "destination_port": "INPBD",
    "include_weather": true,
    "include_congestion": true
  }'

# Check vessel compatibility
curl -X POST http://localhost:8000/api/v1/voyage/compatibility \
  -H "Content-Type: application/json" \
  -d '{
    "vessel_imo": 9876543,
    "port_code": "INPBD"
  }'
```

### Data Sources
```bash
# List data sources
curl http://localhost:8000/api/v1/data/sources

# Get source status
curl http://localhost:8000/api/v1/data/status
```

---

## 🔍 Verify Database

```bash
# Connect to database
docker compose exec postgres psql -U freightiq_user -d freightiq

# List tables
\dt

# Check data
SELECT COUNT(*) FROM freight_rates;
SELECT COUNT(*) FROM data_sources;

# Check PostGIS
SELECT PostGIS_Version();
```

---

## 📚 Interactive API Docs

Open in browser:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

Try the endpoints interactively!

---

## 🐳 Full Docker Stack (Optional)

```bash
# Start everything (PostgreSQL, Redis, API, MLflow, Celery)
docker compose up -d

# Check all services
docker compose ps

# View logs
docker compose logs -f api
```

---

## 🎯 What to Test

### 1. Health Check ✅
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy",...}
```

### 2. Data Ingestion ✅
```bash
python -m app.ingestion.historical
# Should load data from server/Dataset/*.xlsx
```

### 3. Query Data ✅
```bash
curl http://localhost:8000/api/v1/market/freight-rates
# Should return freight rate records
```

### 4. Voyage Calculator ✅
```bash
# Use /docs to test POST /api/v1/voyage/calculate
# Returns: total cost, duration, cost breakdown
```

### 5. Compatibility Check ✅
```bash
# Use /docs to test POST /api/v1/voyage/compatibility
# Returns: compatible=true/false with reasons
```

---

## 🔧 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Restart if needed
docker compose restart postgres

# Check connection
docker compose exec postgres pg_isready
```

### Redis Connection Failed
```bash
# Check Redis
docker compose ps redis

# Test connection
docker compose exec redis redis-cli ping
```

### Migration Errors
```bash
# Check current version
alembic current

# Check history
alembic history

# Downgrade if needed
alembic downgrade -1

# Upgrade again
alembic upgrade head
```

### Import Errors
```bash
# Reinstall
pip install -e .

# Check installation
pip show freightiq
```

---

## 📈 Performance Check

```bash
# Load test with ab (Apache Bench)
ab -n 100 -c 10 http://localhost:8000/health

# Monitor logs
docker compose logs -f api | grep "INFO"
```

---

## 🛑 Shutdown

```bash
# Stop services
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v
```

---

## 🎓 Next Steps

1. ✅ **Verify setup** - All endpoints working
2. 📊 **Load sample data** - Populate vessels, ports, routes
3. 🧮 **Test calculations** - Voyage costs, compatibility
4. 📈 **Try forecasting** - Use baseline models
5. 🔌 **Integrate frontend** - Connect React app
6. 🚀 **Deploy** - Production configuration

---

## 📞 Quick Reference

| Service | URL | Credentials |
|---------|-----|-------------|
| API | http://localhost:8000 | - |
| API Docs | http://localhost:8000/docs | - |
| Health | http://localhost:8000/health | - |
| PostgreSQL | localhost:5432 | freightiq_user / changeme |
| Redis | localhost:6379 | - |
| MLflow | http://localhost:5000 | - |
| PgAdmin | http://localhost:5050 | admin@freightiq.local / admin |

---

**🚢 Ready to go! Start building intelligent freight solutions.**

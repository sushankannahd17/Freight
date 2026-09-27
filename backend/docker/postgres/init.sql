-- Initialize FreightIQ Database

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create MLflow database
CREATE DATABASE mlflow;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE freightiq TO freightiq_user;
GRANT ALL PRIVILEGES ON DATABASE mlflow TO freightiq_user;

-- Log initialization
SELECT 'FreightIQ database initialized with PostGIS support' AS status;

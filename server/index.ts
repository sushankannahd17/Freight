import express from 'express';
import cors from 'cors';
import { PORTS, VESSEL_CLASSES, ROUTES } from '../src/data/mockData';
import { generateCharterRecommendation } from '../src/services/recommendationEngine';
import { generateFreightForecast } from '../src/services/freightForecastService';
import { VoyageRequest } from '../src/types/freight';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(cors(FRONTEND_URL ? { origin: FRONTEND_URL } : undefined));
app.use(express.json());

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FreightIQ Backend API',
    timestamp: new Date().toISOString(),
    dataset: 'Prototype Dataset — Synthetic Values',
  });
});

// GET Ports
app.get('/api/ports', (req, res) => {
  res.json({ data: PORTS, total: PORTS.length });
});

// GET Vessels
app.get('/api/vessels', (req, res) => {
  res.json({ data: VESSEL_CLASSES, total: VESSEL_CLASSES.length });
});

// GET Routes
app.get('/api/routes', (req, res) => {
  res.json({ data: ROUTES, total: ROUTES.length });
});

// GET Forecast
app.get('/api/forecast', (req, res) => {
  const routeId = (req.query.routeId as string) || 'route-aus-paradip';
  const forecast = generateFreightForecast(routeId);
  res.json(forecast);
});

// POST Recommend
app.post('/api/recommend', (req, res) => {
  try {
    const voyageRequest: VoyageRequest = req.body;

    if (!voyageRequest.cargoQuantityMT || voyageRequest.cargoQuantityMT <= 0) {
      return res.status(400).json({ error: 'Invalid cargo quantity. Must be greater than 0 MT.' });
    }

    const recommendation = generateCharterRecommendation(voyageRequest);
    res.json(recommendation);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate recommendation', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`FreightIQ Backend Server running on http://localhost:${PORT}`);
});

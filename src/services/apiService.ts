/**
 * apiService.ts
 * Centralised client for all FreightIQ backend endpoints.
 * All calls go through Vite's /api proxy -> http://localhost:3001
 */

import type { VoyageRequest, CharterRecommendation, Port, VesselClass, Route } from '../types/freight';
import type { ForecastResponse } from './freightForecastService';

const BASE = '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchHealth(): Promise<{ status: string; service: string; timestamp: string }> {
  return apiFetch('/health');
}

export async function fetchPorts(): Promise<Port[]> {
  const result = await apiFetch<{ data: Port[]; total: number }>('/ports');
  return result.data;
}

export async function fetchVessels(): Promise<VesselClass[]> {
  const result = await apiFetch<{ data: VesselClass[]; total: number }>('/vessels');
  return result.data;
}

export async function fetchRoutes(): Promise<Route[]> {
  const result = await apiFetch<{ data: Route[]; total: number }>('/routes');
  return result.data;
}

export async function fetchForecast(routeId: string = 'route-aus-paradip'): Promise<ForecastResponse> {
  return apiFetch<ForecastResponse>(`/forecast?routeId=${encodeURIComponent(routeId)}`);
}

export async function postRecommend(request: VoyageRequest): Promise<CharterRecommendation> {
  return apiFetch<CharterRecommendation>('/recommend', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

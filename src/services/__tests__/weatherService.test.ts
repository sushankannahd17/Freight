import { describe, it, expect } from 'vitest';
import { getWMOWeatherCondition, getFallbackWeather } from '../weatherService';

describe('Weather Service', () => {
  it('correctly maps WMO weather codes to maritime condition descriptions and risk flags', () => {
    const clear = getWMOWeatherCondition(0);
    expect(clear.label).toContain('Clear');
    expect(clear.risk).toBe(false);

    const fog = getWMOWeatherCondition(45);
    expect(fog.label).toContain('Fog');
    expect(fog.risk).toBe(true);

    const thunderstorm = getWMOWeatherCondition(95);
    expect(thunderstorm.label).toContain('Thunderstorm');
    expect(thunderstorm.risk).toBe(true);
  });

  it('provides safe fallback weather data when offline', () => {
    const fallback = getFallbackWeather('Paradip Port');
    expect(fallback.temperature2m).toBeGreaterThan(0);
    expect(fallback.windSpeed10m).toBeGreaterThan(0);
    expect(fallback.conditionLabel).toBeTruthy();
  });
});

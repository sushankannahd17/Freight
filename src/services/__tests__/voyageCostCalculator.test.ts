import { describe, it, expect } from 'vitest';
import { calculateVoyageCost } from '../voyageCostCalculator';
import { PORTS, VESSEL_CLASSES, ROUTES } from '../../data/mockData';

describe('Voyage Cost Calculator', () => {
  const hayPoint = PORTS.find((p) => p.id === 'port-hay-point')!;
  const paradip = PORTS.find((p) => p.id === 'port-paradip')!;
  const route = ROUTES.find((r) => r.id === 'route-aus-paradip')!;

  const capesize = VESSEL_CLASSES.find((v) => v.name === 'Capesize')!;
  const supramax = VESSEL_CLASSES.find((v) => v.name === 'Supramax')!;

  it('should calculate correct number of voyages for Capesize with 150,000 MT cargo', () => {
    const cost = calculateVoyageCost(capesize, hayPoint, paradip, route, 150000, 'spot');
    expect(cost.numberOfVoyages).toBe(1);
    expect(cost.totalCostUSD).toBeGreaterThan(0);
    expect(cost.costPerMTUSD).toBeGreaterThan(0);
  });

  it('should calculate multiple voyages for Supramax with 150,000 MT cargo', () => {
    const cost = calculateVoyageCost(supramax, hayPoint, paradip, route, 150000, 'spot');
    expect(cost.numberOfVoyages).toBe(3); // 150,000 / 60,000 = 2.5 => 3 voyages
  });

  it('should apply discount for short-term and medium-term contract durations', () => {
    const spotCost = calculateVoyageCost(capesize, hayPoint, paradip, route, 150000, 'spot');
    const shortCost = calculateVoyageCost(capesize, hayPoint, paradip, route, 150000, 'short-term');
    const mediumCost = calculateVoyageCost(capesize, hayPoint, paradip, route, 150000, 'medium-term');

    expect(shortCost.effectiveFreightRateUSDPerMT).toBeLessThan(spotCost.effectiveFreightRateUSDPerMT);
    expect(mediumCost.effectiveFreightRateUSDPerMT).toBeLessThan(shortCost.effectiveFreightRateUSDPerMT);
  });
});

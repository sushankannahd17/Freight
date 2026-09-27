import { describe, it, expect } from 'vitest';
import { generateCharterRecommendation } from '../recommendationEngine';
import type { VoyageRequest } from '../../types/freight';

describe('Recommendation Engine', () => {
  it('should recommend Capesize or Panamax for 150,000 MT Australia to Paradip Coal request', () => {
    const request: VoyageRequest = {
      cargoType: 'Coal',
      cargoQuantityMT: 150000,
      originPortId: 'port-hay-point',
      destinationPortId: 'port-paradip',
      arrivalDate: '2026-10-15',
      contractDuration: 'short-term',
      preferredVesselClass: 'any',
    };

    const rec = generateCharterRecommendation(request);
    expect(['Capesize', 'Panamax', 'Supramax']).toContain(rec.recommendedVesselClass);
    expect(rec.estimatedVoyageCostUSD).toBeGreaterThan(0);
    expect(rec.explanation.length).toBeGreaterThan(0);
    expect(rec.feasibilityResults).toHaveLength(4);
  });

  it('should flag Capesize as Incompatible for Haldia and recommend Handysize/Supramax', () => {
    const request: VoyageRequest = {
      cargoType: 'Coal',
      cargoQuantityMT: 25000,
      originPortId: 'port-hay-point',
      destinationPortId: 'port-haldia',
      arrivalDate: '2026-10-20',
      contractDuration: 'spot',
      preferredVesselClass: 'any',
    };

    const rec = generateCharterRecommendation(request);
    const capesizeResult = rec.feasibilityResults.find((f) => f.vesselClass.name === 'Capesize')!;
    expect(capesizeResult.isFeasible).toBe(false);
    expect(capesizeResult.rejectionReasons.some((r) => r.includes('Haldia Dock Complex'))).toBe(true);
    expect(['Handysize', 'Supramax']).toContain(rec.recommendedVesselClass);
  });
});

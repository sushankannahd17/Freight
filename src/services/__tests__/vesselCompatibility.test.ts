import { describe, it, expect } from 'vitest';
import { checkVesselCompatibility } from '../vesselCompatibility';
import { PORTS, VESSEL_CLASSES } from '../../data/mockData';

describe('Vessel Compatibility Engine', () => {
  const hayPoint = PORTS.find((p) => p.id === 'port-hay-point')!;
  const gangavaram = PORTS.find((p) => p.id === 'port-gangavaram')!;
  const paradip = PORTS.find((p) => p.id === 'port-paradip')!;
  const haldia = PORTS.find((p) => p.id === 'port-haldia')!;

  const handysize = VESSEL_CLASSES.find((v) => v.name === 'Handysize')!;
  const capesize = VESSEL_CLASSES.find((v) => v.name === 'Capesize')!;
  const panamax = VESSEL_CLASSES.find((v) => v.name === 'Panamax')!;

  it('should approve Capesize vessel for Gangavaram deepwater port (19.5m draft)', () => {
    const result = checkVesselCompatibility(capesize, hayPoint, gangavaram, 150000, 'any');
    expect(result.isFeasible).toBe(true);
    expect(result.status).toBe('Compatible');
    expect(result.rejectionReasons).toHaveLength(0);
  });

  it('should approve Panamax vessel for Paradip port (16.0m draft)', () => {
    const result = checkVesselCompatibility(panamax, hayPoint, paradip, 75000, 'any');
    expect(result.isFeasible).toBe(true);
    expect(result.status).toBe('Compatible');
  });

  it('should REJECT Capesize vessel for Haldia shallow draft port', () => {
    const result = checkVesselCompatibility(capesize, hayPoint, haldia, 150000, 'any');
    expect(result.isFeasible).toBe(false);
    expect(result.status).toBe('Incompatible');
    expect(result.rejectionReasons.some((r) => r.includes('Haldia Dock Complex'))).toBe(true);
  });

  it('should approve Handysize vessel for Haldia shallow draft port', () => {
    const result = checkVesselCompatibility(handysize, hayPoint, haldia, 25000, 'any');
    expect(result.isFeasible).toBe(true);
    expect(result.status).toBe('Compatible');
  });

  it('should reject Panamax vessel if user specifically preferred Capesize', () => {
    const result = checkVesselCompatibility(panamax, hayPoint, paradip, 75000, 'Capesize');
    expect(result.isFeasible).toBe(false);
    expect(result.rejectionReasons[0]).toContain('Capesize');
  });
});

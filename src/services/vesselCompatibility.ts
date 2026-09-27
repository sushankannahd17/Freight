import type { Port, VesselClass, CompatibilityCheck } from '../types/freight';

export interface VesselCompatibilityResult {
  isFeasible: boolean;
  status: 'Compatible' | 'Incompatible' | 'Unknown';
  checks: CompatibilityCheck[];
  rejectionReasons: string[];
}

export function checkVesselCompatibility(
  vessel: VesselClass,
  originPort: Port,
  destinationPort: Port,
  cargoQuantityMT: number,
  preferredVesselClass: string = 'any'
): VesselCompatibilityResult {
  const checks: CompatibilityCheck[] = [];
  const rejectionReasons: string[] = [];

  // 1. User Preference Check
  if (preferredVesselClass !== 'any' && preferredVesselClass.toLowerCase() !== vessel.name.toLowerCase()) {
    checks.push({
      passed: false,
      reason: `User specifically selected preferred vessel class: ${preferredVesselClass}`,
      parameter: 'user_preference',
    });
    rejectionReasons.push(`Not the preferred vessel class selected by user (${preferredVesselClass}).`);
  } else {
    checks.push({
      passed: true,
      reason: 'Matches user vessel preference or "any".',
      parameter: 'user_preference',
    });
  }

  // 2. Origin Draft Check
  if (vessel.typicalDraftM > originPort.maxDraftM) {
    const diff = (vessel.typicalDraftM - originPort.maxDraftM).toFixed(1);
    const msg = `Origin Port (${originPort.name}) max draft is ${originPort.maxDraftM}m, but ${vessel.name} requires ${vessel.typicalDraftM}m draft (exceeds by ${diff}m).`;
    checks.push({ passed: false, reason: msg, parameter: 'origin_draft' });
    rejectionReasons.push(msg);
  } else {
    checks.push({
      passed: true,
      reason: `Origin draft OK (${vessel.typicalDraftM}m <= ${originPort.maxDraftM}m).`,
      parameter: 'origin_draft',
    });
  }

  // 3. Destination Draft Check
  if (vessel.typicalDraftM > destinationPort.maxDraftM) {
    const diff = (vessel.typicalDraftM - destinationPort.maxDraftM).toFixed(1);
    const msg = `Destination Port (${destinationPort.name}) max draft is ${destinationPort.maxDraftM}m, but ${vessel.name} requires ${vessel.typicalDraftM}m draft (exceeds by ${diff}m).`;
    checks.push({ passed: false, reason: msg, parameter: 'destination_draft' });
    rejectionReasons.push(msg);
  } else {
    checks.push({
      passed: true,
      reason: `Destination draft OK (${vessel.typicalDraftM}m <= ${destinationPort.maxDraftM}m).`,
      parameter: 'destination_draft',
    });
  }

  // 4. Origin LOA Check
  if (vessel.typicalLOAM > originPort.maxLOAM) {
    const msg = `Origin Port (${originPort.name}) max LOA is ${originPort.maxLOAM}m, but ${vessel.name} LOA is ${vessel.typicalLOAM}m.`;
    checks.push({ passed: false, reason: msg, parameter: 'origin_loa' });
    rejectionReasons.push(msg);
  } else {
    checks.push({
      passed: true,
      reason: `Origin LOA OK (${vessel.typicalLOAM}m <= ${originPort.maxLOAM}m).`,
      parameter: 'origin_loa',
    });
  }

  // 5. Destination LOA Check
  if (vessel.typicalLOAM > destinationPort.maxLOAM) {
    const msg = `Destination Port (${destinationPort.name}) max LOA is ${destinationPort.maxLOAM}m, but ${vessel.name} LOA is ${vessel.typicalLOAM}m.`;
    checks.push({ passed: false, reason: msg, parameter: 'destination_loa' });
    rejectionReasons.push(msg);
  } else {
    checks.push({
      passed: true,
      reason: `Destination LOA OK (${vessel.typicalLOAM}m <= ${destinationPort.maxLOAM}m).`,
      parameter: 'destination_loa',
    });
  }

  // 6. Origin Beam Check
  if (vessel.typicalBeamM > originPort.maxBeamM) {
    const msg = `Origin Port (${originPort.name}) max beam is ${originPort.maxBeamM}m, but ${vessel.name} beam is ${vessel.typicalBeamM}m.`;
    checks.push({ passed: false, reason: msg, parameter: 'origin_beam' });
    rejectionReasons.push(msg);
  } else {
    checks.push({
      passed: true,
      reason: `Origin Beam OK (${vessel.typicalBeamM}m <= ${originPort.maxBeamM}m).`,
      parameter: 'origin_beam',
    });
  }

  // 7. Destination Beam Check
  if (vessel.typicalBeamM > destinationPort.maxBeamM) {
    const msg = `Destination Port (${destinationPort.name}) max beam is ${destinationPort.maxBeamM}m, but ${vessel.name} beam is ${vessel.typicalBeamM}m.`;
    checks.push({ passed: false, reason: msg, parameter: 'destination_beam' });
    rejectionReasons.push(msg);
  } else {
    checks.push({
      passed: true,
      reason: `Destination Beam OK (${vessel.typicalBeamM}m <= ${destinationPort.maxBeamM}m).`,
      parameter: 'destination_beam',
    });
  }

  // 8. Capacity Feasibility Check
  // Handysize with > 120,000 MT cargo would require >= 5 voyages, which is operationally inefficient
  const requiredVoyages = Math.ceil(cargoQuantityMT / vessel.capacityMaxMT);
  if (requiredVoyages > 5) {
    const msg = `Cargo quantity (${cargoQuantityMT.toLocaleString()} MT) requires ${requiredVoyages} voyages in ${vessel.name}, which exceeds practical operational threshold (max 5 voyages).`;
    checks.push({ passed: false, reason: msg, parameter: 'cargo_capacity' });
    rejectionReasons.push(msg);
  } else {
    checks.push({
      passed: true,
      reason: `Capacity OK (${requiredVoyages} voyage(s) required).`,
      parameter: 'cargo_capacity',
    });
  }

  const isFeasible = rejectionReasons.length === 0;
  const status = isFeasible ? 'Compatible' : 'Incompatible';

  return {
    isFeasible,
    status,
    checks,
    rejectionReasons,
  };
}

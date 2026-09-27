import type { Port, VesselClass, Route } from '../types/freight';

export interface CalculatedVoyageMetrics {
  numberOfVoyages: number;
  cargoPerVoyageMT: number;
  seaDays: number;
  turnaroundDays: number;
  totalVoyageDays: number;
  effectiveFreightRateUSDPerMT: number;
  freightCostUSD: number;
  fuelCostUSD: number;
  portCostUSD: number;
  hireCostUSD: number;
  totalCostUSD: number;
  costPerMTUSD: number;
}

export const FUEL_PRICE_USD_PER_TON = 650; // VLSFO global average bunker price

export function calculateVoyageCost(
  vessel: VesselClass,
  originPort: Port,
  destinationPort: Port,
  route: Route,
  cargoQuantityMT: number,
  contractDuration: 'spot' | 'short-term' | 'medium-term'
): CalculatedVoyageMetrics {
  // 1. Determine number of voyages needed
  const numberOfVoyages = Math.max(1, Math.ceil(cargoQuantityMT / vessel.capacityMaxMT));
  const cargoPerVoyageMT = Math.min(vessel.capacityMaxMT, Math.round(cargoQuantityMT / numberOfVoyages));

  // 2. Sea voyage time (round-trip nautical miles)
  const roundTripDistanceNM = route.distanceNM * 2;
  const seaDaysPerVoyage = roundTripDistanceNM / (vessel.speedKnots * 24);

  // 3. Port turnaround time (loading & discharge)
  const loadingDays = cargoPerVoyageMT / (originPort.cargoHandlingRateTPH * 24) + 1.0; // 1 day berthing delay
  const dischargeDays = cargoPerVoyageMT / (destinationPort.cargoHandlingRateTPH * 24) + 1.5; // 1.5 days unberthing/queueing
  const turnaroundDaysPerVoyage = loadingDays + dischargeDays;

  // 4. Total voyage days per voyage (including 5% weather/sea margin)
  const totalDaysPerVoyage = (seaDaysPerVoyage + turnaroundDaysPerVoyage) * 1.05;

  // 5. Total days across all required voyages
  const totalSeaDays = Math.round(seaDaysPerVoyage * numberOfVoyages * 10) / 10;
  const totalTurnaroundDays = Math.round(turnaroundDaysPerVoyage * numberOfVoyages * 10) / 10;
  const totalVoyageDays = Math.round(totalDaysPerVoyage * numberOfVoyages * 10) / 10;

  // 6. Contract Duration Freight Rate Multiplier
  let contractMultiplier = 1.0;
  if (contractDuration === 'short-term') {
    contractMultiplier = 0.95; // 5% discount for 3-6 month commitment
  } else if (contractDuration === 'medium-term') {
    contractMultiplier = 0.90; // 10% discount for 1 year commitment
  }

  // Adjust baseline rate for vessel scale economics
  // Capesize is cheaper per MT than Handysize
  let vesselScaleFactor = 1.0;
  if (vessel.name === 'Capesize') vesselScaleFactor = 0.88;
  else if (vessel.name === 'Panamax') vesselScaleFactor = 0.94;
  else if (vessel.name === 'Supramax') vesselScaleFactor = 0.98;
  else if (vessel.name === 'Handysize') vesselScaleFactor = 1.08;

  const effectiveFreightRateUSDPerMT =
    Math.round(route.baselineFreightUSDPerMT * contractMultiplier * vesselScaleFactor * 100) / 100;

  // 7. Cost breakdown calculation
  const freightCostUSD = Math.round(cargoQuantityMT * effectiveFreightRateUSDPerMT);
  const hireCostUSD = Math.round(totalVoyageDays * vessel.dailyHireRateUSD);
  const fuelCostUSD = Math.round(totalVoyageDays * vessel.fuelConsumptionTonsPerDay * FUEL_PRICE_USD_PER_TON);

  // Port costs (Fixed dues per call + handling fee per MT)
  const fixedPortDuesPerCall = 18000;
  const portCostUSD = Math.round((fixedPortDuesPerCall * 2 * numberOfVoyages) + (cargoQuantityMT * 1.20));

  // Total Estimated Voyage Cost = Freight + Fuel + Port + Hire
  const totalCostUSD = freightCostUSD + fuelCostUSD + portCostUSD + hireCostUSD;
  const costPerMTUSD = Math.round((totalCostUSD / cargoQuantityMT) * 100) / 100;

  return {
    numberOfVoyages,
    cargoPerVoyageMT,
    seaDays: totalSeaDays,
    turnaroundDays: totalTurnaroundDays,
    totalVoyageDays,
    effectiveFreightRateUSDPerMT,
    freightCostUSD,
    fuelCostUSD,
    portCostUSD,
    hireCostUSD,
    totalCostUSD,
    costPerMTUSD,
  };
}

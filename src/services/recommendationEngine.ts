import type {
  VoyageRequest,
  CharterRecommendation,
  FeasibilityResult,
  VesselClassName,
} from '../types/freight';
import { PORTS, VESSEL_CLASSES, ROUTES } from '../data/mockData';
import { checkVesselCompatibility } from './vesselCompatibility';
import { calculateVoyageCost } from './voyageCostCalculator';

export function generateCharterRecommendation(request: VoyageRequest): CharterRecommendation {
  const originPort = PORTS.find((p) => p.id === request.originPortId) || PORTS[0];
  const destinationPort = PORTS.find((p) => p.id === request.destinationPortId) || PORTS[5]; // Default Paradip

  // Find route or generate default fallback
  let route = ROUTES.find(
    (r) => r.originPortId === originPort.id && r.destinationPortId === destinationPort.id
  );

  if (!route) {
    // Dynamic fallback route calculation based on default distance
    route = {
      id: `route-dynamic-${originPort.id}-${destinationPort.id}`,
      originPortId: originPort.id,
      destinationPortId: destinationPort.id,
      distanceNM: 4500,
      baselineFreightUSDPerMT: 19.5,
      dataStatus: 'synthetic',
    };
  }

  // Evaluate all vessel classes
  const feasibilityResults: FeasibilityResult[] = VESSEL_CLASSES.map((vessel) => {
    const compatibility = checkVesselCompatibility(
      vessel,
      originPort,
      destinationPort,
      request.cargoQuantityMT,
      request.preferredVesselClass
    );

    const costMetrics = calculateVoyageCost(
      vessel,
      originPort,
      destinationPort,
      route,
      request.cargoQuantityMT,
      request.contractDuration
    );

    // Determine risk level based on draft margin and voyage count
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    const draftMargin = destinationPort.maxDraftM - vessel.typicalDraftM;
    if (draftMargin < 1.0) riskLevel = 'Medium';
    if (destinationPort.id === 'port-haldia' || costMetrics.numberOfVoyages > 3) riskLevel = 'High';

    return {
      vesselClass: vessel,
      isFeasible: compatibility.isFeasible,
      status: compatibility.status,
      compatibilityChecks: compatibility.checks,
      rejectionReasons: compatibility.rejectionReasons,
      numberOfVoyages: costMetrics.numberOfVoyages,
      turnaroundDays: costMetrics.turnaroundDays,
      seaDays: costMetrics.seaDays,
      totalVoyageDays: costMetrics.totalVoyageDays,
      estimatedFreightRateUSDPerMT: costMetrics.effectiveFreightRateUSDPerMT,
      freightCostUSD: costMetrics.freightCostUSD,
      fuelCostUSD: costMetrics.fuelCostUSD,
      portCostUSD: costMetrics.portCostUSD,
      hireCostUSD: costMetrics.hireCostUSD,
      totalCostUSD: costMetrics.totalCostUSD,
      costPerMTUSD: costMetrics.costPerMTUSD,
      riskLevel,
    };
  });

  // Sort feasible vessels by total cost ascending
  const feasibleResults = feasibilityResults.filter((f) => f.isFeasible).sort((a, b) => a.totalCostUSD - b.totalCostUSD);
  const infeasibleResults = feasibilityResults.filter((f) => !f.isFeasible);

  let recommendedResult: FeasibilityResult;
  if (feasibleResults.length > 0) {
    recommendedResult = feasibleResults[0];
  } else {
    // If no vessel passes strict preference, fallback to least infeasible / smallest cost option
    recommendedResult = feasibilityResults.sort((a, b) => a.totalCostUSD - b.totalCostUSD)[0];
  }

  // Generate transparent rationale list
  const explanation: string[] = [];

  explanation.push(
    `Fits the required cargo quantity of ${request.cargoQuantityMT.toLocaleString()} MT in ${recommendedResult.numberOfVoyages} voyage(s) with high operational efficiency.`
  );

  if (recommendedResult.isFeasible) {
    explanation.push(
      `Passes all physical port infrastructure constraints (draft clearance: ${recommendedResult.vesselClass.typicalDraftM}m vs ${destinationPort.name} max ${destinationPort.maxDraftM}m).`
    );
  } else {
    explanation.push(
      `Selected as closest option despite operational warnings: ${recommendedResult.rejectionReasons.join('; ')}`
    );
  }

  if (feasibleResults.length > 1) {
    const secondOption = feasibleResults[1];
    const diffCost = (secondOption.totalCostUSD - recommendedResult.totalCostUSD).toLocaleString();
    explanation.push(
      `Delivers an estimated cost saving of $${diffCost} compared to the next feasible alternative (${secondOption.vesselClass.name}).`
    );
  }

  if (request.contractDuration === 'short-term') {
    explanation.push(
      `Benefits from a 5% multi-voyage contract discount compared to spot market rates.`
    );
  } else if (request.contractDuration === 'medium-term') {
    explanation.push(
      `Secures a 10% strategic volume discount under a medium-term multiple-voyage charter agreement.`
    );
  }

  // Alternatives list
  const alternatives: string[] = [];
  feasibleResults.slice(1).forEach((res) => {
    alternatives.push(
      `${res.vesselClass.name}: Total cost $${res.totalCostUSD.toLocaleString()} ($${res.costPerMTUSD}/MT) in ${res.numberOfVoyages} voyage(s).`
    );
  });

  infeasibleResults.forEach((res) => {
    alternatives.push(
      `${res.vesselClass.name} (Incompatible): ${res.rejectionReasons[0]}`
    );
  });

  // Calculate forecast rate range
  const baseRate = recommendedResult.estimatedFreightRateUSDPerMT;
  const forecastRateMin = Math.round((baseRate * 0.94) * 100) / 100;
  const forecastRateMax = Math.round((baseRate * 1.08) * 100) / 100;

  let contractStrategyDesc = 'Spot Market Chartering';
  if (request.contractDuration === 'short-term') contractStrategyDesc = '3-6 Month Short-Term Contract';
  if (request.contractDuration === 'medium-term') contractStrategyDesc = '12-Month Medium-Term Multiple-Voyage COA';

  return {
    recommendedVesselClass: recommendedResult.vesselClass.name as VesselClassName,
    recommendedVesselId: recommendedResult.vesselClass.id,
    forecastRateMin,
    forecastRateMax,
    estimatedVoyageCostUSD: recommendedResult.totalCostUSD,
    costPerMTUSD: recommendedResult.costPerMTUSD,
    numberOfVoyages: recommendedResult.numberOfVoyages,
    compatibilityStatus: recommendedResult.status,
    contractStrategy: contractStrategyDesc,
    riskLevel: recommendedResult.riskLevel,
    explanation,
    alternatives,
    feasibilityResults,
    dataStatus: 'synthetic',
  };
}

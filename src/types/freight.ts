export type DataStatus = 'synthetic' | 'verified';

export type VesselClassName = 'Handysize' | 'Supramax' | 'Panamax' | 'Capesize';

export interface Port {
  id: string;
  name: string;
  country: string;
  region: string;
  maxDraftM: number;
  maxLOAM: number;
  maxBeamM: number;
  cargoHandlingRateTPH: number; // Tons Per Hour
  notes: string;
  dataStatus: DataStatus;
  latitude: number;
  longitude: number;
}

export interface VesselClass {
  id: string;
  name: VesselClassName;
  capacityMinMT: number;
  capacityMaxMT: number;
  typicalDraftM: number;
  typicalLOAM: number;
  typicalBeamM: number;
  speedKnots: number;
  dailyHireRateUSD: number;
  fuelConsumptionTonsPerDay: number;
}

export interface Route {
  id: string;
  originPortId: string;
  destinationPortId: string;
  distanceNM: number;
  baselineFreightUSDPerMT: number;
  dataStatus: DataStatus;
}

export interface FreightRateRecord {
  date: string; // YYYY-MM
  routeId: string;
  vesselClassId: string;
  rateUSDPerMT: number;
  dataStatus: DataStatus;
}

export interface VoyageRequest {
  cargoType: string;
  cargoQuantityMT: number;
  originPortId: string;
  destinationPortId: string;
  arrivalDate: string;
  contractDuration: 'spot' | 'short-term' | 'medium-term';
  preferredVesselClass: string; // 'any' or VesselClassName
}

export interface CompatibilityCheck {
  passed: boolean;
  reason: string;
  parameter: 'cargo_capacity' | 'origin_draft' | 'destination_draft' | 'origin_loa' | 'destination_loa' | 'origin_beam' | 'destination_beam' | 'user_preference';
}

export interface FeasibilityResult {
  vesselClass: VesselClass;
  isFeasible: boolean;
  status: 'Compatible' | 'Incompatible' | 'Unknown';
  compatibilityChecks: CompatibilityCheck[];
  rejectionReasons: string[];
  numberOfVoyages: number;
  turnaroundDays: number;
  seaDays: number;
  totalVoyageDays: number;
  estimatedFreightRateUSDPerMT: number;
  freightCostUSD: number;
  fuelCostUSD: number;
  portCostUSD: number;
  hireCostUSD: number;
  totalCostUSD: number;
  costPerMTUSD: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface CharterRecommendation {
  recommendedVesselClass: VesselClassName;
  recommendedVesselId: string;
  forecastRateMin: number;
  forecastRateMax: number;
  estimatedVoyageCostUSD: number;
  costPerMTUSD: number;
  numberOfVoyages: number;
  compatibilityStatus: string;
  contractStrategy: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  explanation: string[];
  alternatives: string[];
  feasibilityResults: FeasibilityResult[];
  dataStatus: DataStatus;
}

export interface ForecastPoint {
  date: string; // YYYY-MM
  baselineRate: number;
  lowerBound80: number;
  upperBound80: number;
  lowerBound95: number;
  upperBound95: number;
  isForecast: boolean;
}

export interface RiskAlert {
  id: string;
  title: string;
  category: 'Volatility' | 'Congestion' | 'Draft Clearance' | 'Weather' | 'Contract Timing';
  severity: 'Low' | 'Medium' | 'High';
  routeId?: string;
  portId?: string;
  message: string;
  mitigation: string;
  timestamp: string;
}

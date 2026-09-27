import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PORTS, VESSEL_CLASSES } from '../data/mockData';
import type { VoyageRequest, CharterRecommendation } from '../types/freight';
import { generateCharterRecommendation } from '../services/recommendationEngine';
import { DatasetBadge } from '../components/common/DatasetBadge';
import {
  ScrollReveal,
  StaggerContainer,
  DetailModal,
} from '../components/common/AnimationSystem';
import {
  Navigation,
  Ship,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  RotateCcw,
  Zap,
  Anchor,
  TrendingUp,
  MapPin,
  Gauge,
  Sliders,
  BarChart3,
  Layers,
} from 'lucide-react';

export const VoyagePlannerPage: React.FC = () => {
  const location = useLocation();
  const { currency, t, formatCurrency, formatRatePerMT, formatTotalCostShort } = useApp();

  // Form State
  const [cargoType, setCargoType] = useState<string>('Coal');
  const [cargoQuantityMT, setCargoQuantityMT] = useState<number>(75000);
  const [arrivalDate, setArrivalDate] = useState<string>('2026-10-15');
  const [originPortId, setOriginPortId] = useState<string>('port-hay-point');
  const [destinationPortId, setDestinationPortId] = useState<string>('port-paradip');
  const [contractDuration, setContractDuration] = useState<'spot' | 'short-term' | 'medium-term'>('short-term');
  const [preferredVesselClass, setPreferredVesselClass] = useState<string>('any');

  // Recommendation Result State
  const [recommendation, setRecommendation] = useState<CharterRecommendation | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>('paradip');
  const [activeFeasibilityModal, setActiveFeasibilityModal] = useState<any | null>(null);

  // Load state from navigation if passed from dashboard
  useEffect(() => {
    if (location.state) {
      const s = location.state as any;
      if (s.cargoType) setCargoType(s.cargoType);
      if (s.cargoQuantityMT) setCargoQuantityMT(s.cargoQuantityMT);
      if (s.originPortId) setOriginPortId(s.originPortId);
      if (s.destinationPortId) setDestinationPortId(s.destinationPortId);
      if (s.contractDuration) setContractDuration(s.contractDuration);
      if (s.preferredVesselClass) setPreferredVesselClass(s.preferredVesselClass);

      setTimeout(() => {
        handleGenerateRecommendationWithParams({
          cargoType: s.cargoType || 'Coal',
          cargoQuantityMT: s.cargoQuantityMT || 75000,
          arrivalDate: '2026-10-15',
          originPortId: s.originPortId || 'port-hay-point',
          destinationPortId: s.destinationPortId || 'port-paradip',
          contractDuration: s.contractDuration || 'short-term',
          preferredVesselClass: s.preferredVesselClass || 'any',
        });
      }, 100);
    } else {
      handleGenerateRecommendation();
    }
  }, [location.state]);

  const handleApplyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    let params: VoyageRequest;

    switch (presetKey) {
      case 'paradip':
        params = {
          cargoType: 'Coal',
          cargoQuantityMT: 75000,
          arrivalDate: '2026-10-15',
          originPortId: 'port-hay-point',
          destinationPortId: 'port-paradip',
          contractDuration: 'short-term',
          preferredVesselClass: 'any',
        };
        break;
      case 'dhamra':
        params = {
          cargoType: 'Coal',
          cargoQuantityMT: 55000,
          arrivalDate: '2026-10-20',
          originPortId: 'port-richards-bay',
          destinationPortId: 'port-dhamra',
          contractDuration: 'short-term',
          preferredVesselClass: 'Supramax',
        };
        break;
      case 'vizag':
        params = {
          cargoType: 'Coal',
          cargoQuantityMT: 60000,
          arrivalDate: '2026-10-18',
          originPortId: 'port-samarinda',
          destinationPortId: 'port-vizag',
          contractDuration: 'spot',
          preferredVesselClass: 'Panamax',
        };
        break;
      case 'haldia':
        params = {
          cargoType: 'Coal',
          cargoQuantityMT: 35000,
          arrivalDate: '2026-10-25',
          originPortId: 'port-maputo',
          destinationPortId: 'port-haldia',
          contractDuration: 'short-term',
          preferredVesselClass: 'Handymax',
        };
        break;
      default:
        params = {
          cargoType: 'Coal',
          cargoQuantityMT: 75000,
          arrivalDate: '2026-10-15',
          originPortId: 'port-hay-point',
          destinationPortId: 'port-paradip',
          contractDuration: 'short-term',
          preferredVesselClass: 'any',
        };
    }

    setCargoType(params.cargoType);
    setCargoQuantityMT(params.cargoQuantityMT);
    setArrivalDate(params.arrivalDate);
    setOriginPortId(params.originPortId);
    setDestinationPortId(params.destinationPortId);
    setContractDuration(params.contractDuration);
    setPreferredVesselClass(params.preferredVesselClass);

    handleGenerateRecommendationWithParams(params);
  };

  const handleGenerateRecommendationWithParams = (req: VoyageRequest) => {
    setErrorMsg(null);
    if (!req.cargoQuantityMT || req.cargoQuantityMT <= 0) {
      setErrorMsg('Please enter a valid cargo quantity greater than 0 MT.');
      return;
    }

    setIsCalculating(true);
    setTimeout(() => {
      const res = generateCharterRecommendation(req);
      setRecommendation(res);
      setIsCalculating(false);
    }, 150);
  };

  const handleGenerateRecommendation = () => {
    handleGenerateRecommendationWithParams({
      cargoType,
      cargoQuantityMT: Number(cargoQuantityMT),
      arrivalDate,
      originPortId,
      destinationPortId,
      contractDuration,
      preferredVesselClass,
    });
  };

  const originPorts = PORTS.filter((p) => p.region !== 'East Coast India');
  const destinationPorts = PORTS.filter((p) => p.region === 'East Coast India');
  const selectedDestination = PORTS.find((p) => p.id === destinationPortId);

  // 8-step workflow definition
  const workflowSteps = [
    { num: '01', title: 'Cargo', desc: 'Spec & MT', icon: Layers },
    { num: '02', title: 'Origin', desc: 'Load Port', icon: MapPin },
    { num: '03', title: 'Destination', desc: 'Discharge', icon: Anchor },
    { num: '04', title: 'Vessel', desc: 'DWT & Draft', icon: Ship },
    { num: '05', title: 'Market', desc: 'Spot Rate', icon: TrendingUp },
    { num: '06', title: 'Port', desc: 'Clearance', icon: Gauge },
    { num: '07', title: 'Economics', desc: 'Breakdown', icon: DollarSign },
    { num: '08', title: 'Compare', desc: 'Pick Class', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-teal-600" />
              <span>MARITIME VOYAGE PLANNER</span>
            </span>
            <DatasetBadge />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['ABC_Diatype'] mt-1">
            {t('navPlanner')} (East Coast India Standard)
          </h1>
        </div>

        <button
          onClick={() => handleApplyPreset('paradip')}
          className="btn-manzil-secondary text-xs font-bold flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
          <span>Reset Demo Route</span>
        </button>
      </div>

      {/* 01-08 VISUAL WORKFLOW PIPELINE BAR */}
      <ScrollReveal animation="fade-up">
        <div className="manzil-glass-card p-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              <span>8-Stage Commercial Chartering Workflow Pipeline</span>
            </span>
            <span className="text-teal-700 font-bold">Live Guidance Engine</span>
          </div>
          <StaggerContainer staggerDelayMs={50} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs font-mono pt-1">
            {workflowSteps.map((step, i) => {
              const isCompleted = recommendation !== null;
              const StepIcon = step.icon;
              return (
                <div
                  key={step.num}
                  className={`p-2 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-teal-50 border-teal-200 text-teal-800 font-bold'
                      : i === 0
                      ? 'bg-sky-50 border-sky-200 text-sky-800 font-bold'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-extrabold text-[11px] block">{step.num} {step.title}</span>
                    <StepIcon className="w-3 h-3 opacity-75 text-teal-600" />
                  </div>
                  <span className="text-[10px] opacity-75 block text-left truncate">{step.desc}</span>
                </div>
              );
            })}
          </StaggerContainer>
        </div>
      </ScrollReveal>

      {/* 1-Click Popular Indian Trade Route Presets */}
      <ScrollReveal animation="fade-up">
        <div className="manzil-glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-800 uppercase tracking-wider">
              <Zap className="w-4 h-4 fill-amber-600 text-amber-600" />
              <span>1-Click Steel Industry Quick Presets</span>
            </div>
            <span className="text-[11px] text-slate-600 font-mono font-medium hidden sm:inline">
              Select a route to evaluate channel draft & vessel cost
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => handleApplyPreset('paradip')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                activePreset === 'paradip'
                  ? 'bg-teal-50 border-teal-300 text-slate-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="font-extrabold text-xs text-slate-900 flex items-center justify-between">
                <span>🚢 Paradip Import</span>
                <span className="port-badge">PDP</span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono mt-1">Newcastle → Paradip</div>
              <div className="text-[10px] text-teal-700 font-bold mt-1">75,000 MT Coking Coal</div>
            </button>

            <button
              onClick={() => handleApplyPreset('dhamra')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                activePreset === 'dhamra'
                  ? 'bg-teal-50 border-teal-300 text-slate-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="font-extrabold text-xs text-slate-900 flex items-center justify-between">
                <span>🚢 Dhamra Deep-Draft</span>
                <span className="port-badge">DHM</span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono mt-1">Richards Bay → Dhamra</div>
              <div className="text-[10px] text-teal-700 font-bold mt-1">55,000 MT Supramax</div>
            </button>

            <button
              onClick={() => handleApplyPreset('vizag')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                activePreset === 'vizag'
                  ? 'bg-teal-50 border-teal-300 text-slate-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="font-extrabold text-xs text-slate-900 flex items-center justify-between">
                <span>🚢 Vizag Panamax</span>
                <span className="port-badge">VZG</span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono mt-1">Samarinda → Vizag</div>
              <div className="text-[10px] text-teal-700 font-bold mt-1">60,000 MT Thermal Coal</div>
            </button>

            <button
              onClick={() => handleApplyPreset('haldia')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                activePreset === 'haldia'
                  ? 'bg-teal-50 border-teal-300 text-slate-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="font-extrabold text-xs text-slate-900 flex items-center justify-between">
                <span>🚢 Haldia Shallow Draft</span>
                <span className="port-badge">HAL</span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono mt-1">Maputo → Haldia</div>
              <div className="text-[10px] text-amber-800 font-bold mt-1">35,000 MT Handymax (8.5m limit)</div>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Main Guided Form & Results Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Panel (5 cols) */}
        <ScrollReveal animation="fade-right" className="lg:col-span-5 manzil-glass-card p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xs font-mono font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4 text-teal-600" />
              <span>Voyage Specifications Form</span>
            </h2>
            <span className="badge-teal px-2.5 py-0.5 rounded text-[10px] font-mono">
              Live Interactive
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 01: Cargo Specifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-black">1</span>
              <span>Cargo Specifications</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1 uppercase">Cargo Commodity</label>
                <select
                  value={cargoType}
                  onChange={(e) => setCargoType(e.target.value)}
                  className="w-full manzil-select cursor-pointer"
                >
                  <option value="Coal">Coking / Thermal Coal</option>
                  <option value="Iron Ore">Iron Ore Fines / Pellets</option>
                  <option value="Other Bulk Cargo">Limestone / Dolomite / Bulk</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1 uppercase">Quantity (MT)</label>
                <input
                  type="number"
                  value={cargoQuantityMT}
                  onChange={(e) => setCargoQuantityMT(Number(e.target.value))}
                  step={5000}
                  min={5000}
                  max={500000}
                  className="w-full manzil-input font-mono-num"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1 uppercase">Target Arrival Date</label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full manzil-input font-mono"
              />
            </div>
          </div>

          {/* Section 02: Route & Ports */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-black">2</span>
              <span>Origin & East Coast Port</span>
            </h3>

            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1 uppercase">Overseas Loading Port</label>
              <select
                value={originPortId}
                onChange={(e) => setOriginPortId(e.target.value)}
                className="w-full manzil-select cursor-pointer"
              >
                {originPorts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.country}) — Draft: {p.maxDraftM}m
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1 uppercase">Indian East Coast Terminal</label>
              <select
                value={destinationPortId}
                onChange={(e) => setDestinationPortId(e.target.value)}
                className="w-full manzil-select cursor-pointer"
              >
                {destinationPorts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Max Draft: {p.maxDraftM}m {p.id === 'port-haldia' ? '⚠️ (Shallow 8.5m Limit)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedDestination && selectedDestination.id === 'port-haldia' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-mono flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Haldia Draft Restriction:</strong> Haldia has an 8.5m max draft limit. Panamax and Capesize bulk carriers will fail clearance checks.
                </span>
              </div>
            )}
          </div>

          {/* Section 03: Charter Strategy */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h3 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-black">3</span>
              <span>Charter Strategy</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1 uppercase">Contract Type</label>
                <select
                  value={contractDuration}
                  onChange={(e: any) => setContractDuration(e.target.value)}
                  className="w-full manzil-select cursor-pointer"
                >
                  <option value="spot">Spot Market Charter</option>
                  <option value="short-term">Short-Term (3-6 Months)</option>
                  <option value="medium-term">Medium-Term (12 Mo COA)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1 uppercase">Vessel Filter</label>
                <select
                  value={preferredVesselClass}
                  onChange={(e) => setPreferredVesselClass(e.target.value)}
                  className="w-full manzil-select cursor-pointer"
                >
                  <option value="any">Auto-Select Best Class</option>
                  {VESSEL_CLASSES.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} ({v.capacityMinMT / 1000}k-{v.capacityMaxMT / 1000}k MT)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Calculate Action Button */}
          <button
            onClick={handleGenerateRecommendation}
            disabled={isCalculating}
            className="btn-manzil-teal w-full py-3.5 text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCalculating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Evaluating Port Drafts & Vessel Rates...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 fill-white text-white" />
                <span>Calculate Voyage Recommendation ({currency})</span>
              </>
            )}
          </button>
        </ScrollReveal>

        {/* Right Column: Recommendation Results Panel (7 cols) */}
        <ScrollReveal animation="fade-left" className="lg:col-span-7 space-y-6">
          {recommendation ? (
            <>
              {/* Primary Recommended Option Card */}
              <div className="manzil-glass-panel p-6 space-y-5 relative border border-teal-300">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-amber-800">
                      Recommended Primary Charter
                    </span>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3 mt-1 font-['ABC_Diatype']">
                      <span>{recommendation.recommendedVesselClass}</span>
                      <span className="badge-teal px-3 py-1 rounded-full text-xs font-mono font-bold">
                        {recommendation.compatibilityStatus}
                      </span>
                    </h2>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono font-bold text-slate-700 uppercase block">Estimated Voyage Commitment ({currency})</span>
                    <p className="text-2xl font-mono-num font-black text-amber-800">
                      {formatCurrency(recommendation.estimatedVoyageCostUSD)}
                    </p>
                    <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                      {formatTotalCostShort(recommendation.estimatedVoyageCostUSD)}
                    </span>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono">
                  <div>
                    <span className="text-slate-700 block text-[10px] uppercase font-bold">Voyages Required</span>
                    <span className="font-extrabold text-slate-900 text-sm">{recommendation.numberOfVoyages} Shipment(s)</span>
                  </div>
                  <div>
                    <span className="text-slate-700 block text-[10px] uppercase font-bold">Freight Rate</span>
                    <span className="font-extrabold text-amber-800 text-sm font-mono-num">
                      {formatRatePerMT(recommendation.forecastRateMin)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-700 block text-[10px] uppercase font-bold">Strategy</span>
                    <span className="font-extrabold text-slate-900 text-sm truncate block">{recommendation.contractStrategy}</span>
                  </div>
                  <div>
                    <span className="text-slate-700 block text-[10px] uppercase font-bold">Risk Assessment</span>
                    <span
                      className={`font-extrabold text-xs inline-block px-2 py-0.5 rounded mt-0.5 ${
                        recommendation.riskLevel === 'Low'
                          ? 'badge-emerald'
                          : recommendation.riskLevel === 'Medium'
                          ? 'badge-amber'
                          : 'badge-rose'
                      }`}
                    >
                      {recommendation.riskLevel} Risk
                    </span>
                  </div>
                </div>

                {/* Recommendation Justifications */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                    <span>MANZIL Recommendation Rationale</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside font-medium leading-relaxed">
                    {recommendation.explanation.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Itemized Cost Breakdown Card */}
              {recommendation && (() => {
                const topRes = recommendation.feasibilityResults.find(
                  (f) => f.vesselClass.name === recommendation.recommendedVesselClass
                ) || recommendation.feasibilityResults[0];

                const total = topRes.freightCostUSD + topRes.hireCostUSD + topRes.fuelCostUSD + topRes.portCostUSD || 1;
                const pctFreight = Math.round((topRes.freightCostUSD / total) * 100);
                const pctHire = Math.round((topRes.hireCostUSD / total) * 100);
                const pctFuel = Math.round((topRes.fuelCostUSD / total) * 100);
                const pctPort = 100 - pctFreight - pctHire - pctFuel;

                return (
                  <div className="manzil-glass-card p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <h3 className="text-xs font-mono font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-teal-600" />
                        <span>Itemized Cost Breakdown ({currency})</span>
                      </h3>
                      <span className="text-xs font-mono font-bold text-slate-900 font-mono-num">
                        Total: {formatCurrency(topRes.totalCostUSD)}
                      </span>
                    </div>

                    {/* Visual Stacked Percentage Bar */}
                    <div className="space-y-2">
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex border border-slate-200 p-0.5">
                        <div style={{ width: `${pctFreight}%` }} className="bg-teal-600 h-full rounded-l transition-all duration-500" title={`Freight: ${pctFreight}%`} />
                        <div style={{ width: `${pctHire}%` }} className="bg-sky-600 h-full transition-all duration-500" title={`Charter Hire: ${pctHire}%`} />
                        <div style={{ width: `${pctFuel}%` }} className="bg-amber-600 h-full transition-all duration-500" title={`Bunker Fuel: ${pctFuel}%`} />
                        <div style={{ width: `${pctPort}%` }} className="bg-emerald-600 h-full rounded-r transition-all duration-500" title={`Port Dues: ${pctPort}%`} />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono font-bold text-slate-700">
                        <span className="text-teal-700">Freight ({pctFreight}%)</span>
                        <span className="text-sky-700">Hire ({pctHire}%)</span>
                        <span className="text-amber-800">Fuel ({pctFuel}%)</span>
                        <span className="text-emerald-700">Port ({pctPort}%)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-700 uppercase block">Freight Cost</span>
                        <span className="text-sm font-black text-slate-900 font-mono-num">
                          {formatCurrency(topRes.freightCostUSD)}
                        </span>
                        <span className="text-[10px] text-slate-600 block mt-0.5 font-medium">Cargo × Rate</span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-700 uppercase block">Charter Hire</span>
                        <span className="text-sm font-black text-slate-900 font-mono-num">
                          {formatCurrency(topRes.hireCostUSD)}
                        </span>
                        <span className="text-[10px] text-slate-600 block mt-0.5 font-medium">
                          {topRes.totalVoyageDays} days @ hire
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-700 uppercase block">Bunker Fuel</span>
                        <span className="text-sm font-black text-slate-900 font-mono-num">
                          {formatCurrency(topRes.fuelCostUSD)}
                        </span>
                        <span className="text-[10px] text-slate-600 block mt-0.5 font-medium">
                          VLSFO consumption
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-700 uppercase block">Port Dues</span>
                        <span className="text-sm font-black text-slate-900 font-mono-num">
                          {formatCurrency(topRes.portCostUSD)}
                        </span>
                        <span className="text-[10px] text-slate-600 block mt-0.5 font-medium">
                          Discharge handling
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Vessel Class Feasibility Comparison Table */}
              <div className="manzil-glass-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-mono font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-2">
                    <Ship className="w-4 h-4 text-teal-600" />
                    <span>Vessel Feasibility & Cost Matrix</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-700 font-semibold">Class Comparison</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs font-sans">
                    <thead className="bg-slate-100/90 text-slate-700 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-3">Vessel Class</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Shipments</th>
                        <th className="p-3">Rate / MT</th>
                        <th className="p-3">Total Cost</th>
                        <th className="p-3">Draft & Clearance Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {recommendation.feasibilityResults.map((res) => {
                        const isRec = res.vesselClass.name === recommendation.recommendedVesselClass;
                        return (
                          <tr
                            key={res.vesselClass.id}
                            onClick={() => setActiveFeasibilityModal(res)}
                            className={`hover:bg-teal-50/60 cursor-pointer transition-colors duration-150 ${
                              isRec ? 'bg-teal-50/60' : ''
                            }`}
                          >
                            <td className="p-3 font-bold text-slate-900">
                              <div className="flex items-center gap-1.5">
                                <span>{res.vesselClass.name}</span>
                                {isRec && (
                                  <span className="text-[9px] uppercase font-mono font-extrabold bg-teal-600 text-white px-1.5 py-0.5 rounded">
                                    Top Pick
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 font-mono">
                              {res.isFeasible ? (
                                <span className="badge-emerald px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Compatible
                                </span>
                              ) : (
                                <span className="badge-rose px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                                  <XCircle className="w-3 h-3 text-rose-600" /> Incompatible
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-900">{res.numberOfVoyages}</td>
                            <td className="p-3 font-mono-num font-bold text-amber-800">
                              {formatRatePerMT(res.estimatedFreightRateUSDPerMT)}
                            </td>
                            <td className="p-3 font-mono-num font-bold text-slate-900">
                              {formatTotalCostShort(res.totalCostUSD)}
                            </td>
                            <td className="p-3 text-[11px] font-mono leading-tight text-slate-600 max-w-xs font-medium">
                              {res.isFeasible
                                ? `Fits draft (${res.vesselClass.typicalDraftM}m) & LOA (${res.vesselClass.typicalLOAM}m).`
                                : res.rejectionReasons[0]}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="manzil-glass-card p-12 text-center space-y-3">
              <Ship className="w-12 h-12 text-teal-600 mx-auto animate-pulse" />
              <h3 className="text-base font-bold text-slate-900 font-['ABC_Diatype']">Ready to Calculate Voyage Recommendation</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto font-mono font-medium">
                Select a preset route or adjust cargo parameters to calculate vessel compatibility and cost breakdown in {currency}.
              </p>
            </div>
          )}
        </ScrollReveal>
      </div>

      {/* FEASIBILITY MODAL */}
      {activeFeasibilityModal && (
        <DetailModal
          isOpen={!!activeFeasibilityModal}
          onClose={() => setActiveFeasibilityModal(null)}
          title={`${activeFeasibilityModal.vesselClass.name} Feasibility Profile`}
          subtitle={`Capacity: ${activeFeasibilityModal.vesselClass.capacityMinMT / 1000}k-${activeFeasibilityModal.vesselClass.capacityMaxMT / 1000}k MT DWT`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
              <span className="text-[10px] text-teal-800 font-bold uppercase">Compatibility Result</span>
              <div className="font-bold text-slate-900 text-sm">
                {activeFeasibilityModal.isFeasible ? 'Compatible with Terminal Draft' : 'Incompatible Restriction'}
              </div>
              <div className="text-[11px] text-slate-700 font-sans">
                {activeFeasibilityModal.isFeasible
                  ? 'All channel depth and LOA berth requirements satisfied.'
                  : activeFeasibilityModal.rejectionReasons.join(', ')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Rate / MT</span>
                <span className="font-mono-num font-black text-amber-800 text-sm">
                  {formatRatePerMT(activeFeasibilityModal.estimatedFreightRateUSDPerMT)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Total Voyage Cost</span>
                <span className="font-mono-num font-black text-slate-900 text-sm">
                  {formatTotalCostShort(activeFeasibilityModal.totalCostUSD)}
                </span>
              </div>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
};

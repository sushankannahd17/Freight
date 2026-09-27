import React, { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { ManzilLogo } from '../components/common/ManzilLogo';
import { useApp } from '../context/AppContext';
import { ROUTES, PORTS } from '../data/mockData';
import { generateFreightForecast } from '../services/freightForecastService';
import {
  CountUp,
  ScrollReveal,
  StaggerContainer,
  SectionHeader,
  FloatingElement,
  PulseIndicator,
  DetailModal,
} from '../components/common/AnimationSystem';

const InteractiveGlobe = lazy(() =>
  import('../components/home/InteractiveGlobe').then((m) => ({ default: m.InteractiveGlobe }))
);

const GlobeFallback: React.FC = () => (
  <div className="relative w-full h-[540px] md:h-[620px] rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xs flex flex-col items-center justify-center p-6 space-y-4">
    <div className="relative w-28 h-28 rounded-full border border-teal-500/20 flex items-center justify-center animate-pulse">
      <div className="w-20 h-20 rounded-full border border-teal-600/40 border-t-teal-600 animate-spin" />
      <span className="absolute w-3 h-3 rounded-full bg-teal-600 shadow-xs" />
    </div>
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-teal-800">
        INITIALIZING 3D EARTH ENGINE
      </span>
      <span className="text-[10px] text-slate-600 font-mono">
        Loading WebGL Shaders & Geospatial Corridors...
      </span>
    </div>
  </div>
);

import {
  ArrowRight,
  TrendingUp,
  Ship,
  Anchor,
  Layers,
  Compass,
  Database,
  Zap,
  Clock,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currency, formatRatePerMT, formatTotalCostShort } = useApp();
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-aus-paradip');
  const [selectedOppModal, setSelectedOppModal] = useState<any | null>(null);

  const forecastResponse = generateFreightForecast(selectedRouteId);

  const sampleOpportunities = [
    {
      id: 'opp-1',
      routeCode: 'AUS ➔ PDP',
      originCode: 'BNE',
      destCode: 'PDP',
      route: 'Australia (Newcastle) → Paradip',
      cargo: 'Coking Coal',
      quantityMT: 75000,
      vesselClass: 'Capesize',
      rateUSD: 18.60,
      transitDays: 14,
      vesselCount: 12,
      portStatus: 'Normal (16.0m)',
      statusClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold',
      laycanWindow: '05 Oct – 12 Oct 2026',
      vesselName: 'MV PACIFIC PIONEER',
      draftReq: '16.2m Channel Depth Verified',
    },
    {
      id: 'opp-2',
      routeCode: 'IDN ➔ VZG',
      originCode: 'SRD',
      destCode: 'VZG',
      route: 'Indonesia (Samarinda) → Visakhapatnam',
      cargo: 'Thermal Coal',
      quantityMT: 60000,
      vesselClass: 'Panamax',
      rateUSD: 12.40,
      transitDays: 7,
      vesselCount: 8,
      portStatus: 'Normal (16.5m)',
      statusClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold',
      laycanWindow: '01 Oct – 07 Oct 2026',
      vesselName: 'MV OCEAN TRADER',
      draftReq: '14.1m Deepwater Berth Clear',
    },
    {
      id: 'opp-3',
      routeCode: 'MOZ ➔ GGV',
      originCode: 'MPM',
      destCode: 'GGV',
      route: 'Mozambique (Maputo) → Gangavaram',
      cargo: 'Coking Coal',
      quantityMT: 55000,
      vesselClass: 'Supramax',
      rateUSD: 22.10,
      transitDays: 12,
      vesselCount: 5,
      portStatus: 'Watch (19.5m)',
      statusClass: 'bg-amber-50 text-amber-800 border border-amber-200 font-bold',
      laycanWindow: '08 Oct – 15 Oct 2026',
      vesselName: 'MV EASTERN SPLENDOR',
      draftReq: '12.8m Channel Clearance Watch',
    },
    {
      id: 'opp-4',
      routeCode: 'RUS ➔ DHM',
      originCode: 'VOS',
      destCode: 'DHM',
      route: 'Russia (Vostochny) → Dhamra',
      cargo: 'Coking Coal',
      quantityMT: 70000,
      vesselClass: 'Panamax',
      rateUSD: 24.50,
      transitDays: 11,
      vesselCount: 6,
      portStatus: 'Normal (18.0m)',
      statusClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold',
      laycanWindow: '03 Oct – 10 Oct 2026',
      vesselName: 'MV BENGAL HORIZON',
      draftReq: '15.0m Deep Berth Clear',
    },
  ];

  return (
    <div className="space-y-12 pb-20 text-slate-900 font-sans">
      {/* INFINITE MARQUEE STRIP */}
      {/* 01 — CINEMATIC HERO EXPERIENCE */}
      <section className="relative min-h-[82vh] flex flex-col justify-between p-6 sm:p-10 rounded-3xl manzil-glass-panel border border-slate-200 shadow-sm overflow-hidden">
        {/* Animated Background Grid & Gradients */}
        <div className="absolute inset-0 maritime-grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Floating Live Telemetry Badges */}
        <div className="absolute top-6 right-6 hidden xl:flex flex-col gap-3 pointer-events-none z-20">
          <FloatingElement durationSec={4} offsetPx={4}>
            <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-md flex items-center gap-2.5 text-xs font-mono">
              <PulseIndicator label="LIVE AIS" />
              <span className="font-bold text-slate-900">126 Vessels Tracked</span>
            </div>
          </FloatingElement>

          <FloatingElement durationSec={5} offsetPx={-5}>
            <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-md flex items-center gap-2.5 text-xs font-mono">
              <Anchor className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-bold text-slate-900">11 East Coast Ports</span>
            </div>
          </FloatingElement>
        </div>

        {/* Hero Top Tag + Headlines with Staggered ScrollReveal */}
        <div className="relative z-10 max-w-3xl space-y-6 pt-2">
          <ScrollReveal animation="fade-down" delayMs={50}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-[11px] font-mono font-bold text-teal-800 uppercase tracking-widest shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              <span>GLOBAL MARITIME FREIGHT TERMINAL</span>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delayMs={150}>
            <div className="space-y-3">
              <ManzilLogo size="lg" showTagline={false} />
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.08] font-['Syne']">
                Predict the Market. <br />
                <span className="text-teal-700">
                  Chart the Voyage.
                </span>
              </h1>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delayMs={250}>
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl">
              Precision dry bulk freight analytics, channel depth validation, and vessel chartering intelligence tailored for East Coast India trade corridors.
            </p>
          </ScrollReveal>

          {/* Action CTAs */}
          <ScrollReveal animation="fade-up" delayMs={350}>
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => navigate('/planner')}
                className="btn-manzil-teal text-xs uppercase tracking-wider flex items-center gap-2.5 px-6 py-3.5 shadow-md group cursor-pointer"
              >
                <Compass className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                <span>EXPLORE VOYAGE PLANNER</span>
              </button>
              <button
                onClick={() => navigate('/market')}
                className="btn-manzil-secondary text-xs uppercase tracking-wider flex items-center gap-2.5 px-6 py-3.5 group cursor-pointer"
              >
                <TrendingUp className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
                <span>VIEW FREIGHT TERMINAL</span>
              </button>
            </div>
          </ScrollReveal>
        </div>

        {/* Hero Footer Corridor Telemetry Status Bar */}
        <ScrollReveal animation="fade-up" delayMs={450}>
          <div className="relative z-10 mt-10 pt-6 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 text-xs text-slate-600 font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full md:w-auto">
              <div className="space-y-1">
                <span className="text-slate-700 block text-xs font-mono font-bold uppercase tracking-wider">Monitored Corridors</span>
                <span className="text-slate-900 font-bold text-base block">Australia • Indonesia • Mozambique • Russia → India</span>
                <span className="text-slate-600 text-xs block font-medium">Key Bulk Trade Corridors</span>
              </div>
              <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-6">
                <span className="text-slate-700 block text-xs font-mono font-bold uppercase tracking-wider">East Coast Ports</span>
                <span className="text-slate-900 font-bold text-base block">Paradip • Visakhapatnam • Dhamra • Gangavaram • Haldia</span>
                <span className="text-slate-600 text-xs block font-medium">Discharge Terminals & Draft Channels</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 shrink-0 self-start md:self-auto shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-teal-800 font-bold text-xs">3D Earth Engine Active</span>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* AUTO-SCROLLING REAL-TIME SPOT RATE DATA CARDS STRIP */}

      {/* 02 — PROGRESSIVE MARKET SIGNALS WORKFLOW */}
      <section className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-xs">
        <SectionHeader
          eyebrow="Integrated Intelligence Pipeline"
          title="Comprehensive Maritime Freight Terminal"
          subtitle="Navigate modules seamlessly across spot freight forecasting, open tonnage AIS tracking, and port draft validation."
        />

        <StaggerContainer staggerDelayMs={70} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
          <div
            onClick={() => navigate('/market')}
            className="manzil-glass-card p-4 space-y-2 cursor-pointer group hover:border-teal-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-teal-700">01 FREIGHT</span>
              <TrendingUp className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Spot & Forward</h3>
            <p className="text-xs text-slate-600 leading-snug font-medium">Capesize, Panamax & Supramax rate projections.</p>
          </div>

          <div
            onClick={() => navigate('/vessels')}
            className="manzil-glass-card p-4 space-y-2 cursor-pointer group hover:border-sky-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-sky-700">02 VESSELS</span>
              <Ship className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Open Tonnage</h3>
            <p className="text-xs text-slate-600 leading-snug font-medium">126 bulk carriers tracked across Indian Ocean laycans.</p>
          </div>

          <div
            onClick={() => navigate('/ports')}
            className="manzil-glass-card p-4 space-y-2 cursor-pointer group hover:border-amber-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-700">03 PORTS</span>
              <Anchor className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Draft & Berths</h3>
            <p className="text-xs text-slate-600 leading-snug font-medium">PDP, VZG, DHM & HAL channel clearance monitoring.</p>
          </div>

          <div
            onClick={() => navigate('/live-map')}
            className="manzil-glass-card p-4 space-y-2 cursor-pointer group hover:border-emerald-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-700">04 MAP</span>
              <Compass className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Live Map</h3>
            <p className="text-xs text-slate-600 leading-snug font-medium">MapLibre bathymetry layers & AIS vessel telemetry.</p>
          </div>

          <div
            onClick={() => navigate('/scenarios')}
            className="manzil-glass-card p-4 space-y-2 cursor-pointer group hover:border-teal-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-teal-700">05 SCENARIOS</span>
              <Zap className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">What-If Engine</h3>
            <p className="text-xs text-slate-600 leading-snug font-medium">Sensitivity modeling for fuel prices & demurrage costs.</p>
          </div>
        </StaggerContainer>
      </section>

      {/* 03 — REAL-TIME MARKET HIGHLIGHT KPI CARDS WITH COUNT-UP NUMBERS */}
      <StaggerContainer staggerDelayMs={100} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="manzil-kpi-box space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
            <span>AUS ➔ IND (Coking Coal)</span>
            <span className="text-emerald-700 font-bold">↑ +4.8%</span>
          </div>
          <div className="text-2xl font-mono-num font-black text-slate-900">
            $<CountUp end={18.60} decimals={2} /> / MT
          </div>
          <div className="text-[11px] text-slate-600 font-medium">Capesize baseline spot rate</div>
        </div>

        <div className="manzil-kpi-box space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
            <span>IDN ➔ IND (Thermal Coal)</span>
            <span className="text-slate-600 font-bold">0.0%</span>
          </div>
          <div className="text-2xl font-mono-num font-black text-teal-800">
            $<CountUp end={12.40} decimals={2} /> / MT
          </div>
          <div className="text-[11px] text-slate-600 font-medium">Panamax 60k MT corridor</div>
        </div>

        <div className="manzil-kpi-box space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
            <span>Prompt Open Tonnage</span>
            <Ship className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-mono-num font-black text-slate-900">
            <CountUp end={126} /> Vessels
          </div>
          <div className="text-[11px] text-emerald-700 font-bold">↑ Prompt laycan availability</div>
        </div>

        <div className="manzil-kpi-box space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
            <span>East Coast Port Status</span>
            <Anchor className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-mono-num font-black text-slate-900">
            <CountUp end={11} /> Terminals
          </div>
          <div className="text-[11px] text-amber-800 font-bold">HAL 8.5m draft restriction</div>
        </div>
      </StaggerContainer>

      {/* 04 — MAIN FEATURE GRID: Freight Rate Analytics (Left) + Preserved 3D Interactive Globe (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Freight Rate Analytics Chart */}
        <ScrollReveal animation="fade-right" className="lg:col-span-6 manzil-glass-card p-6 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-700 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>Freight Rate Predictive Model</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Historical Rates vs 6-Month Forecast
              </h2>
            </div>

            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="manzil-select text-xs font-bold cursor-pointer"
            >
              {ROUTES.map((r) => {
                const o = PORTS.find((p) => p.id === r.originPortId);
                const d = PORTS.find((p) => p.id === r.destinationPortId);
                return (
                  <option key={r.id} value={r.id} className="bg-white text-slate-900">
                    {o?.name} → {d?.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Recharts Component */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastResponse.combinedSeries} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} unit=" $" domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '12px', color: '#0F172A', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(val: any, name: any) => [`$${Number(val).toFixed(2)} / MT`, name]}
                />
                <Area type="monotone" dataKey="upperBound95" stroke="none" fill="#0D9488" fillOpacity={0.12} name="Upper Interval" />
                <Line type="monotone" dataKey="baselineRate" stroke="#0D9488" strokeWidth={2.5} dot={false} name="Freight Projection" isAnimationActive={true} animationDuration={1000} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-200 font-mono font-medium">
            <span>Baseline Spot: ${forecastResponse.marketSummary.currentRateUSDPerMT.toFixed(2)}/MT</span>
            <span className="text-teal-700 font-bold">Trend: {forecastResponse.marketSummary.trendDirection}</span>
          </div>
        </ScrollReveal>

        {/* Right Column: PRESERVED 3D Geospatial Interactive Globe */}
        <ScrollReveal animation="fade-left" className="lg:col-span-6 manzil-glass-card p-4 flex flex-col justify-between min-h-[440px]">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 px-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-700 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Global Maritime Trade Network</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600 font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>3D Earth Engine</span>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[350px] pt-2">
            <Suspense fallback={<GlobeFallback />}>
              <InteractiveGlobe />
            </Suspense>
          </div>
        </ScrollReveal>
      </div>

      {/* 05 — ACTIVE VOYAGE CHARTER OPPORTUNITIES MATRIX */}
      <ScrollReveal animation="fade-up">
        <div className="manzil-glass-card p-6 space-y-4">
          <SectionHeader
            eyebrow="Chartering Opportunities"
            title={`Active Voyage Opportunities (${currency})`}
            subtitle="Click any corridor row to inspect laycan windows, vessel specs, and channel draft clearance."
            action={
              <button
                onClick={() => navigate('/portfolio')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 font-mono shrink-0 cursor-pointer"
              >
                <span>Compare Voyage Portfolio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            }
          />

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/90 text-slate-700 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3">Corridor</th>
                  <th className="p-3">Cargo Spec</th>
                  <th className="p-3">Vessel Class</th>
                  <th className="p-3">Est. Freight / MT</th>
                  <th className="p-3">Est. Total Cost ({currency})</th>
                  <th className="p-3">Transit</th>
                  <th className="p-3">Open Vessels</th>
                  <th className="p-3">Port Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {sampleOpportunities.map((opp) => (
                  <tr
                    key={opp.id}
                    onClick={() => setSelectedOppModal(opp)}
                    className="hover:bg-teal-50/60 cursor-pointer transition-colors group"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                          {opp.routeCode}
                        </span>
                        <span className="font-bold text-slate-900 group-hover:text-teal-800 transition-colors">{opp.route}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-700">
                      {opp.cargo} ({opp.quantityMT.toLocaleString()} MT)
                    </td>
                    <td className="p-3 font-semibold text-teal-700">{opp.vesselClass}</td>
                    <td className="p-3 font-mono-num font-bold text-amber-800">{formatRatePerMT(opp.rateUSD)}</td>
                    <td className="p-3 font-mono-num font-bold text-slate-900">{formatTotalCostShort(opp.rateUSD * opp.quantityMT)}</td>
                    <td className="p-3 font-mono text-slate-600">{opp.transitDays} Days</td>
                    <td className="p-3 font-mono font-bold text-sky-700">{opp.vesselCount} Open</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono ${opp.statusClass}`}>
                        {opp.portStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/planner');
                        }}
                        className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded transition text-[11px] shadow-2xs cursor-pointer"
                      >
                        Plan Voyage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>

      {/* 06 — MULTI-SOURCE INFRASTRUCTURE TRANSPARENCY */}
      <ScrollReveal animation="fade-up">
        <div className="manzil-glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-700 uppercase tracking-wider border-b border-slate-200 pb-3">
            <Database className="w-4 h-4 text-teal-600" />
            <span>Multi-Source Maritime Intelligence Infrastructure</span>
          </div>

          <StaggerContainer staggerDelayMs={80} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-emerald-300 transition">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                LIVE TELEMETRY
              </span>
              <h4 className="text-sm font-bold text-slate-900">AIS Vessel & Weather Feeds</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">AIS open position markers and Open-Meteo port weather telemetry.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-sky-300 transition">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-50 text-sky-800 border border-sky-200">
                HISTORICAL
              </span>
              <h4 className="text-sm font-bold text-slate-900">Freight Rate Time Series</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">Historical spot freight rate data across Capesize, Panamax & Supramax corridors.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-teal-300 transition">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200">
                FORECAST
              </span>
              <h4 className="text-sm font-bold text-slate-900">Predictive Trend Lines</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">Exponential smoothing algorithms projecting 6-month freight trends with confidence bands.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-amber-300 transition">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                MODELLED
              </span>
              <h4 className="text-sm font-bold text-slate-900">What-If Sensitivity Engine</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">Interactive sensitivity models simulating bunker fuel, demurrage & cargo shifts.</p>
            </div>
          </StaggerContainer>
        </div>
      </ScrollReveal>

      {/* 07 — BRAND MANDATE STATEMENT (CINEMATIC DARK CLOSING SECTION WITH MOTION) */}
      <ScrollReveal animation="zoom-in">
        <section className="relative py-16 px-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-6 shadow-xl overflow-hidden text-white">
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 maritime-grid-pattern opacity-10 pointer-events-none" />
          <div className="absolute inset-0 bg-radial from-teal-500/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold text-teal-400 uppercase tracking-widest block animate-pulse">
              THE MARITIME DECISION MANDATE
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight font-['Syne']">
              “THE MARKET MOVES. <br />
              <span className="text-slate-300">YOUR DECISION SHOULDN’T HAVE TO WAIT.”</span>
            </h2>
            <div className="pt-4 flex justify-center">
              <ManzilLogo size="lg" showTagline={true} />
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* VOYAGE DETAIL DRAWER MODAL */}
      {selectedOppModal && (
        <DetailModal
          isOpen={!!selectedOppModal}
          onClose={() => setSelectedOppModal(null)}
          title={selectedOppModal.route}
          subtitle={`Corridor Code: ${selectedOppModal.routeCode} • ${selectedOppModal.cargo}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
              <span className="text-[10px] text-teal-800 font-bold uppercase block">Nominated Vessel Spec</span>
              <div className="font-bold text-slate-900 text-sm">{selectedOppModal.vesselName} ({selectedOppModal.vesselClass})</div>
              <div className="text-[11px] text-slate-700 font-sans">{selectedOppModal.quantityMT.toLocaleString()} MT Bulk Cargo</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Spot Freight Rate</span>
                <span className="font-mono-num font-black text-amber-800 text-sm">{formatRatePerMT(selectedOppModal.rateUSD)}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Estimated Total</span>
                <span className="font-mono-num font-black text-slate-900 text-sm">
                  {formatTotalCostShort(selectedOppModal.rateUSD * selectedOppModal.quantityMT)}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-700 uppercase font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>Laycan Window & Draft Clearance</span>
              </span>
              <div className="text-slate-900 font-bold text-xs">{selectedOppModal.laycanWindow}</div>
              <div className="text-teal-800 text-[11px] flex items-center gap-1 font-sans mt-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{selectedOppModal.draftReq}</span>
              </div>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
};

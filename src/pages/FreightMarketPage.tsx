import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DatasetBadge } from '../components/common/DatasetBadge';
import {
  CountUp,
  ScrollReveal,
  StaggerContainer,
  DetailModal,
} from '../components/common/AnimationSystem';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Filter,
  Ship,
  Anchor,
  Zap,
  BarChart2,
} from 'lucide-react';

export const FreightMarketPage: React.FC = () => {
  const { currency, formatRatePerMT } = useApp();

  const [selectedRoute, setSelectedRoute] = useState('aus-india');
  const [selectedVessel, setSelectedVessel] = useState('Capesize');
  const [timeRange, setTimeRange] = useState('6M');
  const [activeCorridorModal, setActiveCorridorModal] = useState<any | null>(null);

  const chartData = [
    { date: 'May 2026', historical: 16.20, forecast: null, upper: null, lower: null },
    { date: 'Jun 2026', historical: 16.80, forecast: null, upper: null, lower: null },
    { date: 'Jul 2026', historical: 17.40, forecast: null, upper: null, lower: null },
    { date: 'Aug 2026', historical: 18.10, forecast: null, upper: null, lower: null },
    { date: 'Sep 2026 (Today)', historical: 18.60, forecast: 18.60, upper: 18.60, lower: 18.60 },
    { date: 'Oct 2026 (Fcst)', historical: null, forecast: 19.40, upper: 20.20, lower: 18.60 },
    { date: 'Nov 2026 (Fcst)', historical: null, forecast: 20.10, upper: 21.30, lower: 18.90 },
    { date: 'Dec 2026 (Fcst)', historical: null, forecast: 19.80, upper: 21.10, lower: 18.50 },
  ];

  const corridorSummaries = [
    {
      code: 'AUS ➔ PDP',
      route: 'Australia (Newcastle) → Paradip',
      vessel: 'Capesize (180k DWT)',
      commodity: 'Coking Coal',
      spotUSD: 18.60,
      monthlyDelta: '+4.8%',
      deltaPositive: true,
      portDraft: '16.0m Clearance',
      statusBadge: 'badge-emerald',
      laycan: '05 Oct - 12 Oct',
      typicalCargo: '75,000 MT Coking Coal',
    },
    {
      code: 'IDN ➔ VZG',
      route: 'Indonesia (Samarinda) → Visakhapatnam',
      vessel: 'Panamax (75k DWT)',
      commodity: 'Thermal Coal',
      spotUSD: 12.40,
      monthlyDelta: '0.0%',
      deltaPositive: true,
      portDraft: '16.5m Deepwater',
      statusBadge: 'badge-sky',
      laycan: '01 Oct - 07 Oct',
      typicalCargo: '60,000 MT Thermal Coal',
    },
    {
      code: 'MOZ ➔ GGV',
      route: 'Mozambique (Maputo) → Gangavaram',
      vessel: 'Supramax (58k DWT)',
      commodity: 'Coking Coal',
      spotUSD: 22.10,
      monthlyDelta: '+2.3%',
      deltaPositive: true,
      portDraft: '19.5m Channel',
      statusBadge: 'badge-amber',
      laycan: '08 Oct - 15 Oct',
      typicalCargo: '55,000 MT Coking Coal',
    },
    {
      code: 'RUS ➔ DHM',
      route: 'Russia (Vostochny) → Dhamra',
      vessel: 'Panamax (75k DWT)',
      commodity: 'PCI / Coal',
      spotUSD: 24.50,
      monthlyDelta: '-1.2%',
      deltaPositive: false,
      portDraft: '18.0m Berth',
      statusBadge: 'badge-emerald',
      laycan: '03 Oct - 10 Oct',
      typicalCargo: '70,000 MT PCI Coal',
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-900">
      {/* Top Terminal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>MARITIME FREIGHT TERMINAL</span>
            </span>
            <DatasetBadge />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['Syne'] mt-1">
            Global Dry Bulk Freight Market Analytics
          </h1>
        </div>

        {/* Time Period Controls */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
          {['1M', '3M', '6M', '1Y', '3Y', 'ALL'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeRange === t
                  ? 'bg-teal-600 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Analytical Filter Controls Bar */}
      <div className="manzil-glass-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        <div>
          <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-teal-600" />
            <span>Trade Corridor Route</span>
          </label>
          <select
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            className="w-full manzil-select cursor-pointer"
          >
            <option value="aus-india">Australia → East Coast India (Coking Coal)</option>
            <option value="indo-india">Indonesia → East Coast India (Thermal Coal)</option>
            <option value="moz-india">Mozambique → East Coast India (Coking Coal)</option>
            <option value="rus-india">Russia → East Coast India (PCI / Coal)</option>
            <option value="usa-india">USA → East Coast India (High-Vol Coal)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <Ship className="w-3 h-3 text-sky-600" />
            <span>Vessel Class</span>
          </label>
          <select
            value={selectedVessel}
            onChange={(e) => setSelectedVessel(e.target.value)}
            className="w-full manzil-select cursor-pointer"
          >
            <option value="Capesize">Capesize (150,000 - 180,000 DWT)</option>
            <option value="Panamax">Panamax (65,000 - 82,000 DWT)</option>
            <option value="Supramax">Supramax (50,000 - 64,000 DWT)</option>
            <option value="Handysize">Handysize (25,000 - 39,000 DWT)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <BarChart2 className="w-3 h-3 text-emerald-600" />
            <span>Cargo Commodity</span>
          </label>
          <select className="w-full manzil-select cursor-pointer">
            <option value="Coal">Coking / Thermal Coal</option>
            <option value="Iron Ore">Iron Ore Fines / Pellets</option>
            <option value="Limestone">Limestone / Dolomite</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-mono font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <Anchor className="w-3 h-3 text-amber-600" />
            <span>Discharge Port</span>
          </label>
          <select className="w-full manzil-select cursor-pointer">
            <option value="all">All East Coast Ports</option>
            <option value="paradip">Paradip Port (16.0m)</option>
            <option value="vizag">Visakhapatnam Port (16.5m)</option>
            <option value="dhamra">Dhamra Port (18.0m)</option>
            <option value="gangavaram">Gangavaram Port (19.5m)</option>
          </select>
        </div>
      </div>

      {/* Terminal KPI Highlight Strip with CountUp */}
      <StaggerContainer staggerDelayMs={80} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="manzil-kpi-box space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
            <span>Benchmark Spot Rate</span>
            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.3%
            </span>
          </div>
          <div className="text-2xl font-mono-num font-black text-slate-900">
            $<CountUp end={18.60} decimals={2} /> / MT
          </div>
          <div className="text-[11px] text-slate-600 font-mono font-medium">Australia ➔ Paradip Capesize</div>
        </div>

        <div className="manzil-kpi-box space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
            <span>6-Month Forward Projection</span>
            <span className="text-sky-700 font-bold">+6.5%</span>
          </div>
          <div className="text-2xl font-mono-num font-black text-teal-800">
            $<CountUp end={19.80} decimals={2} /> / MT
          </div>
          <div className="text-[11px] text-slate-600 font-mono font-medium">Q4 2026 Modelled Baseline</div>
        </div>

        <div className="manzil-kpi-box space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
            <span>Tonnage Availability</span>
            <Ship className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-mono-num font-black text-slate-900">
            <CountUp end={126} /> Vessels
          </div>
          <div className="text-[11px] text-emerald-700 font-bold">↑ Prompt laycan positions</div>
        </div>

        <div className="manzil-kpi-box space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider">
            <span>Port Draft Bottleneck</span>
            <Anchor className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-mono-num font-black text-slate-900">
            HAL 8.5m Restrict
          </div>
          <div className="text-[11px] text-amber-800 font-bold">⚠️ Hooghly siltation alert</div>
        </div>
      </StaggerContainer>

      {/* Main Interactive Freight Rate Chart Card */}
      <ScrollReveal animation="fade-up">
        <div className="manzil-glass-card p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-wider">
                  Spot Fixture History vs 90-Day ML Projection
                </span>
                <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Verified Output
                </span>
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono-num mt-1 flex items-center gap-3">
                <span>{formatRatePerMT(18.60)}</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 font-sans">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +4.3% this month
                </span>
              </div>
            </div>

            {/* Clean Analytical Legend */}
            <div className="flex items-center gap-5 text-xs font-mono text-slate-700 font-semibold flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-600 shadow-2xs" />
                <span>Historical Fixture Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-600 shadow-2xs" />
                <span>Predictive Forecast</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3 bg-sky-100 border border-sky-300 rounded" />
                <span>Confidence Band (±5.4%)</span>
              </div>
            </div>
          </div>

          {/* Recharts Clean Analytical Line Chart */}
          <div className="h-[360px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 15, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  stroke="#64748B"
                  tick={{ fill: '#334155', fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 600 }}
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fill: '#334155', fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 600 }}
                  domain={['auto', 'auto']}
                  unit=" $"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    borderRadius: '12px',
                    color: '#0F172A',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any) => [`$${Number(val).toFixed(2)} / MT`, 'Freight Rate']}
                />
                <ReferenceLine
                  x="Sep 2026 (Today)"
                  stroke="#0D9488"
                  strokeDasharray="3 3"
                  label={{ value: 'Today (Spot Basis)', fill: '#0D9488', fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 700 }}
                />

                <Area type="monotone" dataKey="upper" stroke="none" fill="#0284C7" fillOpacity={0.12} name="Confidence Upper" />
                <Line type="monotone" dataKey="historical" stroke="#0D9488" strokeWidth={3} dot={{ r: 4, fill: '#0D9488' }} name="Historical Rate" isAnimationActive={true} animationDuration={1000} />
                <Line type="monotone" dataKey="forecast" stroke="#0284C7" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: '#0284C7' }} name="Forecast Rate" isAnimationActive={true} animationDuration={1200} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Machine Learning Signal Insight Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5 font-mono text-[11px]">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Model Market Signal (ML Output)</span>
              </span>
              <span className="text-[10px] text-slate-700 font-mono font-bold">Confidence: 89.4%</span>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">
              Freight rates on the <strong>Australia ➔ East Coast India</strong> corridor show persistent upward momentum for Q4 2026. Capesize tonnage in the Pacific basin remains constrained, alongside steady coking coal import demand from Paradip and Visakhapatnam steel production hubs.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Trade Corridor Analytical Breakdown Table */}
      <ScrollReveal animation="fade-up">
        <div className="manzil-glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-600" />
              <span>Active Corridor Freight Benchmarks</span>
            </h2>
            <span className="text-xs font-mono text-slate-700 font-semibold">Values in {currency}</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead className="bg-slate-100/90 text-slate-700 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3">Corridor</th>
                  <th className="p-3">Route Description</th>
                  <th className="p-3">Vessel Class</th>
                  <th className="p-3">Commodity</th>
                  <th className="p-3">Benchmark Rate</th>
                  <th className="p-3">Monthly Shift</th>
                  <th className="p-3">Port Clearance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {corridorSummaries.map((c, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setActiveCorridorModal(c)}
                    className="hover:bg-teal-50/60 cursor-pointer transition-colors duration-150"
                  >
                    <td className="p-3 font-mono font-bold">
                      <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        {c.code}
                      </span>
                    </td>
                    <td className="p-3 text-slate-900 font-bold">{c.route}</td>
                    <td className="p-3 text-slate-700">{c.vessel}</td>
                    <td className="p-3 text-slate-700">{c.commodity}</td>
                    <td className="p-3 font-mono-num font-bold text-slate-900">{formatRatePerMT(c.spotUSD)}</td>
                    <td className="p-3 font-mono font-bold">
                      <span className={c.deltaPositive ? 'text-emerald-700' : 'text-rose-700'}>
                        {c.monthlyDelta}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] ${c.statusBadge}`}>
                        {c.portDraft}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>

      {/* CORRIDOR DETAIL MODAL */}
      {activeCorridorModal && (
        <DetailModal
          isOpen={!!activeCorridorModal}
          onClose={() => setActiveCorridorModal(null)}
          title={activeCorridorModal.route}
          subtitle={`Benchmark Rate: $${activeCorridorModal.spotUSD}/MT • ${activeCorridorModal.vessel}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
              <span className="text-[10px] text-teal-800 font-bold uppercase">Corridor Specs</span>
              <div className="font-bold text-slate-900 text-sm">{activeCorridorModal.typicalCargo}</div>
              <div className="text-[11px] text-slate-700 font-sans">Laycan: {activeCorridorModal.laycan}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Spot Rate</span>
                <span className="font-mono-num font-black text-amber-800 text-sm">${activeCorridorModal.spotUSD}/MT</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Shift</span>
                <span className="font-mono-num font-black text-emerald-800 text-sm">{activeCorridorModal.monthlyDelta}</span>
              </div>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
};

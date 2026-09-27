import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DatasetBadge } from '../components/common/DatasetBadge';
import {
  ScrollReveal,
  StaggerContainer,
} from '../components/common/AnimationSystem';
import {
  Sliders,
  RefreshCcw,
  Zap,
  BarChart3,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

export const ScenarioAnalysisPage: React.FC = () => {
  const { currency, formatCurrency, formatRatePerMT, formatTotalCostShort } = useApp();

  // Simulation Slider & Input States
  const [freightShiftPct, setFreightShiftPct] = useState<number>(0);
  const [fuelPriceUSD, setFuelPriceUSD] = useState<number>(650);
  const [cargoVolumeMT, setCargoVolumeMT] = useState<number>(75000);
  const [congestionDays, setCongestionDays] = useState<number>(2);
  const [weatherDelayDays, setWeatherDelayDays] = useState<number>(1);
  const [commodityPriceUSD, setCommodityPriceUSD] = useState<number>(210);

  // Baseline Constants (Explicitly Marked LIVE / HISTORICAL)
  const spotBaseRateUSD = 18.60;
  const baseFuelPriceUSD = 650;
  const baseVolumeMT = 75000;
  const baseCaseTotalCostUSD = 1400000;

  // Modelled Calculations (Explicitly Marked MODELLED / SIMULATED)
  const simulatedRateUSD = spotBaseRateUSD * (1 + freightShiftPct / 100);
  const simulatedFreightCostUSD = cargoVolumeMT * simulatedRateUSD;

  // Bunker Fuel Consumption Model (~28 MT/day for Panamax/Capesize avg)
  const baseFuelCostUSD = (cargoVolumeMT / baseVolumeMT) * 280000;
  const simulatedFuelCostUSD = (fuelPriceUSD / baseFuelPriceUSD) * baseFuelCostUSD;

  // Port Demurrage ($18,000 / day) & Weather Standby ($12,000 / day)
  const portDemurrageCostUSD = congestionDays * 18000;
  const weatherDelayCostUSD = weatherDelayDays * 12000;

  const simulatedCharterCostUSD =
    simulatedFreightCostUSD +
    simulatedFuelCostUSD +
    portDemurrageCostUSD +
    weatherDelayCostUSD;

  const deltaCostUSD = simulatedCharterCostUSD - baseCaseTotalCostUSD;
  const deltaPct = ((deltaCostUSD / baseCaseTotalCostUSD) * 100).toFixed(1);

  // High Stress Scenario (+25% freight, $850 fuel, 5d congestion)
  const highStressCostUSD =
    cargoVolumeMT * (spotBaseRateUSD * 1.25) +
    (850 / 650) * baseFuelCostUSD +
    5 * 18000 +
    2 * 12000;

  const handleReset = () => {
    setFreightShiftPct(0);
    setFuelPriceUSD(650);
    setCargoVolumeMT(75000);
    setCongestionDays(2);
    setWeatherDelayDays(1);
    setCommodityPriceUSD(210);
  };

  // Chart Data for Side-by-Side Comparison
  const chartData = [
    { name: 'Base Case (Live Spot)', cost: baseCaseTotalCostUSD, type: 'LIVE' },
    { name: 'Simulated Model', cost: simulatedCharterCostUSD, type: 'MODELLED' },
    { name: 'Stress Test (+25%)', cost: highStressCostUSD, type: 'ESTIMATED' },
  ];

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-900 animate-in fade-in duration-300">
      {/* Top Terminal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-teal-600" />
              <span>WHAT-IF SENSITIVITY & SCENARIO SIMULATOR</span>
            </span>
            <DatasetBadge />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['ABC_Diatype'] mt-1">
            Commercial Chartering Sensitivity & Stress Testing
          </h1>
        </div>

        <button
          onClick={handleReset}
          className="btn-manzil-secondary text-xs font-bold flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5 text-teal-600" />
          <span>Reset Simulation Defaults</span>
        </button>
      </div>

      {/* Data Classification Banner */}
      <ScrollReveal animation="fade-down">
        <div className="manzil-glass-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Info className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Analytical Governance: Clearly distinguishing real-time telemetry from mathematical simulations.</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              ● LIVE SPOT BASELINE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              ▲ MODELLED SIMULATION
            </span>
          </div>
        </div>
      </ScrollReveal>

      {/* Main Grid: Controls vs Output Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sensitivity Controls (5 cols) */}
        <ScrollReveal animation="fade-right" className="lg:col-span-5 manzil-glass-card p-6 space-y-6">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <h2 className="text-xs font-mono font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              <span>Sensitivity Variables Panel</span>
            </h2>
            <span className="badge-teal px-2 py-0.5 rounded text-[10px] font-mono">
              MODELLED INPUTS
            </span>
          </div>

          {/* Slider 1: Freight Rate Market Shift */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <span>Freight Rate Market Shift</span>
                <span className="text-[9px] font-mono font-bold bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded">
                  MODELLED
                </span>
              </span>
              <span className={`font-mono font-extrabold ${freightShiftPct >= 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                {freightShiftPct > 0 ? `+${freightShiftPct}%` : `${freightShiftPct}%`} ({formatRatePerMT(simulatedRateUSD)})
              </span>
            </div>
            <input
              type="range"
              min="-25"
              max="50"
              step="1"
              value={freightShiftPct}
              onChange={(e) => setFreightShiftPct(Number(e.target.value))}
              className="w-full accent-teal-600 bg-slate-200 h-2 rounded-lg cursor-pointer border border-slate-300"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-600 font-medium">
              <span>-25% (Soft Market)</span>
              <span>Baseline: {formatRatePerMT(spotBaseRateUSD)}</span>
              <span>+50% (Tight Market)</span>
            </div>
          </div>

          {/* Slider 2: VLSFO Bunker Fuel Price */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <span>VLSFO Bunker Fuel Price</span>
                <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                  ESTIMATED
                </span>
              </span>
              <span className="text-teal-700 font-mono font-extrabold">${fuelPriceUSD} / MT</span>
            </div>
            <input
              type="range"
              min="450"
              max="950"
              step="10"
              value={fuelPriceUSD}
              onChange={(e) => setFuelPriceUSD(Number(e.target.value))}
              className="w-full accent-teal-600 bg-slate-200 h-2 rounded-lg cursor-pointer border border-slate-300"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-600 font-medium">
              <span>$450/MT</span>
              <span>Current Spot: $650/MT</span>
              <span>$950/MT</span>
            </div>
          </div>

          {/* Slider 3: Cargo Volume */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Simulated Cargo Quantity</span>
              <span className="text-slate-900 font-mono font-extrabold">{cargoVolumeMT.toLocaleString()} MT</span>
            </div>
            <input
              type="range"
              min="25000"
              max="180000"
              step="5000"
              value={cargoVolumeMT}
              onChange={(e) => setCargoVolumeMT(Number(e.target.value))}
              className="w-full accent-teal-600 bg-slate-200 h-2 rounded-lg cursor-pointer border border-slate-300"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-600 font-medium">
              <span>25,000 MT (Handy)</span>
              <span>75,000 MT (Panamax)</span>
              <span>180,000 MT (Cape)</span>
            </div>
          </div>

          {/* Slider 4: Port Congestion / Demurrage Days */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Port Discharge Delay (Demurrage)</span>
              <span className="text-amber-800 font-mono font-extrabold">{congestionDays} Days</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={congestionDays}
              onChange={(e) => setCongestionDays(Number(e.target.value))}
              className="w-full accent-teal-600 bg-slate-200 h-2 rounded-lg cursor-pointer border border-slate-300"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-600 font-medium">
              <span>0 Days (Clean Berth)</span>
              <span>Demurrage: $18,000/day</span>
              <span>10 Days Delay</span>
            </div>
          </div>

          {/* Slider 5: Weather Delay */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700">Monsoon Weather Delay Standby</span>
              <span className="text-sky-700 font-mono font-extrabold">{weatherDelayDays} Days</span>
            </div>
            <input
              type="range"
              min="0"
              max="7"
              step="1"
              value={weatherDelayDays}
              onChange={(e) => setWeatherDelayDays(Number(e.target.value))}
              className="w-full accent-teal-600 bg-slate-200 h-2 rounded-lg cursor-pointer border border-slate-300"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-600 font-medium">
              <span>0 Days</span>
              <span>Standby: $12,000/day</span>
              <span>7 Days (Cyclonic)</span>
            </div>
          </div>

          {/* Input 6: Coking Coal Commodity Price */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase">
              Commodity CIF Benchmark Price ($/MT)
            </label>
            <input
              type="number"
              value={commodityPriceUSD}
              onChange={(e) => setCommodityPriceUSD(Number(e.target.value))}
              className="w-full manzil-input font-mono-num text-xs"
            />
          </div>
        </ScrollReveal>

        {/* Right Column: Simulation Output Matrix & Charts (7 cols) */}
        <ScrollReveal animation="fade-left" className="lg:col-span-7 space-y-6">
          {/* Main Simulated Cost Hero Panel */}
          <div className="manzil-glass-panel p-6 space-y-5 border border-teal-300">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-teal-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-teal-600" />
                  <span>MODELLED SIMULATION COMMITMENT</span>
                </span>
                <h3 className="text-3xl font-black text-amber-800 font-mono-num mt-1">
                  {formatCurrency(simulatedCharterCostUSD)}
                </h3>
                <span className="text-xs font-bold text-slate-700 font-mono bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 inline-block mt-1">
                  {formatTotalCostShort(simulatedCharterCostUSD)} Total Estimated Expenditure
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono font-bold text-slate-700 uppercase block">Variance vs Live Spot Base Case</span>
                <div className={`text-2xl font-black font-mono-num ${deltaCostUSD >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {deltaCostUSD >= 0 ? `+${formatTotalCostShort(deltaCostUSD)}` : `-${formatTotalCostShort(Math.abs(deltaCostUSD))}`}
                </div>
                <span className={`text-xs font-mono font-bold ${deltaCostUSD >= 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  ({deltaCostUSD >= 0 ? `+${deltaPct}%` : `${deltaPct}%`})
                </span>
              </div>
            </div>

            {/* Itemized Cost Sensitivity Breakdown Grid */}
            <StaggerContainer staggerDelayMs={60} className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700 text-[10px] uppercase font-bold block">Simulated Freight</span>
                <span className="font-extrabold text-slate-900 text-sm font-mono-num">{formatTotalCostShort(simulatedFreightCostUSD)}</span>
                <span className="text-[10px] text-teal-700 block mt-0.5 font-bold">{formatRatePerMT(simulatedRateUSD)}/MT</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700 text-[10px] uppercase font-bold block">Bunker Fuel Cost</span>
                <span className="font-extrabold text-slate-900 text-sm font-mono-num">{formatTotalCostShort(simulatedFuelCostUSD)}</span>
                <span className="text-[10px] text-amber-800 block mt-0.5 font-bold">${fuelPriceUSD}/MT VLSFO</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700 text-[10px] uppercase font-bold block">Port Demurrage</span>
                <span className="font-extrabold text-slate-900 text-sm font-mono-num">{formatTotalCostShort(portDemurrageCostUSD)}</span>
                <span className="text-[10px] text-amber-800 block mt-0.5 font-bold">{congestionDays}d @ $18k/d</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-700 text-[10px] uppercase font-bold block">Weather Standby</span>
                <span className="font-extrabold text-slate-900 text-sm font-mono-num">{formatTotalCostShort(weatherDelayCostUSD)}</span>
                <span className="text-[10px] text-sky-700 block mt-0.5 font-bold">{weatherDelayDays}d @ $12k/d</span>
              </div>
            </StaggerContainer>
          </div>

          {/* Recharts Side-by-Side Comparison Chart */}
          <div className="manzil-glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-mono font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span>Scenario Comparison Chart ({currency})</span>
              </h3>
              <span className="text-xs font-mono text-slate-700 font-semibold">Side-by-Side Analytical Model</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }} />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}
                    tickFormatter={(val) => `$${(val / 1000000).toFixed(2)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#CBD5E1',
                      borderRadius: '12px',
                      color: '#0F172A',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Total Cost']}
                  />
                  <Bar dataKey="cost" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={1000}>
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index === 0 ? '#10b981' : index === 1 ? '#0d9488' : '#f59e0b'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-extrabold text-emerald-800 uppercase">BASE CASE</span>
                  <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    LIVE SPOT
                  </span>
                </div>
                <div className="text-base font-black text-slate-900 font-mono-num">{formatTotalCostShort(baseCaseTotalCostUSD)}</div>
                <div className="text-[10px] text-slate-600 font-mono font-medium">Spot Rate: {formatRatePerMT(spotBaseRateUSD)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-extrabold text-teal-800 uppercase">SIMULATED MODEL</span>
                  <span className="text-[9px] font-mono font-bold bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                    MODELLED
                  </span>
                </div>
                <div className="text-base font-black text-amber-800 font-mono-num">{formatTotalCostShort(simulatedCharterCostUSD)}</div>
                <div className="text-[10px] text-teal-700 font-mono font-bold">Model Rate: {formatRatePerMT(simulatedRateUSD)}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-extrabold text-amber-800 uppercase">STRESS CASE</span>
                  <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    ESTIMATED
                  </span>
                </div>
                <div className="text-base font-black text-amber-800 font-mono-num">{formatTotalCostShort(highStressCostUSD)}</div>
                <div className="text-[10px] text-amber-800 font-mono font-bold">Stress Rate: {formatRatePerMT(spotBaseRateUSD * 1.25)}</div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
};

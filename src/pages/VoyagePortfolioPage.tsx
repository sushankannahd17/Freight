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
  Layers,
  FileCheck,
  Ship,
  ArrowRight,
} from 'lucide-react';

interface PortfolioItem {
  id: string;
  code: string;
  route: string;
  cargo: string;
  quantityMT: number;
  vesselClass: string;
  freightRateUSD: number;
  estTotalCostUSD: number;
  transitDays: number;
  portRisk: 'Low' | 'Medium' | 'High';
  deliveryWindow: string;
}

const SAMPLE_PORTFOLIO: PortfolioItem[] = [
  {
    id: 'port-1',
    code: 'VYG-001',
    route: 'Australia (Newcastle) → Paradip',
    cargo: 'Coking Coal Bulk',
    quantityMT: 75000,
    vesselClass: 'Capesize (180k DWT)',
    freightRateUSD: 18.60,
    estTotalCostUSD: 1395000,
    transitDays: 14,
    portRisk: 'Low',
    deliveryWindow: '10 – 15 Oct 2026',
  },
  {
    id: 'port-2',
    code: 'VYG-002',
    route: 'Indonesia (Samarinda) → Visakhapatnam',
    cargo: 'Thermal Coal',
    quantityMT: 60000,
    vesselClass: 'Panamax (75k DWT)',
    freightRateUSD: 12.40,
    estTotalCostUSD: 744000,
    transitDays: 7,
    portRisk: 'Low',
    deliveryWindow: '01 – 06 Oct 2026',
  },
  {
    id: 'port-3',
    code: 'VYG-003',
    route: 'Mozambique (Maputo) → Gangavaram',
    cargo: 'Coking Coal Bulk',
    quantityMT: 55000,
    vesselClass: 'Supramax (58k DWT)',
    freightRateUSD: 22.10,
    estTotalCostUSD: 1215500,
    transitDays: 12,
    portRisk: 'Medium',
    deliveryWindow: '12 – 18 Oct 2026',
  },
];

export const VoyagePortfolioPage: React.FC = () => {
  const { currency, formatCurrency, formatRatePerMT, formatTotalCostShort } = useApp();
  const [activeTab, setActiveTab] = useState<'matrix' | 'approval'>('matrix');
  const [portfolio] = useState<PortfolioItem[]>(SAMPLE_PORTFOLIO);
  const [approvedStatus, setApprovedStatus] = useState<boolean>(false);
  const [activePortfolioModal, setActivePortfolioModal] = useState<PortfolioItem | null>(null);

  const totalQuantityMT = portfolio.reduce((acc, curr) => acc + curr.quantityMT, 0);
  const totalCostUSD = portfolio.reduce((acc, curr) => acc + curr.estTotalCostUSD, 0);
  const avgRateUSD = portfolio.length > 0 ? totalCostUSD / totalQuantityMT : 0;

  const handleApproveCharter = () => {
    setApprovedStatus(true);
  };

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-900 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>COMMERCIAL CHARTERING DECISION SUITE</span>
            </span>
            <DatasetBadge />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['ABC_Diatype'] mt-1">
            Voyage Portfolio Comparison & Approval Matrix
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold shrink-0">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Portfolio Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('approval')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'approval'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Charter Decision Approval</span>
          </button>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <div className="space-y-6">
          {/* Portfolio Aggregated Summary Grid */}
          <StaggerContainer staggerDelayMs={90} className="manzil-glass-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider block">Total Bulk Cargo Volume</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono-num">
                <CountUp end={totalQuantityMT} /> MT
              </div>
              <span className="text-xs text-slate-600 font-mono font-medium">Across {portfolio.length} charter voyages</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider block">Combined Commitment ({currency})</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-800 font-mono-num">{formatCurrency(totalCostUSD)}</div>
              <span className="text-xs text-teal-700 font-mono font-bold">({formatTotalCostShort(totalCostUSD)})</span>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-wider block">Weighted Average Freight Rate</span>
              <div className="text-2xl sm:text-3xl font-black text-teal-700 font-mono-num">{formatRatePerMT(avgRateUSD)}</div>
              <span className="text-xs text-emerald-700 font-mono font-bold">Corridor-weighted average</span>
            </div>
          </StaggerContainer>

          {/* Side-by-Side Comparison Matrix */}
          <ScrollReveal animation="fade-up">
            <div className="manzil-glass-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-xs font-mono font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Multi-Voyage Side-by-Side Comparison Matrix</span>
                </h2>
                <span className="badge-teal px-2.5 py-0.5 rounded text-[10px] font-mono">
                  3 Active Voyages
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead className="bg-slate-100/90 text-slate-700 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
                    <tr>
                      <th className="p-3">Voyage ID</th>
                      <th className="p-3">Corridor Trade Route</th>
                      <th className="p-3">Cargo Spec</th>
                      <th className="p-3">Vessel Class</th>
                      <th className="p-3">Freight Rate</th>
                      <th className="p-3">Estimated Cost ({currency})</th>
                      <th className="p-3">Transit</th>
                      <th className="p-3">Port Risk</th>
                      <th className="p-3">Laycan Window</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                    {portfolio.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setActivePortfolioModal(item)}
                        className="hover:bg-teal-50/60 cursor-pointer transition-colors duration-150"
                      >
                        <td className="p-3 font-mono font-black text-teal-700">{item.code}</td>
                        <td className="p-3 font-extrabold text-slate-900">{item.route}</td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900">{item.cargo}</span>
                          <span className="block text-[10px] text-slate-600 font-mono font-medium">{item.quantityMT.toLocaleString()} MT</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">{item.vesselClass}</td>
                        <td className="p-3 font-mono-num font-bold text-amber-800">{formatRatePerMT(item.freightRateUSD)}</td>
                        <td className="p-3 font-mono-num font-black text-slate-900">{formatTotalCostShort(item.estTotalCostUSD)}</td>
                        <td className="p-3 font-mono text-slate-600">{item.transitDays} Days</td>
                        <td className="p-3 font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.portRisk === 'Low'
                                ? 'badge-emerald'
                                : 'badge-amber'
                            }`}
                          >
                            {item.portRisk} Risk
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{item.deliveryWindow}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        </div>
      ) : (
        /* Executive Charter Approval View */
        <ScrollReveal animation="fade-up">
          <div className="manzil-glass-panel p-8 space-y-6 border border-teal-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
                  <Ship className="w-7 h-7 text-teal-600" />
                </div>

                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-widest block">Recommended Primary Option</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-2xl font-black text-slate-900 font-['ABC_Diatype']">NEWCASTLE</span>
                    <span className="text-xs font-mono text-slate-600 uppercase font-bold">AU</span>
                    <ArrowRight className="w-5 h-5 text-teal-600" />
                    <span className="text-2xl font-black text-slate-900 font-['ABC_Diatype']">VISAKHAPATNAM</span>
                    <span className="text-xs font-mono text-slate-600 uppercase font-bold">IN</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono font-bold text-slate-700 uppercase block">Total Estimated Voyage Commitment ({currency})</span>
                <div className="text-3xl font-black text-amber-800 font-mono-num mt-0.5">
                  {formatCurrency(1400000)}
                </div>
                <span className="text-xs text-teal-700 font-mono font-bold">
                  ({formatTotalCostShort(1400000)})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-700 text-[10px] uppercase font-bold block">Recommended Vessel</span>
                <span className="font-extrabold text-slate-900 text-base font-['ABC_Diatype']">Capesize</span>
                <span className="text-[11px] text-slate-600 block font-mono font-medium">178,000 DWT</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-700 text-[10px] uppercase font-bold block">Cargo Quantity</span>
                <span className="font-extrabold text-slate-900 text-base font-mono-num">75,000 MT</span>
                <span className="text-[11px] text-slate-600 block font-medium">Coking Coal Bulk</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-700 text-[10px] uppercase font-bold block">Estimated Freight Rate</span>
                <span className="font-extrabold text-teal-700 text-base font-mono-num">{formatRatePerMT(18.60)}</span>
                <span className="text-[11px] text-emerald-700 block font-bold">Optimal Market Point</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-700 text-[10px] uppercase font-bold block">Transit & Risk</span>
                <span className="font-extrabold text-slate-900 text-base font-mono-num">14 Days</span>
                <span className="text-[11px] text-emerald-700 block font-bold">Low Port Risk (16.5m Draft)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600 font-mono font-medium">
                Decision Audit Trail: Verified against Capesize spot rate index & Visakhapatnam channel draft limits.
              </div>

              <button
                onClick={handleApproveCharter}
                disabled={approvedStatus}
                className={`px-6 py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition shadow-md cursor-pointer ${
                  approvedStatus
                    ? 'bg-emerald-700 text-white shadow-none cursor-default'
                    : 'btn-manzil-teal'
                }`}
              >
                {approvedStatus ? '✓ Charter Formally Approved & Executed' : 'Execute Formal Charter Approval'}
              </button>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* PORTFOLIO DETAIL DRAWER MODAL */}
      {activePortfolioModal && (
        <DetailModal
          isOpen={!!activePortfolioModal}
          onClose={() => setActivePortfolioModal(null)}
          title={`${activePortfolioModal.code}: ${activePortfolioModal.route}`}
          subtitle={`Cargo: ${activePortfolioModal.cargo} (${activePortfolioModal.quantityMT.toLocaleString()} MT)`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
              <span className="text-[10px] text-teal-800 font-bold uppercase">Charter Summary</span>
              <div className="font-bold text-slate-900 text-sm">{activePortfolioModal.vesselClass}</div>
              <div className="text-[11px] text-slate-700 font-sans">Delivery Window: {activePortfolioModal.deliveryWindow}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Rate / MT</span>
                <span className="font-mono-num font-black text-amber-800 text-sm">{formatRatePerMT(activePortfolioModal.freightRateUSD)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Est. Commitment</span>
                <span className="font-mono-num font-black text-slate-900 text-sm">{formatCurrency(activePortfolioModal.estTotalCostUSD)}</span>
              </div>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
};

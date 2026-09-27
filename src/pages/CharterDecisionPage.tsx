import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DatasetBadge } from '../components/common/DatasetBadge';
import { Ship, ArrowRight, FileCheck, CheckCircle } from 'lucide-react';

export const CharterDecisionPage: React.FC = () => {
  const navigate = useNavigate();
  const { currency, formatCurrency, formatRatePerMT, formatTotalCostShort } = useApp();

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto font-sans text-slate-900 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-teal-700" />
              <span>CHARTERING EXECUTIVE APPROVAL SUMMARY</span>
            </span>
            <DatasetBadge />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['ABC_Diatype'] mt-1">
            Charter Decision Approval
          </h1>
        </div>

        <button
          onClick={() => navigate('/planner')}
          className="btn-manzil-teal text-xs uppercase tracking-wider font-bold flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-md shrink-0 cursor-pointer"
        >
          <span>Modify Voyage Parameters</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Option Executive Panel */}
      <div className="manzil-glass-panel p-8 space-y-6 border border-teal-300 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
              <Ship className="w-7 h-7 text-teal-700" />
            </div>

            <div>
              <span className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-widest block">Recommended Primary Option</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-black text-slate-900 font-['ABC_Diatype']">NEWCASTLE</span>
                <span className="text-xs font-mono text-slate-500 uppercase">AU</span>
                <ArrowRight className="w-5 h-5 text-teal-700" />
                <span className="text-2xl font-black text-slate-900 font-['ABC_Diatype']">VISAKHAPATNAM</span>
                <span className="text-xs font-mono text-slate-500 uppercase">IN</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Total Estimated Voyage Commitment ({currency})</span>
            <div className="text-3xl font-black text-amber-800 font-mono-num mt-0.5">
              {formatCurrency(1400000)}
            </div>
            <span className="text-xs text-teal-800 font-mono font-bold">
              ({formatTotalCostShort(1400000)})
            </span>
          </div>
        </div>

        {/* Core Decision Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Recommended Vessel</span>
            <span className="font-extrabold text-slate-900 text-base font-['ABC_Diatype']">Capesize</span>
            <span className="text-[11px] text-slate-500 block font-mono">178,000 DWT</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Cargo Quantity</span>
            <span className="font-extrabold text-slate-900 text-base font-mono-num">75,000 MT</span>
            <span className="text-[11px] text-slate-500 block">Coking Coal Bulk</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Estimated Freight Rate</span>
            <span className="font-extrabold text-teal-800 text-base font-mono-num">{formatRatePerMT(18.60)}</span>
            <span className="text-[11px] text-emerald-700 block font-bold">Optimal Market Point</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Transit & Risk</span>
            <span className="font-extrabold text-slate-900 text-base font-mono-num">14 Days</span>
            <span className="text-[11px] text-emerald-700 block font-bold">Low Port Risk (16.5m Draft)</span>
          </div>
        </div>

        {/* Model Rationale Explanations */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <CheckCircle className="w-4 h-4 text-teal-700" />
            <span>Chartering Recommendation Rationale</span>
          </h3>

          <ul className="space-y-2 text-xs text-slate-700 font-medium list-disc list-inside leading-relaxed font-sans">
            <li>Capesize vessel class minimizes per-MT freight cost ($18.60/MT vs $22.10/MT on Supramax).</li>
            <li>Visakhapatnam offers 16.5m draft clearance, accommodating fully laden Capesize draft without lighterage delays.</li>
            <li>Spot charter hire rate locked prior to forecasted Q4 Pacific basin tonnage tightness.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

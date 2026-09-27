import React from 'react';
import { useApp } from '../../context/AppContext';
import { ManzilLogo } from './ManzilLogo';
import { Database, Radio, Anchor, Activity } from 'lucide-react';

export const FooterTicker: React.FC = () => {
  const { usdInrRate } = useApp();

  return (
    <footer className="relative z-10 bg-white border-t border-slate-200 py-3 px-4 sm:px-6 lg:px-8 text-xs text-slate-600 font-mono shadow-xs">
      <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <ManzilLogo size="sm" showTagline={true} />
        </div>

        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          <span className="text-slate-700 flex items-center gap-1.5 font-bold">
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span>Feeds:</span>
          </span>

          <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Anchor className="w-3 h-3 text-sky-600" />
            <span>Port GIS (PDP • VZG • HAL • DHM)</span>
          </span>

          <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Radio className="w-3 h-3 text-teal-600" />
            <span>AIS Telemetry (126 Vessels)</span>
          </span>

          <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Activity className="w-3 h-3 text-emerald-600" />
            <span>Open-Meteo Weather</span>
          </span>

          <span className="bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-md border border-teal-200 font-bold font-mono shadow-xs">
            FX: 1 USD = ₹{usdInrRate.toFixed(2)}
          </span>
        </div>
      </div>
    </footer>
  );
};


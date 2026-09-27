import React, { useState } from 'react';
import { MapLibreEastCoastMap } from '../components/dashboard/MapLibreEastCoastMap';
import { DatasetBadge } from '../components/common/DatasetBadge';
import { PORTS } from '../data/mockData';
import {
  ScrollReveal,
  StaggerContainer,
} from '../components/common/AnimationSystem';
import {
  Compass,
  Layers,
  Ship,
  Anchor,
  Wind,
  Radio,
  Building2,
} from 'lucide-react';

export const LiveMarketMapPage: React.FC = () => {
  const [activeLayers, setActiveLayers] = useState({
    corridors: true,
    vessels: true,
    ports: true,
    weather: true,
  });

  const [activeView, setActiveView] = useState<'map' | 'ports'>('map');

  const indianPorts = PORTS.filter((p) => p.region === 'East Coast India');
  const overseasPorts = PORTS.filter((p) => p.region !== 'East Coast India');

  const toggleLayer = (key: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-900 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-teal-600" />
              <span>MANZIL OPERATIONAL GEOSPATIAL & PORT INTELLIGENCE</span>
            </span>
            <DatasetBadge />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['ABC_Diatype'] mt-1">
            Live Maritime Map & Port Infrastructure Terminal Hub
          </h1>
        </div>

        {/* View Switcher: Interactive Map vs Terminal Register */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold shrink-0">
          <button
            onClick={() => setActiveView('map')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'map'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Operational Map</span>
          </button>

          <button
            onClick={() => setActiveView('ports')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeView === 'ports'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Terminal Specs ({PORTS.length})</span>
          </button>
        </div>
      </div>
      {/* Main Content Area */}
      {activeView === 'map' ? (
        <div className="space-y-6">
          {/* Map Layer Controls Strip */}
          <ScrollReveal animation="fade-down">
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs font-mono font-bold flex-wrap">
              <div className="flex items-center gap-2 text-slate-700">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Interactive Telemetry Layers:</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto">
                <button
                  onClick={() => toggleLayer('corridors')}
                  className={`px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all border cursor-pointer ${
                    activeLayers.corridors
                      ? 'bg-teal-600 text-white shadow-xs border-teal-600'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Shipping Corridors</span>
                </button>

                <button
                  onClick={() => toggleLayer('vessels')}
                  className={`px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all border cursor-pointer ${
                    activeLayers.vessels
                      ? 'bg-sky-600 text-white shadow-xs border-sky-600'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <Ship className="w-3.5 h-3.5" />
                  <span>Open Tonnage</span>
                </button>

                <button
                  onClick={() => toggleLayer('ports')}
                  className={`px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all border cursor-pointer ${
                    activeLayers.ports
                      ? 'bg-emerald-600 text-white shadow-xs border-emerald-600'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <Anchor className="w-3.5 h-3.5" />
                  <span>East Coast Terminals</span>
                </button>

                <button
                  onClick={() => toggleLayer('weather')}
                  className={`px-3 py-1 rounded-xl flex items-center gap-1.5 transition-all border cursor-pointer ${
                    activeLayers.weather
                      ? 'bg-amber-600 text-white shadow-xs border-amber-600'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>Weather Telemetry</span>
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Sole Map Container */}
          <ScrollReveal animation="zoom-in">
            <div className="relative w-full h-[700px] rounded-3xl overflow-hidden border border-slate-200 shadow-lg bg-slate-100">
              <MapLibreEastCoastMap />
            </div>
          </ScrollReveal>

          {/* Terminal Overview Grid underneath map */}
          <StaggerContainer staggerDelayMs={60} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indianPorts.slice(0, 6).map((port) => (
              <div key={port.id} className="manzil-glass-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{port.name}</span>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                    {port.maxDraftM}m Draft
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 font-medium">{port.notes}</p>
              </div>
            ))}
          </StaggerContainer>
        </div>
      ) : (
        /* Detailed Terminal Register View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <ScrollReveal animation="fade-right" className="lg:col-span-7 space-y-4">
            <div className="manzil-glass-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-xs font-mono font-bold text-teal-700 uppercase tracking-wider flex items-center gap-2">
                  <Anchor className="w-4 h-4 text-teal-600" />
                  <span>Indian East Coast Bulk Terminals ({indianPorts.length})</span>
                </h2>
                <span className="badge-teal px-2.5 py-0.5 rounded text-[10px] font-mono">
                  Live Channel Specs
                </span>
              </div>

              <StaggerContainer staggerDelayMs={60} className="space-y-3">
                {indianPorts.map((port) => {
                  const isHaldia = port.id === 'port-haldia';
                  const isDeep = port.maxDraftM >= 18;

                  return (
                    <div
                      key={port.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 hover:border-teal-400 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-slate-900 font-['ABC_Diatype']">{port.name}</span>
                            <span className="port-badge">{port.id.replace('port-', '').toUpperCase().slice(0, 3)}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 font-sans font-medium">{port.notes}</p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded text-xs font-mono font-bold shrink-0 ${
                            isHaldia
                              ? 'badge-rose'
                              : isDeep
                              ? 'badge-emerald'
                              : 'badge-teal'
                          }`}
                        >
                          Max Draft: {port.maxDraftM} m
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs font-mono">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                          <span className="text-slate-700 block text-[10px] uppercase font-bold">Max LOA</span>
                          <span className="font-bold text-slate-900">{port.maxLOAM} m</span>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                          <span className="text-slate-700 block text-[10px] uppercase font-bold">Max Beam</span>
                          <span className="font-bold text-slate-900">{port.maxBeamM} m</span>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                          <span className="text-slate-700 block text-[10px] uppercase font-bold">Discharge Rate</span>
                          <span className="font-bold text-teal-700 font-mono-num">{port.cargoHandlingRateTPH.toLocaleString()} TPH</span>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                          <span className="text-slate-700 block text-[10px] uppercase font-bold">Clearance</span>
                          <span className={`font-bold text-[11px] ${isHaldia ? 'text-amber-800' : 'text-emerald-700'}`}>
                            {isHaldia ? 'Tidal Limit' : '24/7 Deep Water'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </StaggerContainer>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-left" className="lg:col-span-5 space-y-4">
            <div className="manzil-glass-card p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-xs font-mono font-bold text-teal-700 uppercase tracking-wider flex items-center gap-2">
                  <Ship className="w-4 h-4 text-teal-600" />
                  <span>Overseas Origin Load Terminals ({overseasPorts.length})</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-700 font-bold">Loading Capabilities</span>
              </div>

              <StaggerContainer staggerDelayMs={50} className="space-y-2 text-xs font-mono">
                {overseasPorts.map((port) => (
                  <div
                    key={port.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{port.name}</span>
                      <span className="text-slate-600 text-[10px] block font-medium">{port.country} • {port.region}</span>
                    </div>
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200 text-xs">
                      {port.maxDraftM}m Draft
                    </span>
                  </div>
                ))}
              </StaggerContainer>
            </div>
          </ScrollReveal>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { PORTS } from '../data/mockData';
import type { Port } from '../types/freight';
import { DatasetBadge } from '../components/common/DatasetBadge';
import { MapLibreEastCoastMap } from '../components/dashboard/MapLibreEastCoastMap';
import {
  ScrollReveal,
  StaggerContainer,
  DetailModal,
} from '../components/common/AnimationSystem';
import { Building2, Ship, Anchor, MapPin } from 'lucide-react';

export const PortInfrastructurePage: React.FC = () => {
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const indianPorts = PORTS.filter((p) => p.region === 'East Coast India');
  const overseasPorts = PORTS.filter((p) => p.region !== 'East Coast India');

  return (
    <div className="space-y-6 text-slate-900 pb-16 font-sans animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-teal-700" />
              <span>EAST COAST INDIA PORT TERMINAL REGISTER</span>
            </span>
            <DatasetBadge />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['ABC_Diatype'] mt-1">
            Port & Navigation Channel Technical Intelligence
          </h1>
        </div>
      </div>

      {/* Grid Layout with Map & Detailed Port Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: East Coast Terminals List (7 cols) */}
        <ScrollReveal animation="fade-right" className="lg:col-span-7 space-y-4">
          <div className="manzil-glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-xs font-mono font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-2">
                <Anchor className="w-4 h-4 text-teal-700" />
                <span>Indian East Coast Bulk Terminals ({indianPorts.length})</span>
              </h2>
              <span className="badge-teal px-2.5 py-0.5 rounded text-[10px] font-mono">
                Live Channel Feeds
              </span>
            </div>

            <StaggerContainer staggerDelayMs={70} className="space-y-3">
              {indianPorts.map((port) => {
                const isHaldia = port.id === 'port-haldia';
                const isDeep = port.maxDraftM >= 18;

                return (
                  <div
                    key={port.id}
                    onClick={() => setSelectedPort(port)}
                    className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 hover:border-teal-600 hover:shadow-md cursor-pointer transition-all duration-150 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-slate-900 font-['ABC_Diatype'] group-hover:text-teal-700 transition">
                            {port.name}
                          </span>
                          <span className="port-badge">{port.id.replace('port-', '').toUpperCase().slice(0, 3)}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-sans font-medium">{port.notes}</p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded text-xs font-mono font-extrabold shrink-0 ${
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

                    {/* Technical Parameter Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs font-mono">
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-700 block text-[10px] uppercase font-bold">Max LOA</span>
                        <span className="font-extrabold text-slate-900">{port.maxLOAM} m</span>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-700 block text-[10px] uppercase font-bold">Max Beam</span>
                        <span className="font-extrabold text-slate-900">{port.maxBeamM} m</span>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-700 block text-[10px] uppercase font-bold">Discharge Rate</span>
                        <span className="font-extrabold text-teal-800 font-mono-num">{port.cargoHandlingRateTPH.toLocaleString()} TPH</span>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-700 block text-[10px] uppercase font-bold">Clearance</span>
                        <span className={`font-extrabold text-[11px] ${isHaldia ? 'text-amber-800' : 'text-emerald-700'}`}>
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

        {/* Right Column: MapLibre Map & Overseas Origins (5 cols) */}
        <ScrollReveal animation="fade-left" className="lg:col-span-5 space-y-6">
          <MapLibreEastCoastMap />

          <div className="manzil-glass-card p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-mono font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-2">
                <Ship className="w-4 h-4 text-teal-700" />
                <span>Overseas Origin Load Terminals ({overseasPorts.length})</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-700 font-bold">Loading Capabilities</span>
            </div>

            <StaggerContainer staggerDelayMs={60} className="space-y-2 text-xs font-mono">
              {overseasPorts.map((port) => (
                <div
                  key={port.id}
                  onClick={() => setSelectedPort(port)}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs hover:border-teal-600 cursor-pointer transition"
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

      {/* Interactive Detail Drawer Modal */}
      <DetailModal
        isOpen={Boolean(selectedPort)}
        onClose={() => setSelectedPort(null)}
        title={selectedPort ? `${selectedPort.name} Terminal Audit` : ''}
        subtitle={selectedPort ? `${selectedPort.country} • ${selectedPort.region}` : ''}
      >
        {selectedPort && (
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-teal-900 text-sm">{selectedPort.name}</span>
                <span className="font-mono font-bold text-teal-800 bg-white px-2.5 py-0.5 rounded border border-teal-300">
                  {selectedPort.maxDraftM}m Max Draft
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed font-sans">{selectedPort.notes}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Max LOA Vessel</span>
                <span className="font-extrabold text-slate-900 text-sm">{selectedPort.maxLOAM} meters</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Max Beam</span>
                <span className="font-extrabold text-slate-900 text-sm">{selectedPort.maxBeamM} meters</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Discharge Speed</span>
                <span className="font-extrabold text-teal-800 text-sm">{selectedPort.cargoHandlingRateTPH.toLocaleString()} TPH</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Channel Constraints</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {selectedPort.id === 'port-haldia' ? 'Siltation Restriction' : 'Deep Water All Weather'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 text-white rounded-xl font-mono text-[11px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-400" />
                <span>GIS Navigation Vector Ready</span>
              </div>
              <span className="text-teal-300 font-bold uppercase">LIVE MONITORING</span>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
};

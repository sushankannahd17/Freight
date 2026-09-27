import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VESSEL_CLASSES } from '../data/mockData';
import { DatasetBadge } from '../components/common/DatasetBadge';
import {
  ScrollReveal,
  StaggerContainer,
  DetailModal,
} from '../components/common/AnimationSystem';
import {
  Ship,
  Filter,
  Search,
  CheckCircle,
  MapPin,
  Zap,
} from 'lucide-react';

interface AvailableVessel {
  id: string;
  name: string;
  vesselClass: 'Capesize' | 'Panamax' | 'Supramax' | 'Handysize';
  dwt: number;
  builtYear: number;
  flag: string;
  openPosition: string;
  openDate: string;
  draftM: number;
  loaM: number;
  beamM: number;
  speedKts: number;
  fuelConsMtDay: number;
  currentLocation: string;
  status: 'Prompt Open' | 'Available 5-7d' | 'Fixed';
  dailyHireUSD: number;
  estFreightRateUSD: number;
  geared: boolean;
}

const SAMPLE_VESSELS: AvailableVessel[] = [
  {
    id: 'vsl-1',
    name: 'MV Pacific Pioneer',
    vesselClass: 'Capesize',
    dwt: 178000,
    builtYear: 2021,
    flag: 'Panama (PA)',
    openPosition: 'Hay Point, Australia',
    openDate: '01 Oct 2026',
    draftM: 18.2,
    loaM: 292,
    beamM: 45,
    speedKts: 14.2,
    fuelConsMtDay: 42.5,
    currentLocation: 'Coral Sea (18°S, 152°E)',
    status: 'Prompt Open',
    dailyHireUSD: 24500,
    estFreightRateUSD: 18.60,
    geared: false,
  },
  {
    id: 'vsl-2',
    name: 'MV Ocean Trader',
    vesselClass: 'Panamax',
    dwt: 76000,
    builtYear: 2019,
    flag: 'Liberia (LR)',
    openPosition: 'Samarinda, Indonesia',
    openDate: '28 Sep 2026',
    draftM: 14.1,
    loaM: 225,
    beamM: 32,
    speedKts: 13.5,
    fuelConsMtDay: 28.0,
    currentLocation: 'Java Sea (4°S, 114°E)',
    status: 'Prompt Open',
    dailyHireUSD: 16200,
    estFreightRateUSD: 12.40,
    geared: false,
  },
  {
    id: 'vsl-3',
    name: 'MV Eastern Splendor',
    vesselClass: 'Supramax',
    dwt: 58000,
    builtYear: 2020,
    flag: 'Marshall Islands (MH)',
    openPosition: 'Maputo, Mozambique',
    openDate: '05 Oct 2026',
    draftM: 12.8,
    loaM: 190,
    beamM: 32.2,
    speedKts: 13.0,
    fuelConsMtDay: 22.5,
    currentLocation: 'Indian Ocean (22°S, 42°E)',
    status: 'Available 5-7d',
    dailyHireUSD: 14800,
    estFreightRateUSD: 22.10,
    geared: true,
  },
  {
    id: 'vsl-4',
    name: 'MV Bengal Horizon',
    vesselClass: 'Handysize',
    dwt: 35000,
    builtYear: 2018,
    flag: 'Singapore (SG)',
    openPosition: 'Singapore Anchorage',
    openDate: '26 Sep 2026',
    draftM: 10.4,
    loaM: 178,
    beamM: 28,
    speedKts: 12.5,
    fuelConsMtDay: 18.2,
    currentLocation: 'Malacca Strait (1°N, 103°E)',
    status: 'Prompt Open',
    dailyHireUSD: 11500,
    estFreightRateUSD: 26.80,
    geared: true,
  },
  {
    id: 'vsl-5',
    name: 'MV Iron Crest',
    vesselClass: 'Capesize',
    dwt: 181000,
    builtYear: 2022,
    flag: 'Singapore (SG)',
    openPosition: 'Gladstone, Australia',
    openDate: '10 Oct 2026',
    draftM: 18.4,
    loaM: 295,
    beamM: 46,
    speedKts: 14.5,
    fuelConsMtDay: 44.0,
    currentLocation: 'Tasman Sea (28°S, 155°E)',
    status: 'Available 5-7d',
    dailyHireUSD: 25200,
    estFreightRateUSD: 19.10,
    geared: false,
  },
  {
    id: 'vsl-6',
    name: 'MV Kakinada Express',
    vesselClass: 'Supramax',
    dwt: 56500,
    builtYear: 2021,
    flag: 'India (IN)',
    openPosition: 'Richards Bay, South Africa',
    openDate: '02 Oct 2026',
    draftM: 12.6,
    loaM: 189,
    beamM: 32.2,
    speedKts: 13.2,
    fuelConsMtDay: 23.0,
    currentLocation: 'Mozambique Channel (16°S, 41°E)',
    status: 'Prompt Open',
    dailyHireUSD: 15100,
    estFreightRateUSD: 21.50,
    geared: true,
  },
];

export const VesselIntelligencePage: React.FC = () => {
  const { formatCurrency } = useApp();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVessel, setSelectedVessel] = useState<AvailableVessel | null>(SAMPLE_VESSELS[0]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const filteredVessels = SAMPLE_VESSELS.filter((v) => {
    if (selectedClass !== 'all' && v.vesselClass !== selectedClass) return false;
    if (
      searchQuery &&
      !v.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !v.openPosition.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !v.flag.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-900 animate-in fade-in duration-300">
      {/* Top Terminal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
              <Ship className="w-4 h-4 text-teal-600" />
              <span>TONNAGE & VESSEL INTELLIGENCE MATRIX</span>
            </span>
            <DatasetBadge />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['ABC_Diatype'] mt-1">
            Bulk Carrier Technical Specs & AIS Tonnage Register
          </h1>
        </div>
      </div>

      {/* 4 Standard Bulk Carrier Vessel Classes Summary Grid */}
      <StaggerContainer staggerDelayMs={70} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {VESSEL_CLASSES.map((vessel) => {
          const isSelectedClass = selectedClass === vessel.name;
          return (
            <div
              key={vessel.id}
              onClick={() => setSelectedClass(selectedClass === vessel.name ? 'all' : vessel.name)}
              className={`manzil-glass-card p-4 space-y-3 cursor-pointer transition-all duration-200 border ${
                isSelectedClass
                  ? 'border-teal-400 bg-teal-50/80 ring-1 ring-teal-400/40 shadow-xs'
                  : 'hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-base text-slate-900 font-['ABC_Diatype']">{vessel.name}</span>
                <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  {vessel.capacityMinMT / 1000}k-{vessel.capacityMaxMT / 1000}k MT DWT
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-700 font-mono text-[11px] font-bold">Typical Draft:</span>
                  <strong className="text-teal-700 font-mono-num">{vessel.typicalDraftM} m</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-mono text-[11px] font-bold">Dimensions (LOA × Beam):</span>
                  <strong className="text-slate-900 font-mono-num">{vessel.typicalLOAM}m × {vessel.typicalBeamM}m</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700 font-mono text-[11px] font-bold">Daily Charter Hire:</span>
                  <strong className="text-amber-800 font-mono-num">{formatCurrency(vessel.dailyHireRateUSD)} / day</strong>
                </div>
              </div>
            </div>
          );
        })}
      </StaggerContainer>

      {/* Filter & Search Toolbar */}
      <ScrollReveal animation="fade-up">
        <div className="manzil-glass-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <span className="text-slate-700 font-bold uppercase text-[11px] font-mono flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-teal-600" />
              <span>Class Filter:</span>
            </span>
            {['all', 'Capesize', 'Panamax', 'Supramax', 'Handysize'].map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-1.5 rounded-lg font-bold font-mono text-[11px] transition-all duration-150 cursor-pointer ${
                  selectedClass === cls
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {cls === 'all' ? 'All Classes' : cls}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search vessel, open port, flag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full manzil-input pl-9 pr-3 py-1.5 text-xs text-slate-900"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* Table & Vessel Detail Panel Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tonnage Table (8 cols) */}
        <ScrollReveal animation="fade-right" className="lg:col-span-8 manzil-glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xs font-mono font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-2">
              <Ship className="w-4 h-4 text-teal-600" />
              <span>AIS Open Commercial Tonnage Register ({filteredVessels.length})</span>
            </h2>
            <span className="badge-teal px-2.5 py-0.5 rounded text-[10px] font-mono">
              Live Satellite Feed
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-700 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3">Vessel Name & Flag</th>
                  <th className="p-3">Class & DWT</th>
                  <th className="p-3">Open Position</th>
                  <th className="p-3">Laycan Date</th>
                  <th className="p-3">Draft / LOA</th>
                  <th className="p-3">Daily Hire Rate</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredVessels.map((vsl) => {
                  const isSelected = selectedVessel?.id === vsl.id;
                  return (
                    <tr
                      key={vsl.id}
                      onClick={() => {
                        setSelectedVessel(vsl);
                        setIsModalOpen(true);
                      }}
                      className={`hover:bg-teal-50/60 cursor-pointer transition-colors duration-150 ${
                        isSelected ? 'bg-teal-50/80 border-l-2 border-teal-600' : ''
                      }`}
                    >
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{vsl.name}</span>
                        <span className="text-[10px] font-mono text-slate-600 font-medium">{vsl.flag} • Built {vsl.builtYear}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-teal-700">{vsl.vesselClass}</span>
                        <span className="block text-[10px] text-slate-600 font-mono font-medium">{vsl.dwt.toLocaleString()} DWT</span>
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{vsl.openPosition}</td>
                      <td className="p-3 font-mono text-slate-600">{vsl.openDate}</td>
                      <td className="p-3 font-mono text-slate-600">{vsl.draftM}m / {vsl.loaM}m</td>
                      <td className="p-3 font-mono-num font-bold text-amber-800">
                        {formatCurrency(vsl.dailyHireUSD)}/d
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono inline-block ${
                            vsl.status === 'Prompt Open'
                              ? 'badge-emerald'
                              : 'badge-amber'
                          }`}
                        >
                          {vsl.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ScrollReveal>

        {/* Right Column: Selected Vessel Detail Panel (4 cols) */}
        <ScrollReveal animation="fade-left" className="lg:col-span-4 manzil-glass-card p-6 space-y-4">
          {selectedVessel ? (
            <>
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-mono font-bold text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-teal-600" />
                  <span>Technical Vessel Profile</span>
                </span>
                <h3 className="text-xl font-black text-slate-900 font-['ABC_Diatype'] mt-1">{selectedVessel.name}</h3>
                <span className="text-xs text-slate-600 font-mono font-medium">
                  {selectedVessel.vesselClass} Bulk Carrier • {selectedVessel.dwt.toLocaleString()} DWT
                </span>
              </div>

              <div className="space-y-3 text-xs font-mono">
                {/* AIS Position Card */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-700 text-[10px] uppercase font-bold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-teal-600" />
                    <span>Live AIS Satellite Coordinates</span>
                  </span>
                  <div className="font-bold text-teal-700 text-xs">{selectedVessel.currentLocation}</div>
                  <div className="text-[10px] text-slate-600 mt-1 font-medium">
                    Open Laycan: <strong className="text-slate-900">{selectedVessel.openDate}</strong> at {selectedVessel.openPosition}
                  </div>
                </div>

                {/* Technical Dimensions Matrix */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-700 text-[10px] uppercase font-bold block">Draft Limit</span>
                    <span className="font-bold text-slate-900 text-sm font-mono-num">{selectedVessel.draftM} meters</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-700 text-[10px] uppercase font-bold block">LOA / Beam</span>
                    <span className="font-bold text-slate-900 text-sm font-mono-num">{selectedVessel.loaM}m / {selectedVessel.beamM}m</span>
                  </div>
                </div>

                {/* Speed & Fuel Consumption */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-700 text-[10px] uppercase font-bold block">Econ Speed</span>
                    <span className="font-bold text-teal-700 text-sm font-mono-num">{selectedVessel.speedKts} knots</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-700 text-[10px] uppercase font-bold block">VLSFO Burn</span>
                    <span className="font-bold text-amber-800 text-sm font-mono-num">{selectedVessel.fuelConsMtDay} MT/day</span>
                  </div>
                </div>

                {/* East Coast India Compatibility Check */}
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-1.5">
                  <span className="text-teal-800 text-[10px] uppercase font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                    <span>East Coast India Clearance</span>
                  </span>
                  <div className="text-[11px] text-slate-700 font-sans leading-relaxed">
                    {selectedVessel.draftM <= 12.0 ? (
                      <span className="text-emerald-800 font-semibold">
                        Compatible with all East Coast Indian ports including shallow draft Haldia (8.5m limit).
                      </span>
                    ) : selectedVessel.draftM <= 16.5 ? (
                      <span className="text-teal-800 font-semibold">
                        Fits Paradip (16.0m), Visakhapatnam (16.5m), Dhamra (18.0m), & Gangavaram (19.5m). Incompatible with Haldia.
                      </span>
                    ) : (
                      <span className="text-amber-800 font-semibold">
                        Requires deep-water berths at Dhamra (18.0m) or Gangavaram (19.5m). Requires tidal assistance at Paradip.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-8 text-xs text-slate-600 font-mono font-medium">
              Select a vessel from the tonnage matrix to inspect technical specifications.
            </div>
          )}
        </ScrollReveal>
      </div>

      {/* VESSEL DETAIL DRAWER MODAL */}
      {selectedVessel && (
        <DetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedVessel.name}
          subtitle={`${selectedVessel.vesselClass} Bulk Carrier • ${selectedVessel.dwt.toLocaleString()} DWT`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
              <span className="text-[10px] text-teal-800 font-bold uppercase">AIS Satellite Telemetry</span>
              <div className="font-bold text-slate-900 text-sm">{selectedVessel.currentLocation}</div>
              <div className="text-[11px] text-slate-700 font-sans">
                Open Laycan: {selectedVessel.openDate} at {selectedVessel.openPosition}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Charter Hire</span>
                <span className="font-mono-num font-black text-amber-800 text-sm">{formatCurrency(selectedVessel.dailyHireUSD)}/d</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Est. Freight</span>
                <span className="font-mono-num font-black text-slate-900 text-sm">${selectedVessel.estFreightRateUSD}/MT</span>
              </div>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
};

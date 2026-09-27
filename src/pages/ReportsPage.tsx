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
  FileText,
  Filter,
  BarChart3,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface AuditRow {
  id: string;
  voyageCode: string;
  cargoSpec: string;
  route: string;
  vesselClass: string;
  contractStrategy: string;
  freightRateUSD: number;
  totalCostUSD: number;
  status: 'Verified' | 'Under Audit' | 'Reconciled';
  dischargePort: string;
}

const SAMPLE_AUDIT_DATA: AuditRow[] = [
  {
    id: 'r-01',
    voyageCode: 'VOY-2026-089',
    cargoSpec: 'Coking Coal (150k MT)',
    route: 'Hay Point (AU) → Paradip (IN)',
    vesselClass: 'Capesize',
    contractStrategy: '12-Mo COA Contract',
    freightRateUSD: 18.60,
    totalCostUSD: 2790000,
    status: 'Verified',
    dischargePort: 'Paradip',
  },
  {
    id: 'r-02',
    voyageCode: 'VOY-2026-090',
    cargoSpec: 'Thermal Coal (75k MT)',
    route: 'Samarinda (ID) → Visakhapatnam (IN)',
    vesselClass: 'Panamax',
    contractStrategy: 'Spot Market Charter',
    freightRateUSD: 12.40,
    totalCostUSD: 930000,
    status: 'Verified',
    dischargePort: 'Visakhapatnam',
  },
  {
    id: 'r-03',
    voyageCode: 'VOY-2026-091',
    cargoSpec: 'Coking Coal (55k MT)',
    route: 'Maputo (MZ) → Dhamra (IN)',
    vesselClass: 'Supramax',
    contractStrategy: 'Quarterly Spot Window',
    freightRateUSD: 22.10,
    totalCostUSD: 1215500,
    status: 'Under Audit',
    dischargePort: 'Dhamra',
  },
  {
    id: 'r-04',
    voyageCode: 'VOY-2026-092',
    cargoSpec: 'Thermal Coal (35k MT)',
    route: 'Maputo (MZ) → Haldia (IN)',
    vesselClass: 'Handymax',
    contractStrategy: 'Short Spot Charter',
    freightRateUSD: 26.80,
    totalCostUSD: 938000,
    status: 'Reconciled',
    dischargePort: 'Haldia',
  },
];

const MONTHLY_TREND_DATA = [
  { month: 'Jan', expenditure: 8.2, volumekMT: 410 },
  { month: 'Feb', expenditure: 9.5, volumekMT: 480 },
  { month: 'Mar', expenditure: 11.0, volumekMT: 550 },
  { month: 'Apr', expenditure: 10.4, volumekMT: 520 },
  { month: 'May', expenditure: 12.8, volumekMT: 610 },
  { month: 'Jun', expenditure: 11.5, volumekMT: 580 },
  { month: 'Jul', expenditure: 13.2, volumekMT: 640 },
  { month: 'Aug', expenditure: 14.1, volumekMT: 690 },
  { month: 'Sep', expenditure: 13.8, volumekMT: 670 },
];

export const ReportsPage: React.FC = () => {
  const { formatRatePerMT, formatTotalCostShort } = useApp();
  const [downloading, setDownloading] = useState<boolean>(false);
  const [reportType, setReportType] = useState<string>('procurement');
  const [selectedPort, setSelectedPort] = useState<string>('all');
  const [datePeriod, setDatePeriod] = useState<string>('q1-q3-2026');
  const [activeAuditModal, setActiveAuditModal] = useState<AuditRow | null>(null);

  const handleDownloadReport = (format: 'CSV' | 'PDF') => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert(`MANZIL Enterprise ${reportType.toUpperCase()} Report exported successfully (${format} format).`);
    }, 800);
  };

  const filteredData = SAMPLE_AUDIT_DATA.filter((row) => {
    if (selectedPort !== 'all' && row.dischargePort.toLowerCase() !== selectedPort.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-16 font-sans text-slate-900 animate-in fade-in duration-300">
      {/* Top Terminal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-700" />
              <span>ENTERPRISE LOGISTICS & CHARTERING AUDIT TERMINAL</span>
            </span>
            <DatasetBadge />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-['ABC_Diatype'] mt-1">
            Logistics Expenditure & Charter Party Audit Reports
          </h1>
        </div>

        {/* Action / Export Toolbar */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleDownloadReport('CSV')}
            disabled={downloading}
            className="btn-manzil-teal text-xs font-bold uppercase tracking-wider flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-md cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{downloading ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => handleDownloadReport('PDF')}
            disabled={downloading}
            className="btn-manzil-secondary text-xs font-bold uppercase tracking-wider flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer shrink-0"
          >
            <Printer className="w-4 h-4 text-teal-700" />
            <span>PDF Summary</span>
          </button>
        </div>
      </div>

      {/* Filter & Date Selection Bar */}
      <ScrollReveal animation="fade-down">
        <div className="manzil-glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-slate-700 font-bold uppercase text-[11px] flex items-center gap-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-teal-700" />
              <span>Report Category:</span>
            </span>
            {[
              { id: 'procurement', label: 'Procurement Summary' },
              { id: 'audit', label: 'Charter Party Audit' },
              { id: 'demurrage', label: 'Berth & Demurrage' },
              { id: 'coa', label: 'COA Performance' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setReportType(type.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all duration-150 cursor-pointer text-[11px] ${
                  reportType === type.id
                    ? 'bg-teal-50 text-teal-800 border border-teal-300 shadow-xs'
                    : 'bg-slate-100/70 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div>
              <select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                className="manzil-select text-xs py-1.5 cursor-pointer"
              >
                <option value="all">All Terminal Hubs</option>
                <option value="paradip">Paradip Port</option>
                <option value="visakhapatnam">Visakhapatnam Port</option>
                <option value="dhamra">Dhamra Port</option>
                <option value="haldia">Haldia Port</option>
              </select>
            </div>

            <div>
              <select
                value={datePeriod}
                onChange={(e) => setDatePeriod(e.target.value)}
                className="manzil-select text-xs py-1.5 cursor-pointer"
              >
                <option value="q1-q3-2026">Jan – Sep 2026 (YTD)</option>
                <option value="q3-2026">Q3 2026 Only</option>
                <option value="full-2026">Full Year 2026 Forecast</option>
              </select>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* KPI Summary Banner */}
      <StaggerContainer staggerDelayMs={80} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="manzil-kpi-box p-5 space-y-1">
          <span className="text-[10px] font-mono font-extrabold uppercase text-slate-700 tracking-wider">Total Audited Voyages</span>
          <div className="text-2xl font-mono font-black text-slate-900">
            <CountUp end={42} /> Voyages
          </div>
          <p className="text-xs text-slate-600 font-mono font-medium">Q1 – Q3 2026 Charter Cycle</p>
        </div>

        <div className="manzil-kpi-box p-5 space-y-1">
          <span className="text-[10px] font-mono font-extrabold uppercase text-slate-700 tracking-wider">Cumulative Freight Spend</span>
          <div className="text-2xl font-mono font-black text-amber-800">{formatTotalCostShort(84500000)}</div>
          <p className="text-xs text-emerald-700 font-mono font-bold">Est. COA Savings: {formatTotalCostShort(9200000)}</p>
        </div>

        <div className="manzil-kpi-box p-5 space-y-1">
          <span className="text-[10px] font-mono font-extrabold uppercase text-slate-700 tracking-wider">Weighted Avg Freight Rate</span>
          <div className="text-2xl font-mono font-black text-teal-800">{formatRatePerMT(17.80)}</div>
          <p className="text-xs text-teal-700 font-mono font-bold">-4.2% vs Spot Market Index</p>
        </div>

        <div className="manzil-kpi-box p-5 space-y-1">
          <span className="text-[10px] font-mono font-extrabold uppercase text-slate-700 tracking-wider">Primary Discharge Hub</span>
          <div className="text-2xl font-mono font-black text-slate-900">Paradip Terminal</div>
          <p className="text-xs text-slate-600 font-mono font-medium">62% Total Coking Coal Cargo</p>
        </div>
      </StaggerContainer>

      {/* Chart & Audit Table Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Monthly Trend Area Chart (6 cols) */}
        <ScrollReveal animation="fade-right" className="lg:col-span-6 manzil-glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xs font-mono font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-700" />
              <span>Monthly Freight Expenditure Trend ($M)</span>
            </h2>
            <span className="text-xs font-mono text-slate-700 font-semibold">YTD 2026 Trend</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_TREND_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="expenditureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }} tickFormatter={(v) => `$${v}M`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '12px',
                    color: '#0f172a',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(val: any) => [`$${val}M USD`, 'Expenditure']}
                />
                <Area
                  type="monotone"
                  dataKey="expenditure"
                  stroke="#0d9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#expenditureGrad)"
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ScrollReveal>

        {/* Right Column: Audit Table Preview (6 cols) */}
        <ScrollReveal animation="fade-left" className="lg:col-span-6 manzil-glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-xs font-mono font-extrabold text-teal-700 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-700" />
              <span>Charter Party Audit Ledger ({filteredData.length})</span>
            </h2>
            <span className="badge-teal px-2 py-0.5 rounded text-[10px] font-mono">
              Audit Verified
            </span>
          </div>

          {filteredData.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-slate-100/90 text-slate-700 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200 font-bold">
                  <tr>
                    <th className="p-3">Voyage Code</th>
                    <th className="p-3">Cargo Spec</th>
                    <th className="p-3">Vessel</th>
                    <th className="p-3">Total Cost</th>
                    <th className="p-3 text-right">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {filteredData.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setActiveAuditModal(row)}
                      className="hover:bg-teal-50/60 cursor-pointer transition-colors duration-150"
                    >
                      <td className="p-3 font-mono font-bold text-teal-800">{row.voyageCode}</td>
                      <td className="p-3 text-slate-700">
                        <span className="font-bold text-slate-900 block">{row.cargoSpec}</span>
                        <span className="text-[10px] font-mono text-slate-600 font-medium">{row.route}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-700 font-semibold">{row.vesselClass}</td>
                      <td className="p-3 font-mono-num font-bold text-amber-800">{formatTotalCostShort(row.totalCostUSD)}</td>
                      <td className="p-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            row.status === 'Verified'
                              ? 'badge-emerald'
                              : row.status === 'Reconciled'
                              ? 'badge-teal'
                              : 'badge-amber'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-8 text-xs text-slate-600 font-mono font-medium">
              No audit records matching the selected terminal filter.
            </div>
          )}
        </ScrollReveal>
      </div>

      {/* AUDIT ROW DETAIL MODAL */}
      {activeAuditModal && (
        <DetailModal
          isOpen={!!activeAuditModal}
          onClose={() => setActiveAuditModal(null)}
          title={`Audit Ledger: ${activeAuditModal.voyageCode}`}
          subtitle={`${activeAuditModal.cargoSpec} • ${activeAuditModal.vesselClass}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
              <span className="text-[10px] text-teal-800 font-bold uppercase">Corridor Route</span>
              <div className="font-bold text-slate-900 text-sm">{activeAuditModal.route}</div>
              <div className="text-[11px] text-slate-700 font-sans">Strategy: {activeAuditModal.contractStrategy}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Rate / MT</span>
                <span className="font-mono-num font-black text-amber-800 text-sm">${activeAuditModal.freightRateUSD}/MT</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-700 uppercase font-bold block">Total Audit Cost</span>
                <span className="font-mono-num font-black text-slate-900 text-sm">{formatTotalCostShort(activeAuditModal.totalCostUSD)}</span>
              </div>
            </div>
          </div>
        </DetailModal>
      )}
    </div>
  );
};

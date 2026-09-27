import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';

// Route-level code splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const FreightMarketPage = lazy(() => import('./pages/FreightMarketPage').then((m) => ({ default: m.FreightMarketPage })));
const VoyagePlannerPage = lazy(() => import('./pages/VoyagePlannerPage').then((m) => ({ default: m.VoyagePlannerPage })));
const VesselIntelligencePage = lazy(() => import('./pages/VesselIntelligencePage').then((m) => ({ default: m.VesselIntelligencePage })));
const PortInfrastructurePage = lazy(() => import('./pages/PortInfrastructurePage').then((m) => ({ default: m.PortInfrastructurePage })));
const LiveMarketMapPage = lazy(() => import('./pages/LiveMarketMapPage').then((m) => ({ default: m.LiveMarketMapPage })));
const VoyagePortfolioPage = lazy(() => import('./pages/VoyagePortfolioPage').then((m) => ({ default: m.VoyagePortfolioPage })));
const CharterDecisionPage = lazy(() => import('./pages/CharterDecisionPage').then((m) => ({ default: m.CharterDecisionPage })));
const ScenarioAnalysisPage = lazy(() => import('./pages/ScenarioAnalysisPage').then((m) => ({ default: m.ScenarioAnalysisPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-6">
      <div className="manzil-glass-panel px-6 py-4 flex items-center gap-3 text-slate-900 text-xs font-mono border border-slate-200 shadow-xs rounded-2xl">
        <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
        <span className="uppercase tracking-widest font-bold text-teal-800">INITIALIZING INTELLIGENCE MODULE...</span>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <Router>
        <AppLayout>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/market" element={<FreightMarketPage />} />
              <Route path="/planner" element={<VoyagePlannerPage />} />
              <Route path="/vessels" element={<VesselIntelligencePage />} />
              <Route path="/ports" element={<PortInfrastructurePage />} />
              <Route path="/live-map" element={<LiveMarketMapPage />} />
              <Route path="/portfolio" element={<VoyagePortfolioPage />} />
              <Route path="/charter-decision" element={<CharterDecisionPage />} />
              <Route path="/scenarios" element={<ScenarioAnalysisPage />} />
              <Route path="/reports" element={<ReportsPage />} />

              {/* Redirect legacy redundant routes to consolidated hubs */}
              <Route path="/dashboard" element={<Navigate to="/market" replace />} />
              <Route path="/forecasts" element={<Navigate to="/market" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppLayout>
      </Router>
    </AppProvider>
  );
}

export default App;

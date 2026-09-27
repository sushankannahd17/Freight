import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ManzilLogo } from '../common/ManzilLogo';
import {
  Bell,
  Search,
  X,
  MapPin,
  Ship,
  TrendingUp,
  Menu,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currency, setCurrency } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { label: 'Overview', path: '/' },
    { label: 'Freight Market', path: '/market' },
    { label: 'Voyage Planner', path: '/planner' },
    { label: 'Vessels & Fleet', path: '/vessels' },
    { label: 'East Coast Ports', path: '/ports' },
    { label: 'Live Map', path: '/live-map' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'Charter Decision', path: '/charter-decision' },
    { label: 'Scenarios', path: '/scenarios' },
    { label: 'Reports', path: '/reports' },
  ];

  const searchResults = [
    { type: 'Port', code: 'PDP', title: 'Paradip Port (16.0m Max Draft)', path: '/live-map' },
    { type: 'Port', code: 'HAL', title: 'Haldia Dock Complex (8.5m Draft Restrict)', path: '/live-map' },
    { type: 'Port', code: 'VZG', title: 'Visakhapatnam Port (16.5m Deepwater)', path: '/live-map' },
    { type: 'Vessel', code: 'CAPE', title: 'Capesize Bulk Carrier (180k DWT)', path: '/vessels' },
    { type: 'Route', code: 'AUS➜IND', title: 'Australia (Newcastle) → Paradip', path: '/market' },
    { type: 'Route', code: 'IDN➜IND', title: 'Indonesia (Samarinda) → Visakhapatnam', path: '/planner' },
    { type: 'Route', code: 'MOZ➜IND', title: 'Mozambique (Maputo) → Dhamra', path: '/market' },
  ].filter((item) =>
    searchQuery === '' ||
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <>
      {/* Full Bleed Enterprise Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="w-full max-w-[1800px] mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3">
          {/* Brand Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="xl:hidden p-1.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-900"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-teal-600" /> : <Menu className="w-5 h-5 text-teal-600" />}
            </button>

            <div
              onClick={() => navigate('/')}
              className="cursor-pointer shrink-0 transition-opacity hover:opacity-90"
            >
              <ManzilLogo size="sm" showTagline={false} />
            </div>
          </div>

          {/* Navigation Items (Desktop) */}
          <nav className="hidden xl:flex items-center gap-1.5 text-xs font-semibold">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-1.5 rounded-md transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-extrabold border-b-2 border-teal-600'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-900 transition flex items-center gap-2 text-xs font-medium cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden sm:inline font-mono text-[11px] text-slate-500">Search (⌘K)</span>
            </button>

            {/* Currency Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-300 text-xs font-bold">
              <button
                onClick={() => setCurrency('INR')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition text-[11px] sm:text-xs cursor-pointer ${
                  currency === 'INR'
                    ? 'bg-teal-700 text-white font-black shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ₹ INR
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg transition text-[11px] sm:text-xs cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-teal-700 text-white font-black shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                $ USD
              </button>
            </div>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-900 transition relative cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 text-slate-700" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-72 sm:w-80 manzil-glass-panel border border-slate-300 rounded-2xl p-4 shadow-2xl text-xs space-y-3 z-50">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                      <span>Market Signals</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-full">
                      3 Active
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                      <div className="font-bold text-amber-900 text-xs flex items-center gap-1">
                        <Ship className="w-3.5 h-3.5 text-amber-600" />
                        Capesize Tonnage Tightness
                      </div>
                      <div className="text-[11px] text-slate-700 leading-snug font-mono">
                        Australia → East Coast India freight rates up +$1.40/MT.
                      </div>
                    </div>

                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                      <div className="font-bold text-rose-900 text-xs flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-600" />
                        Haldia Port Draft Alert
                      </div>
                      <div className="text-[11px] text-slate-700 leading-snug font-mono">
                        Max permitted draft restricted to 8.5m due to siltation.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Badge */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-300">
              <div className="w-8 h-8 rounded-xl bg-teal-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                MP
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden w-full bg-white p-4 border-b border-slate-300 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-1.5 font-mono text-xs max-w-[1800px] mx-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(item.path);
                    }}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all duration-150 ${
                      isActive
                        ? 'bg-teal-700 text-white border-teal-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-start justify-center pt-20 p-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-white max-w-xl w-full p-4 rounded-2xl border border-slate-300 shadow-2xl space-y-4 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-slate-800 w-full">
                <Search className="w-5 h-5 text-teal-600 shrink-0" />
                <input
                  type="text"
                  placeholder="Search ports (PDP, HAL), routes (AUS->IND), or vessels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent text-sm text-slate-900 font-medium focus:outline-none placeholder-slate-400"
                />
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((res, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(res.path);
                    }}
                    className="p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer border border-transparent hover:border-slate-200 flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                        {res.code}
                      </span>
                      <span className="font-bold text-slate-900">{res.title}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {res.type}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500 font-mono">
                  No matching maritime intelligence records found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

};



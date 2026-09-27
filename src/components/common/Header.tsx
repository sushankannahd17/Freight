import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DatasetBadge } from './DatasetBadge';
import {
  Ship,
  Menu,
  Bell,
  Building2,
  AlertTriangle,
  Globe,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { currency, setCurrency, language, setLanguage, t } = useApp();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md text-slate-900 border-b border-slate-200/80 px-4 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Emblem & Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden text-slate-300 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Ministry Badge */}
          <div className="hidden sm:flex items-center gap-2.5 pr-4 border-r border-slate-800">
            <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="leading-none">
              <span className="text-[10px] font-extrabold text-amber-300 block tracking-wider uppercase">
                {t('ministryMain')}
              </span>
              <span className="text-[9px] text-slate-400 font-semibold block tracking-tight">
                {t('ministrySub')}
              </span>
            </div>
          </div>

          {/* FreightIQ Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-black shadow-sm">
              <Ship className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-['Syne']">MANZIL</span>
                <span className="text-[9px] uppercase font-extrabold tracking-wider bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                  {t('sihBadge')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <DatasetBadge className="hidden xl:inline-flex" />

          {/* India Flag Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs font-bold text-slate-200">
            <span className="text-base leading-none">🇮🇳</span>
            <span>{t('indiaLabel')}</span>
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80 text-xs font-bold">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-2.5 py-1 rounded-md transition ${
                currency === 'INR'
                  ? 'bg-teal-600 text-white font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ₹ INR
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded-md transition ${
                currency === 'USD'
                  ? 'bg-teal-600 text-white font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              $ USD
            </button>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80 text-xs font-bold">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                language === 'en'
                  ? 'bg-slate-700 text-white font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>EN</span>
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                language === 'hi'
                  ? 'bg-slate-700 text-white font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>हिंदी</span>
            </button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0f172a] border border-slate-700 rounded-xl p-4 shadow-2xl text-xs space-y-3 z-50">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-white text-sm">Maritime Operational Alerts</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                    3 Active Alerts
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-200">Monsoon Weather Advisory</div>
                      <div className="text-[11px] text-slate-300">
                        Paradip & Dhamra anchorage reporting 28 knot squalls. Vessel discharge delays expected.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Navbar } from './Navbar';
import { FooterTicker } from '../common/FooterTicker';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-teal-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Viewport Content Shell */}
      <main className="relative z-10 flex-1 w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 manzil-page-transition">
        {children}
      </main>

      {/* Bottom Maritime Terminal Ticker */}
      <FooterTicker />
    </div>
  );
};


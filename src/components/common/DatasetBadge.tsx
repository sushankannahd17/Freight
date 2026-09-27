import React from 'react';
import { Database, Info } from 'lucide-react';

interface DatasetBadgeProps {
  className?: string;
  showText?: boolean;
}

export const DatasetBadge: React.FC<DatasetBadgeProps> = ({ className = '', showText = true }) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono font-bold rounded-full shadow-xs ${className}`}
      title="MANZIL Multi-Source Intelligence Dataset: Verified port specs, AIS position markers, and freight rate models."
    >
      <Database className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
      {showText && <span>MANZIL Feeds • Synthetic Market Models</span>}
      <Info className="w-3 h-3 text-amber-700" />
    </div>
  );
};


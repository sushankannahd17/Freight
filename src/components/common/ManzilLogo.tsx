import React, { useState } from 'react';

interface ManzilLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const ManzilLogo: React.FC<ManzilLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const heightClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {!imageError ? (
        <div className="relative flex items-center justify-center bg-white/95 rounded-xl px-2 py-1 shadow-md border border-white/20 transition-transform hover:scale-105">
          <img
            src="/manzil-logo.png"
            alt="MANZIL - Predict the Market. Chart the Voyage."
            className={`${heightClasses} w-auto object-contain rounded`}
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        /* Crisp High-Level Vector Fallback */
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#050B14] rounded-[10px] flex items-center justify-center">
              <span className="font-black text-teal-400 font-mono text-sm tracking-tighter">M</span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-widest text-white font-sans leading-tight">
              MANZIL
            </span>
            {showTagline && (
              <span className="text-[9px] font-mono text-teal-400 uppercase tracking-wider">
                Predict The Market. Chart The Voyage.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

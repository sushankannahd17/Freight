import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Currency } from '../services/currencyService';
import type { Language } from '../services/i18nService';
import { DEFAULT_USD_INR_RATE, formatCurrency, formatRatePerMT, formatTotalCostShort } from '../services/currencyService';
import { t } from '../services/i18nService';

interface AppContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  language: Language;
  setLanguage: (l: Language) => void;
  usdInrRate: number;
  setUsdInrRate: (r: number) => void;
  t: (key: string) => string;
  formatCurrency: (amountInUSD: number) => string;
  formatRatePerMT: (rateInUSD: number) => string;
  formatTotalCostShort: (amountInUSD: number) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('INR');
  const [language, setLanguage] = useState<Language>('en');
  const [usdInrRate, setUsdInrRate] = useState<number>(DEFAULT_USD_INR_RATE);

  const translate = (key: string) => t(key, language);

  const fmtCurrency = (amountInUSD: number) => formatCurrency(amountInUSD, currency, usdInrRate);
  const fmtRatePerMT = (rateInUSD: number) => formatRatePerMT(rateInUSD, currency, usdInrRate);
  const fmtTotalCostShort = (amountInUSD: number) => formatTotalCostShort(amountInUSD, currency, usdInrRate);

  return (
    <AppContext.Provider
      value={{
        currency,
        setCurrency,
        language,
        setLanguage,
        usdInrRate,
        setUsdInrRate,
        t: translate,
        formatCurrency: fmtCurrency,
        formatRatePerMT: fmtRatePerMT,
        formatTotalCostShort: fmtTotalCostShort,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

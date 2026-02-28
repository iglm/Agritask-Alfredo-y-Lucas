'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { currencies, appLanguages, type Currency, type LanguageCode } from '@/lib/currencies';
import esTranslations from '@/locales/es.json';
import enTranslations from '@/locales/en.json';

type Translations = typeof esTranslations;

const translations: Record<LanguageCode, Translations> = {
  es: esTranslations,
  en: enTranslations,
};

interface FormatCurrencyOptions {
  includeDecimals?: boolean;
}

interface LocalizationContextState {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currency: Currency;
  setCurrency: (currencyCode: Currency['code']) => void;
  t: (key: keyof Translations) => string;
  formatCurrency: (value: number, options?: FormatCurrencyOptions) => string;
}

const LocalizationContext = createContext<LocalizationContextState | undefined>(undefined);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>('es');
  const [currency, setCurrencyState] = useState<Currency>(currencies[0]); // Default to COP

  const setCurrency = (currencyCode: Currency['code']) => {
    const newCurrency = currencies.find(c => c.code === currencyCode) || currencies[0];
    setCurrencyState(newCurrency);
  };

  const t = useCallback((key: keyof Translations): string => {
    return translations[language][key] || key;
  }, [language]);

  const formatCurrency = useCallback((value: number, options?: FormatCurrencyOptions): string => {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: options?.includeDecimals ? 2 : 0,
      maximumFractionDigits: options?.includeDecimals ? 2 : 0,
    }).format(value);
  }, [currency]);

  const value = {
    language,
    setLanguage,
    currency,
    setCurrency,
    t,
    formatCurrency,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}

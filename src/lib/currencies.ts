export type Currency = {
  code: 'COP' | 'USD' | 'EUR' | 'MXN' | 'ARS' | 'CLP' | 'PEN' | 'BRL';
  name: string;
  locale: string;
};

export const currencies: Currency[] = [
  { code: 'COP', name: 'Peso Colombiano', locale: 'es-CO' },
  { code: 'USD', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', name: 'Euro', locale: 'de-DE' },
  { code: 'MXN', name: 'Peso Mexicano', locale: 'es-MX' },
  { code: 'ARS', name: 'Peso Argentino', locale: 'es-AR' },
  { code: 'CLP', name: 'Peso Chileno', locale: 'es-CL' },
  { code: 'PEN', name: 'Sol Peruano', locale: 'es-PE' },
  { code: 'BRL', name: 'Real Brasileño', locale: 'pt-BR' },
];

export const appLanguages = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
] as const;

export type LanguageCode = typeof appLanguages[number]['code'];

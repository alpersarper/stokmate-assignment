import { DEFAULT_LOCALE, LOCALES, type Locale } from '@stokmate/shared';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { messages, type MessageKey } from './messages';

const LOCALE_KEY = 'stokmate.locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readPersistedLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored && (LOCALES as readonly string[]).includes(stored)) return stored as Locale;
  } catch {
    // storage unavailable — fall through to default
  }
  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readPersistedLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {
      // persistence is best-effort
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: (key) => messages[locale][key] }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- i18n hook module
export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useI18n must be used within LocaleProvider');
  return ctx;
}

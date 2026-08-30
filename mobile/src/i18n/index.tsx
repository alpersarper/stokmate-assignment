import { DEFAULT_LOCALE, LOCALES, type Locale } from '@stokmate/shared';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { messages, type MessageKey } from './messages';

// SecureStore is already a dependency for tokens; reusing it for this one small
// preference avoids pulling in AsyncStorage just for the locale string.
const LOCALE_KEY = 'stokmate.locale';

type MessageParams = Record<string, string | number>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, params?: MessageParams) => string;
}

function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(LOCALE_KEY)
      .then((stored) => {
        if (!cancelled && stored && (LOCALES as readonly string[]).includes(stored)) {
          setLocaleState(stored as Locale);
        }
      })
      .catch(() => {
        // persistence is best-effort; stay on the default
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    SecureStore.setItemAsync(LOCALE_KEY, next).catch(() => {
      // persistence is best-effort
    });
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: (key, params) => interpolate(messages[locale][key], params) }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useI18n must be used within LocaleProvider');
  return ctx;
}

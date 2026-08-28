import type { Locale } from '../i18n';

const LOCALE_TAGS: Record<Locale, string> = { en: 'en-US', tr: 'tr-TR' };

const formatterCache = new Map<string, Intl.NumberFormat>();

function currencyFormatter(locale: Locale): Intl.NumberFormat {
  let formatter = formatterCache.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE_TAGS[locale], {
      style: 'currency',
      currency: 'TRY',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    formatterCache.set(locale, formatter);
  }
  return formatter;
}

/**
 * Format an integer kuruş amount as ₺ (e.g. 3950 → "₺39,50" in tr, "₺39.50" in en).
 * Pure integer math: the lira part is formatted as an exact integer and the kuruş
 * remainder is substituted into the fraction slot — no floating-point division.
 */
export function formatKurus(kurus: number, locale: Locale): string {
  if (!Number.isInteger(kurus)) {
    throw new RangeError(`formatKurus expects an integer kuruş amount, got ${String(kurus)}`);
  }
  const negative = kurus < 0;
  const abs = Math.abs(kurus);
  const lira = Math.trunc(abs / 100);
  const cents = abs % 100;
  const formatted = currencyFormatter(locale)
    .formatToParts(lira)
    .map((part) => (part.type === 'fraction' ? String(cents).padStart(2, '0') : part.value))
    .join('');
  return negative ? `-${formatted}` : formatted;
}

import type { ProductStatus, Unit } from './types';

/** Supported user-facing languages (UX-009). English is the default. */
export type Locale = 'en' | 'tr';

export const LOCALES: readonly Locale[] = ['en', 'tr'];
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Domain enum → label maps, shared because the values come from the wire format
 * (docs/API_CONTRACT.md §5) and their translations are fixed by UX-009.
 * App chrome dictionaries stay per-app; only genuinely shared pieces live here.
 */
export const unitLabels: Record<Unit, Record<Locale, string>> = {
  1: { en: 'Piece', tr: 'Adet' },
  2: { en: 'Kg', tr: 'Kg' },
  3: { en: 'Lt', tr: 'Lt' },
  4: { en: 'Pack', tr: 'Paket' },
};

export const statusLabels: Record<ProductStatus, Record<Locale, string>> = {
  1: { en: 'Active', tr: 'Aktif' },
  2: { en: 'Passive', tr: 'Pasif' },
  3: { en: 'Discontinued', tr: 'Üretim Durduruldu' },
};

export function unitLabel(unit: Unit, locale: Locale): string {
  return unitLabels[unit][locale];
}

export function statusLabel(status: ProductStatus, locale: Locale): string {
  return statusLabels[status][locale];
}

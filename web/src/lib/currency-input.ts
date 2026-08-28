import type { Locale } from '@stokmate/shared';

/** Backend price is int32 kuruş; anything above would overflow into a generic 400. */
const MAX_KURUS = 2_147_483_647;

/**
 * Parse a user-typed lira amount ("39", "39.5", "39,50") into integer kuruş,
 * or null when invalid. Pure integer math — no floating-point division.
 * Comma and dot are both accepted as the decimal separator; at most two
 * decimal digits (the API stores whole kuruş).
 */
export function parsePriceInput(input: string): number | null {
  const match = /^(\d{1,9})(?:[.,](\d{1,2}))?$/.exec(input.trim());
  if (!match?.[1]) return null;
  const lira = Number(match[1]);
  const cents = match[2] ? Number(match[2].padEnd(2, '0')) : 0;
  const kurus = lira * 100 + cents;
  return kurus <= MAX_KURUS ? kurus : null;
}

/** Format integer kuruş for the edit input (no ₺ symbol, locale decimal separator). */
export function formatPriceInput(kurus: number, locale: Locale): string {
  const separator = locale === 'tr' ? ',' : '.';
  const lira = Math.trunc(kurus / 100);
  const cents = kurus % 100;
  return `${String(lira)}${separator}${String(cents).padStart(2, '0')}`;
}

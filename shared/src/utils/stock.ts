/** Backend stock is int32; anything above this would overflow into a generic 400. */
export const MAX_STOCK = 2_147_483_647;

/**
 * Normalize a free-text stock input into a valid absolute stock value, or null when
 * the text is not a valid non-negative integer (empty, signs, decimals, letters,
 * overflow). Leading/trailing whitespace and leading zeros are tolerated.
 * Returning null (never 0) for invalid input keeps the PATCH stock=0 trap unreachable.
 */
export function normalizeStockInput(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value > MAX_STOCK) return null;
  return value;
}

import { describe, expect, it } from 'vitest';
import { formatKurus } from '../utils/currency';
import { MAX_STOCK, normalizeStockInput } from '../utils/stock';
import { normalizeListParams, queryKeys } from '../query-keys';
import { statusLabel, unitLabel } from '../i18n';

describe('formatKurus', () => {
  it('formats kuruş with locale separators', () => {
    expect(formatKurus(3950, 'tr')).toBe('₺39,50');
    expect(formatKurus(3950, 'en')).toBe('₺39.50');
  });

  it('uses pure integer math (no float drift) and grouping', () => {
    expect(formatKurus(123456789, 'en')).toBe('₺1,234,567.89');
    expect(formatKurus(123456789, 'tr')).toBe('₺1.234.567,89');
    expect(formatKurus(1, 'en')).toBe('₺0.01');
    expect(formatKurus(0, 'tr')).toBe('₺0,00');
    expect(formatKurus(100, 'en')).toBe('₺1.00');
  });

  it('handles negatives and rejects non-integers', () => {
    expect(formatKurus(-3950, 'tr')).toBe('-₺39,50');
    expect(() => formatKurus(39.5, 'en')).toThrow(RangeError);
  });
});

describe('normalizeStockInput', () => {
  it('accepts non-negative integers with whitespace and leading zeros', () => {
    expect(normalizeStockInput('12')).toBe(12);
    expect(normalizeStockInput(' 0 ')).toBe(0);
    expect(normalizeStockInput('007')).toBe(7);
  });

  it('rejects everything that is not a plain non-negative integer', () => {
    for (const bad of ['', '  ', '-1', '+5', '1.5', '1,5', 'abc', '12a', '1e3', String(MAX_STOCK + 1)]) {
      expect(normalizeStockInput(bad)).toBeNull();
    }
  });
});

describe('queryKeys', () => {
  it('produces identical keys for equivalent filter states', () => {
    const a = queryKeys.products.list({ q: 'çay', page: 2 });
    const b = queryKeys.products.list({ page: 2, q: 'çay', categoryId: undefined });
    expect(a).toEqual(b);
  });

  it('drops empty values and keeps stable ordering', () => {
    expect(normalizeListParams({ q: '', page: 1 })).toEqual({ page: 1 });
    expect(queryKeys.products.detail(7)).toEqual(['products', 'detail', 7]);
    expect(queryKeys.products.list()).toEqual(['products', 'list', {}]);
    expect(queryKeys.lookups.brands()).toEqual(['lookups', 'brands']);
  });
});

describe('shared enum labels', () => {
  it('maps wire values to UX-009 labels', () => {
    expect(statusLabel(3, 'en')).toBe('Discontinued');
    expect(statusLabel(3, 'tr')).toBe('Üretim Durduruldu');
    expect(unitLabel(4, 'tr')).toBe('Paket');
  });
});

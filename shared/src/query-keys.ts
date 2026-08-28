import type { ProductListParams } from './types';

/**
 * TanStack Query key factory shared by web and mobile so invalidation semantics match.
 * List keys embed a normalized copy of the params (stable field order, no undefined
 * entries) so equivalent filter states always map to the same cache entry.
 */
export const queryKeys = {
  products: {
    /** Root for invalidating every product query at once. */
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (params: ProductListParams = {}) =>
      [...queryKeys.products.lists(), normalizeListParams(params)] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.products.details(), id] as const,
    stats: () => [...queryKeys.products.all, 'stats'] as const,
  },
  lookups: {
    all: ['lookups'] as const,
    categories: () => [...queryKeys.lookups.all, 'categories'] as const,
    brands: () => [...queryKeys.lookups.all, 'brands'] as const,
    suppliers: () => [...queryKeys.lookups.all, 'suppliers'] as const,
  },
};

export function normalizeListParams(params: ProductListParams): Record<string, string | number> {
  const normalized: Record<string, string | number> = {};
  const ordered: (keyof ProductListParams)[] = [
    'q',
    'categoryId',
    'brandId',
    'status',
    'sort',
    'dir',
    'page',
    'pageSize',
  ];
  for (const key of ordered) {
    const value = params[key];
    if (value === undefined || value === null || value === '') continue;
    normalized[key] = value;
  }
  return normalized;
}

import { queryKeys, type PagedResult, type Product, type ProductDetail } from '@stokmate/shared';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';

/**
 * MOB-003: a mutation response is canonical server state — apply it to the
 * caches directly instead of invalidating and refetching every loaded page.
 * Patches the detail entry (preserving the three detail-only fields) and the
 * matching row inside every cached infinite list dataset. Dataset membership
 * (a product no longer matching a filter) is deliberately NOT corrected here;
 * that happens on the next explicit refresh of that dataset.
 */
export function applyProductToCaches(queryClient: QueryClient, updated: Product): void {
  queryClient.setQueryData<ProductDetail>(queryKeys.products.detail(updated.id), (old) =>
    old ? { ...old, ...updated } : old,
  );

  queryClient.setQueriesData<InfiniteData<PagedResult<Product>>>(
    { queryKey: queryKeys.products.lists() },
    (data) => {
      if (!data?.pages) return data;
      let changed = false;
      const pages = data.pages.map((page) => {
        const index = page.items.findIndex((item) => item.id === updated.id);
        if (index === -1) return page;
        changed = true;
        const items = page.items.slice();
        items[index] = { ...items[index], ...updated };
        return { ...page, items };
      });
      return changed ? { ...data, pages } : data;
    },
  );
}

import {
  queryKeys,
  type ProductDetail,
  type ProductListParams,
  type ProductUpdateBody,
} from '@stokmate/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

/**
 * Cross-client refresh (optional bonus): while a product list is mounted it
 * re-polls the active query so edits from other clients appear without a
 * reload. keepPreviousData keeps the refresh visually calm.
 */
const LIST_REFETCH_INTERVAL_MS = 15_000;

export function useProductList(params: ProductListParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => apiClient.getProducts(params),
    placeholderData: keepPreviousData,
    refetchInterval: LIST_REFETCH_INTERVAL_MS,
  });
}

export function useProductDetail(id: number) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => apiClient.getProduct(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

// Lookups are static seed data — cache for the session.
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.lookups.categories(),
    queryFn: () => apiClient.getCategories(),
    staleTime: Infinity,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: queryKeys.lookups.brands(),
    queryFn: () => apiClient.getBrands(),
    staleTime: Infinity,
  });
}

/**
 * PUT full-replace mutation. On success the detail cache is set from the
 * server's response (persisted state, not optimistic — PUT returns the full
 * updated ProductDto; the three detail-only fields come from the body we
 * sent, which the server stored verbatim), then detail + lists are
 * invalidated so everything re-syncs from the backend.
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: ProductUpdateBody }) =>
      apiClient.updateProduct(id, body),
    onSuccess: (product, { id, body }) => {
      const detail: ProductDetail = {
        ...product,
        costPrice: body.costPrice,
        supplierId: body.supplierId,
        description: body.description,
      };
      queryClient.setQueryData(queryKeys.products.detail(id), detail);
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

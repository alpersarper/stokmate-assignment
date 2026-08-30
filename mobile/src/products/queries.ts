import { queryKeys } from '@stokmate/shared';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

/**
 * Lookup data for the filter sheet (MOB-007). Static seed data — cached for
 * the session. `enabled` keeps these off the wire until the filter sheet is
 * first opened; active-filter chips store {id, name} at selection time, so
 * they never depend on this cache.
 */
export function useCategories(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.lookups.categories(),
    queryFn: () => apiClient.getCategories(),
    staleTime: Infinity,
    enabled,
  });
}

export function useBrands(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.lookups.brands(),
    queryFn: () => apiClient.getBrands(),
    staleTime: Infinity,
    enabled,
  });
}

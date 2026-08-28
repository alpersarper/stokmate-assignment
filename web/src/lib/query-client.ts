import { isApiError } from '@stokmate/shared';
import { QueryClient } from '@tanstack/react-query';

/** QueryClient defaults per docs/ARCHITECTURE.md §5. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Retry once on network/server errors, never on 4xx.
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
          return failureCount < 1;
        },
        staleTime: 30_000,
        refetchOnWindowFocus: true,
      },
    },
  });
}

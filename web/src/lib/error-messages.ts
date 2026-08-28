import { isApiError } from '@stokmate/shared';
import type { MessageKey } from '@/i18n/messages';

export type ErrorContext = 'login' | 'list' | 'detail' | 'save';

export interface ErrorDescription {
  key: MessageKey;
  /** Raw backend text, shown only as secondary detail per UX-009. */
  detail?: string;
}

/**
 * Map an ApiError to a localized message key using status code + request
 * context only (UX-009): known, reliably identifiable failures get specific
 * messages; everything else falls back to a localized generic message with
 * the raw server text as optional secondary detail. Backend prose is never
 * string-matched.
 */
export function describeError(error: unknown, context: ErrorContext): ErrorDescription {
  if (!isApiError(error)) return { key: 'errorGeneric' };
  if (error.status === 0) return { key: 'errorNetwork' };

  if (context === 'login' && error.status === 401) return { key: 'loginFailedCredentials' };
  if ((context === 'detail' || context === 'save') && error.status === 404) {
    return { key: 'productNotFoundBody' };
  }

  return { key: 'errorGeneric', detail: error.message || undefined };
}

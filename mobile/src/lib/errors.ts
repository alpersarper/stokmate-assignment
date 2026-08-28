import { isApiError } from '@stokmate/shared';
import type { MessageKey } from '../i18n/messages';

export interface LocalizedFailure {
  /** Message-catalog key for the localized headline. */
  key: MessageKey;
  /** Raw backend text, shown as secondary detail for unrecognized failures (UX-009). */
  detail?: string;
}

/**
 * Map a failure to a localized message per the UX-009 error policy: known
 * failures are recognized by status code + request context, never by matching
 * backend message text. Everything else gets the localized generic fallback
 * with the raw server text preserved as secondary detail.
 */
export function describeFailure(
  error: unknown,
  context: 'login' | 'productList' | 'productDetail' | 'stockUpdate' | 'generic' = 'generic',
): LocalizedFailure {
  if (!isApiError(error)) return { key: 'errorGeneric' };
  if (error.status === 0) return { key: 'errorNetwork' };
  if (context === 'login' && error.status === 401) return { key: 'errorBadCredentials' };
  if (error.status === 401) return { key: 'sessionExpired' };
  if (error.status === 404 && (context === 'productDetail' || context === 'stockUpdate')) {
    return { key: 'errorNotFound' };
  }
  if (context === 'stockUpdate' && error.status === 400) {
    // Local validation should prevent this; the backend rule set for the stock
    // PATCH is exactly "non-negative integer", so the localized rule text applies.
    return { key: 'stockInvalid', detail: error.message || undefined };
  }
  return { key: 'errorGeneric', detail: error.message || undefined };
}

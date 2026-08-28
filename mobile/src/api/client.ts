import { createApiClient } from '@stokmate/shared';
import { getTokens, persistTokens } from '../auth/token-store';
import { API_URL } from '../lib/env';

let sessionInvalidHandler: () => void = () => {};

/**
 * Navigation is injected, not imported: the auth provider registers its
 * return-to-login behavior here (the navigator is auth-status-driven, so
 * flipping the auth state IS the stack reset).
 */
export function setSessionInvalidHandler(handler: () => void): void {
  sessionInvalidHandler = handler;
}

export const apiClient = createApiClient({
  baseUrl: API_URL,
  getTokens,
  persistTokens,
  onSessionInvalid: () => sessionInvalidHandler(),
});

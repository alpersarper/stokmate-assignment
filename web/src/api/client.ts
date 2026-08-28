import { createApiClient, type TokenPair } from '@stokmate/shared';
import { API_URL } from '@/lib/env';

const TOKEN_KEY = 'stokmate.tokens';

/**
 * Web token storage adapter. Foundation persists to localStorage; the UX-007
 * "Remember me" split (localStorage vs sessionStorage) is Web Agent scope and
 * only needs this adapter swapped/extended — the shared client is agnostic.
 */
const webTokenStorage = {
  getTokens(): TokenPair | null {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      return raw ? (JSON.parse(raw) as TokenPair) : null;
    } catch {
      return null;
    }
  },
  persistTokens(tokens: TokenPair | null): void {
    if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(TOKEN_KEY);
  },
};

let sessionInvalidHandler: () => void = () => {};

/**
 * Navigation is injected, not imported: the auth provider (Web Agent scope)
 * registers its return-to-login behavior here.
 */
export function setSessionInvalidHandler(handler: () => void): void {
  sessionInvalidHandler = handler;
}

export const apiClient = createApiClient({
  baseUrl: API_URL,
  getTokens: webTokenStorage.getTokens,
  persistTokens: webTokenStorage.persistTokens,
  onSessionInvalid: () => sessionInvalidHandler(),
});

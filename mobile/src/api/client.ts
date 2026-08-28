import { createApiClient, type TokenPair } from '@stokmate/shared';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../lib/env';

const TOKEN_KEY = 'stokmate.tokens';

/**
 * Mobile token storage adapter backed by expo-secure-store. Foundation always
 * persists; the UX-007 "Remember me" (memory-only) variant is Mobile Agent
 * scope and only needs this adapter extended — the shared client is agnostic.
 */
const secureTokenStorage = {
  async getTokens(): Promise<TokenPair | null> {
    try {
      const raw = await SecureStore.getItemAsync(TOKEN_KEY);
      return raw ? (JSON.parse(raw) as TokenPair) : null;
    } catch {
      return null;
    }
  },
  async persistTokens(tokens: TokenPair | null): Promise<void> {
    if (tokens) await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

let sessionInvalidHandler: () => void = () => {};

/**
 * Navigation is injected, not imported: the auth provider (Mobile Agent scope)
 * registers its reset-to-Login behavior here.
 */
export function setSessionInvalidHandler(handler: () => void): void {
  sessionInvalidHandler = handler;
}

export const apiClient = createApiClient({
  baseUrl: API_URL,
  getTokens: secureTokenStorage.getTokens,
  persistTokens: secureTokenStorage.persistTokens,
  onSessionInvalid: () => sessionInvalidHandler(),
});

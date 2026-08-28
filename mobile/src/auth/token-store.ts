import type { TokenPair } from '@stokmate/shared';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'stokmate.tokens';

/**
 * UX-007 "Remember me" mapping (docs/ARCHITECTURE.md §4):
 * - remember = true  → token pair mirrored to expo-secure-store (survives app restart)
 * - remember = false → memory only (session dies with the process)
 *
 * The in-memory copy is always authoritative while the app runs; SecureStore is
 * only read once, during startup restore. The shared api-core client is agnostic —
 * it just calls getTokens/persistTokens.
 */
let memoryTokens: TokenPair | null = null;
let remember = false;
let restored = false;

/** Set BEFORE login() so the pair persisted by the shared client lands in the right place. */
export function setRememberSession(value: boolean): void {
  remember = value;
}

export async function getTokens(): Promise<TokenPair | null> {
  if (!restored) await restoreTokens();
  return memoryTokens;
}

export async function persistTokens(tokens: TokenPair | null): Promise<void> {
  memoryTokens = tokens;
  restored = true;
  try {
    if (tokens && remember) {
      await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
    } else {
      // Signed out, or a memory-only session: no pair may remain on disk.
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // Secure storage is best-effort; the in-memory session keeps working.
  }
}

/**
 * One-time startup restore. A pair found on disk implies the previous session
 * chose "Remember me", so rotation-refreshed pairs keep persisting.
 */
export async function restoreTokens(): Promise<TokenPair | null> {
  if (restored) return memoryTokens;
  restored = true;
  try {
    const raw = await SecureStore.getItemAsync(TOKEN_KEY);
    if (raw) {
      memoryTokens = JSON.parse(raw) as TokenPair;
      remember = true;
    }
  } catch {
    memoryTokens = null;
  }
  return memoryTokens;
}

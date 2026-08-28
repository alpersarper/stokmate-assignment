import { createApiClient, type TokenPair } from '@stokmate/shared';
import { API_URL } from '@/lib/env';

const TOKEN_KEY = 'stokmate.tokens';

/**
 * UX-007 "Remember me" storage split: remembered sessions persist in
 * localStorage (survive the browser closing), non-remembered sessions live in
 * sessionStorage (die with the tab). Token rotation must keep writing to the
 * store that currently holds the session; the preference only decides where a
 * fresh login lands.
 */
let rememberPreference = false;

export function setRememberPreference(remember: boolean): void {
  rememberPreference = remember;
}

function readFrom(storage: Storage): TokenPair | null {
  try {
    const raw = storage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as TokenPair) : null;
  } catch {
    return null;
  }
}

function removeFrom(storage: Storage): void {
  try {
    storage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable — nothing to clear
  }
}

function getTokens(): TokenPair | null {
  return readFrom(sessionStorage) ?? readFrom(localStorage);
}

/** True when a persisted session exists that is worth validating on startup. */
export function hasPersistedSession(): boolean {
  return getTokens() !== null;
}

function persistTokens(tokens: TokenPair | null): void {
  if (!tokens) {
    removeFrom(sessionStorage);
    removeFrom(localStorage);
    return;
  }
  // Rotation keeps the session in its current store; a fresh login (no store
  // holds tokens) follows the remember-me preference.
  let target: Storage;
  if (readFrom(sessionStorage)) target = sessionStorage;
  else if (readFrom(localStorage)) target = localStorage;
  else target = rememberPreference ? localStorage : sessionStorage;
  try {
    target.setItem(TOKEN_KEY, JSON.stringify(tokens));
  } catch {
    // storage unavailable — session becomes memory-only for this page load
  }
}

let sessionInvalidHandler: () => void = () => {};

/**
 * Navigation is injected, not imported: the auth provider registers its
 * return-to-login behavior here.
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

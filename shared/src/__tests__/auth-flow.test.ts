import { describe, expect, it, vi } from 'vitest';
import { createApiClient, type TokenPair } from '../api/client';
import { ApiError } from '../api/errors';

const BASE = 'http://test.local';

function textResponse(status: number, body: string): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const EXPIRED_401 = () => textResponse(401, 'Erişim anahtarı geçersiz veya süresi dolmuş.');

function authPayload(access: string, refresh: string) {
  return {
    accessToken: access,
    refreshToken: refresh,
    expiresAt: '2026-01-01T00:15:00Z',
    user: { id: 1, email: 'test@ornek.com', fullName: 'Deniz Yılmaz' },
  };
}

function makeStorage(initial: TokenPair | null) {
  let pair = initial;
  return {
    getTokens: () => pair,
    persistTokens: (next: TokenPair | null) => {
      pair = next;
    },
    current: () => pair,
  };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Minimal fake of the verified backend auth behavior: opaque tokens, strict refresh
 * rotation, 401s for anything stale. Counts calls so tests can assert single-flight.
 */
function makeFakeBackend(opts: { refreshDelayMs?: number; productDelayMs?: number } = {}) {
  const state = {
    validAccess: new Set<string>(),
    validRefresh: new Set(['R1']),
    nextId: 2,
    refreshCalls: 0,
    productCalls: 0,
    refreshShouldFailWith: null as number | null,
    refreshShouldThrow: false,
    productsAlways401: false,
  };

  const fetchImpl = (async (input: URL | RequestInfo, init?: RequestInit) => {
    const url = String(input);
    const bearer = (init?.headers as Record<string, string> | undefined)?.Authorization?.replace(
      'Bearer ',
      '',
    );
    if (url === `${BASE}/auth/refresh`) {
      state.refreshCalls += 1;
      if (opts.refreshDelayMs) await delay(opts.refreshDelayMs);
      if (state.refreshShouldThrow) throw new TypeError('fetch failed');
      if (state.refreshShouldFailWith) return textResponse(state.refreshShouldFailWith, 'Yenileme anahtarı geçersiz veya süresi dolmuş.');
      const { refreshToken } = JSON.parse(String(init?.body)) as { refreshToken: string };
      if (!state.validRefresh.has(refreshToken)) {
        return textResponse(401, 'Yenileme anahtarı geçersiz veya süresi dolmuş.');
      }
      state.validRefresh.delete(refreshToken); // strict rotation
      const access = `A${state.nextId}`;
      const refresh = `R${state.nextId}`;
      state.nextId += 1;
      state.validAccess.add(access);
      state.validRefresh.add(refresh);
      return jsonResponse(200, authPayload(access, refresh));
    }
    if (url.startsWith(`${BASE}/products`)) {
      state.productCalls += 1;
      if (opts.productDelayMs) await delay(opts.productDelayMs);
      if (state.productsAlways401 || !bearer || !state.validAccess.has(bearer)) {
        return EXPIRED_401();
      }
      return jsonResponse(200, { items: [], total: 0, page: 1, pageSize: 20 });
    }
    if (url === `${BASE}/auth/logout`) {
      return new Response(null, { status: 204 });
    }
    throw new Error(`unexpected url ${url}`);
  }) as typeof fetch;

  return { state, fetchImpl };
}

describe('401 → refresh → retry plumbing', () => {
  it('single-flight: concurrent 401s share one refresh and all retries succeed', async () => {
    const backend = makeFakeBackend({ refreshDelayMs: 30 });
    const storage = makeStorage({ accessToken: 'expired', refreshToken: 'R1' });
    const onSessionInvalid = vi.fn();
    const client = createApiClient({
      baseUrl: BASE,
      ...storage,
      onSessionInvalid,
      fetchImpl: backend.fetchImpl,
    });

    const results = await Promise.all([
      client.getProducts(),
      client.getProducts(),
      client.getProducts(),
    ]);

    expect(results).toHaveLength(3);
    expect(backend.state.refreshCalls).toBe(1); // the rotating token was used exactly once
    expect(backend.state.productCalls).toBe(6); // 3 initial 401s + 3 retries
    expect(storage.current()).toEqual({ accessToken: 'A2', refreshToken: 'R2' });
    expect(onSessionInvalid).not.toHaveBeenCalled();
  });

  it('retries at most once: a 401 after successful refresh propagates without a refresh loop', async () => {
    const backend = makeFakeBackend();
    backend.state.productsAlways401 = true;
    const storage = makeStorage({ accessToken: 'expired', refreshToken: 'R1' });
    const onSessionInvalid = vi.fn();
    const client = createApiClient({
      baseUrl: BASE,
      ...storage,
      onSessionInvalid,
      fetchImpl: backend.fetchImpl,
    });

    await expect(client.getProducts()).rejects.toMatchObject({ status: 401 });
    expect(backend.state.refreshCalls).toBe(1);
    expect(backend.state.productCalls).toBe(2); // original + exactly one retry
  });

  it('failed refresh clears the session and signals onSessionInvalid exactly once', async () => {
    const backend = makeFakeBackend({ refreshDelayMs: 20 });
    backend.state.refreshShouldFailWith = 401;
    const storage = makeStorage({ accessToken: 'expired', refreshToken: 'R1' });
    const onSessionInvalid = vi.fn();
    const client = createApiClient({
      baseUrl: BASE,
      ...storage,
      onSessionInvalid,
      fetchImpl: backend.fetchImpl,
    });

    const outcomes = await Promise.allSettled([client.getProducts(), client.getProducts()]);
    expect(outcomes.every((o) => o.status === 'rejected')).toBe(true);
    for (const o of outcomes) {
      if (o.status === 'rejected') {
        expect((o.reason as ApiError).status).toBe(401);
        expect((o.reason as ApiError).message).toBe('Erişim anahtarı geçersiz veya süresi dolmuş.');
      }
    }
    expect(backend.state.refreshCalls).toBe(1);
    expect(onSessionInvalid).toHaveBeenCalledTimes(1);
    expect(storage.current()).toBeNull();
  });

  it('a refresh network failure does NOT kill the session', async () => {
    const backend = makeFakeBackend();
    backend.state.refreshShouldThrow = true;
    const storage = makeStorage({ accessToken: 'expired', refreshToken: 'R1' });
    const onSessionInvalid = vi.fn();
    const client = createApiClient({
      baseUrl: BASE,
      ...storage,
      onSessionInvalid,
      fetchImpl: backend.fetchImpl,
    });

    await expect(client.getProducts()).rejects.toMatchObject({ status: 0 });
    expect(onSessionInvalid).not.toHaveBeenCalled();
    expect(storage.current()).toEqual({ accessToken: 'expired', refreshToken: 'R1' });
  });

  it('intentional logout does not trigger refresh/retry for in-flight 401s', async () => {
    const backend = makeFakeBackend({ productDelayMs: 40 });
    const storage = makeStorage({ accessToken: 'expired', refreshToken: 'R1' });
    const onSessionInvalid = vi.fn();
    const client = createApiClient({
      baseUrl: BASE,
      ...storage,
      onSessionInvalid,
      fetchImpl: backend.fetchImpl,
    });

    const inFlight = client.getProducts(); // will 401 after 40ms
    await delay(5);
    await client.logout();

    await expect(inFlight).rejects.toMatchObject({ status: 401 });
    expect(backend.state.refreshCalls).toBe(0); // logout suppressed the refresh
    expect(onSessionInvalid).not.toHaveBeenCalled(); // logout is not a session death
    expect(storage.current()).toBeNull();
  });

  it('auth state is not resurrected by a refresh resolving after logout', async () => {
    const backend = makeFakeBackend({ refreshDelayMs: 50 });
    const storage = makeStorage({ accessToken: 'expired', refreshToken: 'R1' });
    const onSessionInvalid = vi.fn();
    const client = createApiClient({
      baseUrl: BASE,
      ...storage,
      onSessionInvalid,
      fetchImpl: backend.fetchImpl,
    });

    const inFlight = client.getProducts(); // 401 → refresh (takes 50ms)
    await delay(15); // refresh is now in flight
    await client.logout();

    await expect(inFlight).rejects.toMatchObject({ status: 401 });
    expect(backend.state.refreshCalls).toBe(1);
    expect(storage.current()).toBeNull(); // rotated pair was discarded, not persisted
    expect(onSessionInvalid).not.toHaveBeenCalled();
  });

  it('login persists the pair and getProducts uses it', async () => {
    const backend = makeFakeBackend();
    const storage = makeStorage(null);
    const client = createApiClient({
      baseUrl: BASE,
      ...storage,
      onSessionInvalid: vi.fn(),
      fetchImpl: (async (input: URL | RequestInfo, init?: RequestInit) => {
        if (String(input) === `${BASE}/auth/login`) {
          backend.state.validAccess.add('A-login');
          return jsonResponse(200, authPayload('A-login', 'R-login'));
        }
        return backend.fetchImpl(input, init);
      }) as typeof fetch,
    });

    const auth = await client.login('test@ornek.com', 'Test1234!');
    expect(auth.user.email).toBe('test@ornek.com');
    expect(storage.current()).toEqual({ accessToken: 'A-login', refreshToken: 'R-login' });
    await expect(client.getProducts()).resolves.toMatchObject({ total: 0 });
    expect(backend.state.refreshCalls).toBe(0);
  });
});

describe('updateStock guard', () => {
  it('refuses to send non-integer or negative stock', async () => {
    const backend = makeFakeBackend();
    const storage = makeStorage({ accessToken: 'A', refreshToken: 'R' });
    const client = createApiClient({
      baseUrl: BASE,
      ...storage,
      onSessionInvalid: vi.fn(),
      fetchImpl: backend.fetchImpl,
    });
    await expect(client.updateStock(1, Number.NaN)).rejects.toBeInstanceOf(ApiError);
    await expect(client.updateStock(1, -1)).rejects.toBeInstanceOf(ApiError);
    await expect(client.updateStock(1, 1.5)).rejects.toBeInstanceOf(ApiError);
    expect(backend.state.productCalls).toBe(0);
  });
});

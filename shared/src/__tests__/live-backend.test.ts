/**
 * Live integration exercise against the RUNNING StokMate backend (http://localhost:5080).
 * Excluded from `npm test`; run explicitly with the backend up:
 *
 *   npm run test:live --workspace shared
 *
 * Uses the seeded test user. Restart-safe: everything here is read-only except
 * token issuance/rotation, which the backend re-seeds on restart anyway.
 */
import { describe, expect, it, vi } from 'vitest';
import { createApiClient, type TokenPair } from '../api/client';

// No @types/node in this framework-free package — read env via globalThis.
const BASE =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.STOKMATE_API_URL ?? 'http://localhost:5080';
const EMAIL = 'test@ornek.com';
const PASSWORD = 'Test1234!';

function makeStorage(initial: TokenPair | null = null) {
  let pair = initial;
  return {
    getTokens: () => pair,
    persistTokens: (next: TokenPair | null) => {
      pair = next;
    },
    current: () => pair,
    corruptAccessToken: () => {
      if (pair) pair = { ...pair, accessToken: 'deadbeefdeadbeefdeadbeefdeadbeef' };
    },
  };
}

describe('live backend', () => {
  it('login → product list → product detail', async () => {
    const storage = makeStorage();
    const client = createApiClient({
      baseUrl: BASE,
      ...storage,
      onSessionInvalid: vi.fn(),
    });

    const auth = await client.login(EMAIL, PASSWORD);
    expect(auth.user.email).toBe(EMAIL);
    expect(auth.accessToken).toMatch(/^[0-9a-f]{32}$/);
    expect(storage.current()?.accessToken).toBe(auth.accessToken);

    const page = await client.getProducts({ pageSize: 5 });
    expect(page.total).toBeGreaterThan(0);
    expect(page.items.length).toBe(5);
    expect(page.pageSize).toBe(5);
    const first = page.items[0]!;
    expect(typeof first.price).toBe('number');
    expect([1, 2, 3, 4]).toContain(first.unit);

    const detail = await client.getProduct(1);
    expect(detail.id).toBe(1);
    // The three detail-only fields the PUT round-trip depends on:
    expect(typeof detail.costPrice).toBe('number');
    expect(typeof detail.supplierId).toBe('number');
    expect(typeof detail.description).toBe('string');
  });

  it('wrong credentials → normalized ApiError with the Turkish text body', async () => {
    const storage = makeStorage();
    const client = createApiClient({ baseUrl: BASE, ...storage, onSessionInvalid: vi.fn() });
    await expect(client.login(EMAIL, 'wrong-password')).rejects.toMatchObject({
      status: 401,
      message: 'E-posta veya şifre hatalı.',
    });
  });

  it('unknown product id → normalized 404 with backend message preserved', async () => {
    const storage = makeStorage();
    const client = createApiClient({ baseUrl: BASE, ...storage, onSessionInvalid: vi.fn() });
    await client.login(EMAIL, PASSWORD);
    await expect(client.getProduct(9999)).rejects.toMatchObject({
      status: 404,
      message: '9999 numaralı ürün bulunamadı.',
    });
  });

  it('dead access token → single-flight refresh (real rotation) → concurrent requests all succeed', async () => {
    const storage = makeStorage();
    let refreshCalls = 0;
    const countingFetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
      if (String(input).endsWith('/auth/refresh')) refreshCalls += 1;
      return fetch(input, init);
    }) as typeof fetch;

    const onSessionInvalid = vi.fn();
    const client = createApiClient({
      baseUrl: BASE,
      ...storage,
      onSessionInvalid,
      fetchImpl: countingFetch,
    });

    await client.login(EMAIL, PASSWORD);
    const refreshTokenBefore = storage.current()!.refreshToken;
    storage.corruptAccessToken(); // simulate expiry: next requests 401

    // Concurrent 401s against the REAL rotating refresh token: single-flight is
    // the only reason this cannot race itself to death.
    const [a, b, c] = await Promise.all([
      client.getProducts({ pageSize: 1 }),
      client.getProduct(1),
      client.me(),
    ]);
    expect(a.items.length).toBe(1);
    expect(b.id).toBe(1);
    expect(c.email).toBe(EMAIL);
    expect(refreshCalls).toBe(1);
    expect(storage.current()!.refreshToken).not.toBe(refreshTokenBefore); // rotated + persisted
    expect(onSessionInvalid).not.toHaveBeenCalled();
  });

  it('refresh with a dead pair → session cleared + onSessionInvalid (backend-restart shape)', async () => {
    const storage = makeStorage({
      accessToken: 'deadbeefdeadbeefdeadbeefdeadbeef',
      refreshToken: 'deadbeefdeadbeefdeadbeefdeadbeef',
    });
    const onSessionInvalid = vi.fn();
    const client = createApiClient({ baseUrl: BASE, ...storage, onSessionInvalid });

    await expect(client.getProducts()).rejects.toMatchObject({ status: 401 });
    expect(onSessionInvalid).toHaveBeenCalledTimes(1);
    expect(storage.current()).toBeNull();
  });

  it('logout revokes: the old pair is unusable afterwards', async () => {
    const storage = makeStorage();
    const client = createApiClient({ baseUrl: BASE, ...storage, onSessionInvalid: vi.fn() });
    const auth = await client.login(EMAIL, PASSWORD);
    await client.logout();
    expect(storage.current()).toBeNull();

    // The revoked pair must be dead server-side too.
    const revived = makeStorage({ accessToken: auth.accessToken, refreshToken: auth.refreshToken });
    const onSessionInvalid = vi.fn();
    const revivedClient = createApiClient({ baseUrl: BASE, ...revived, onSessionInvalid });
    await expect(revivedClient.me()).rejects.toMatchObject({ status: 401 });
    expect(onSessionInvalid).toHaveBeenCalledTimes(1);
  });
});

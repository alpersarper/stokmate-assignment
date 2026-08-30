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

  it('stock update domain rule: Active/Passive allowed, Discontinued → 409, stock unchanged (DOMAIN/API-003)', async () => {
    const storage = makeStorage();
    const client = createApiClient({ baseUrl: BASE, ...storage, onSessionInvalid: vi.fn() });
    await client.login(EMAIL, PASSWORD);

    // Product 3 is untouched by the other tests in this file.
    const original = await client.getProduct(3);
    const putBody = (status: 1 | 2 | 3) => ({
      name: original.name,
      sku: original.sku,
      barcode: original.barcode,
      categoryId: original.categoryId,
      brandId: original.brandId,
      supplierId: original.supplierId,
      price: original.price,
      costPrice: original.costPrice,
      stock: original.stock,
      minStock: original.minStock,
      unit: original.unit,
      status,
      description: original.description,
      isFeatured: original.isFeatured,
    });

    try {
      // Active: allowed.
      const active = await client.updateStock(3, original.stock + 1);
      expect(active.stock).toBe(original.stock + 1);

      // Passive: deliberately unchanged behavior — still allowed.
      await client.updateProduct(3, putBody(2));
      const passive = await client.updateStock(3, original.stock + 2);
      expect(passive.stock).toBe(original.stock + 2);

      // Discontinued: terminal operational state — stock update rejected.
      // (The full-replace PUT itself resets stock to the body value, original.stock.)
      await client.updateProduct(3, putBody(3));
      await expect(client.updateStock(3, 999)).rejects.toMatchObject({
        status: 409,
        message: 'Üretimi durdurulmuş ürünün stoğu güncellenemez.',
      });
      const afterConflict = await client.getProduct(3);
      expect(afterConflict.stock).toBe(original.stock); // the rejected PATCH (999) never landed
      expect(afterConflict.status).toBe(3);

      // Unknown product: 404 convention unchanged.
      await expect(client.updateStock(9999, 1)).rejects.toMatchObject({ status: 404 });
    } finally {
      // PUT remains allowed on Discontinued (status itself must stay editable) — restore.
      await client.updateProduct(3, putBody(original.status));
      await client.updateStock(3, original.stock);
    }

    const restored = await client.getProduct(3);
    expect(restored.status).toBe(original.status);
    expect(restored.stock).toBe(original.stock);
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

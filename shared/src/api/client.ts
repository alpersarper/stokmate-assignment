import type {
  AuthResponse,
  Brand,
  Category,
  PagedResult,
  Product,
  ProductDetail,
  ProductListParams,
  ProductStats,
  ProductUpdateBody,
  Supplier,
  UserDto,
} from '../types';
import { ApiError, errorFromResponse, networkError } from './errors';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

type MaybePromise<T> = T | Promise<T>;

export interface ApiClientOptions {
  baseUrl: string;
  /** Platform storage adapter: read the persisted token pair (null when signed out). */
  getTokens: () => MaybePromise<TokenPair | null>;
  /** Platform storage adapter: persist a new pair, or clear with null. */
  persistTokens: (tokens: TokenPair | null) => MaybePromise<void>;
  /**
   * Called exactly once per session death (refresh failed / no refresh token).
   * NOT called on intentional logout(). Platform wires this to its return-to-login navigation.
   */
  onSessionInvalid: () => void;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** false for login/refresh (no Bearer, no 401 recovery). */
  auth?: boolean;
}

export interface ApiClient {
  login(email: string, password: string): Promise<AuthResponse>;
  /** Best-effort server revoke + local clear. Never triggers refresh/retry or onSessionInvalid. */
  logout(): Promise<void>;
  me(): Promise<UserDto>;
  getProducts(params?: ProductListParams): Promise<PagedResult<Product>>;
  getProduct(id: number): Promise<ProductDetail>;
  getProductStats(): Promise<ProductStats>;
  /** Full replace — body must be complete, built from a fresh getProduct(id). */
  updateProduct(id: number, body: ProductUpdateBody): Promise<Product>;
  /** Absolute stock value; the typed signature makes the empty-body-sets-0 trap unrepresentable. */
  updateStock(id: number, stock: number): Promise<Product>;
  getCategories(): Promise<Category[]>;
  getBrands(): Promise<Brand[]>;
  getSuppliers(): Promise<Supplier[]>;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const { baseUrl, getTokens, persistTokens, onSessionInvalid } = options;
  const fetchImpl = options.fetchImpl ?? fetch;

  /**
   * Session epoch. Bumped on login() and logout(). Every request captures the epoch it
   * started under; 401 handling and refresh-persistence are skipped when the epoch has
   * moved on, so stale in-flight requests can neither resurrect a logged-out session
   * nor tear down a newly established one.
   */
  let epoch = 0;

  /** Single-flight refresh: concurrent 401s share one refresh call (rotation makes racing fatal). */
  let refreshInFlight: Promise<boolean> | null = null;

  async function invalidateSession(): Promise<void> {
    await persistTokens(null);
    onSessionInvalid();
  }

  /** Resolves true when a new pair was obtained and persisted; false when the session is dead. */
  function refreshTokens(startEpoch: number): Promise<boolean> {
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = (async () => {
      const tokens = await getTokens();
      if (!tokens?.refreshToken) {
        if (epoch === startEpoch) await invalidateSession();
        return false;
      }
      let response: Response;
      try {
        response = await fetchImpl(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      } catch (cause) {
        // Transient network failure: do NOT kill the session — surface the error instead.
        throw networkError(cause);
      }
      if (!response.ok) {
        // Rotated-away / expired / revoked refresh token: the session is unrecoverable.
        if (epoch === startEpoch) await invalidateSession();
        return false;
      }
      const data = (await response.json()) as AuthResponse;
      if (epoch !== startEpoch) {
        // logout()/login() happened while refreshing — discard, never resurrect.
        return false;
      }
      // Strict rotation: persist BEFORE resolving, or a lost pair is a dead session.
      await persistTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return true;
    })().finally(() => {
      refreshInFlight = null;
    });
    return refreshInFlight;
  }

  async function doFetch(path: string, opts: RequestOptions): Promise<Response> {
    const headers: Record<string, string> = {};
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.auth !== false) {
      const tokens = await getTokens();
      if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    try {
      return await fetchImpl(`${baseUrl}${path}`, {
        method: opts.method ?? 'GET',
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
    } catch (cause) {
      throw networkError(cause);
    }
  }

  async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const startEpoch = epoch;
    let response = await doFetch(path, opts);

    if (response.status === 401 && opts.auth !== false && epoch === startEpoch) {
      const originalError = await errorFromResponse(response);
      const refreshed = await refreshTokens(startEpoch);
      if (!refreshed || epoch !== startEpoch) throw originalError;
      // Retry the original request exactly once with the new access token.
      // A second 401 propagates as-is — never a second refresh for the same request.
      response = await doFetch(path, opts);
    }

    if (!response.ok) throw await errorFromResponse(response);
    if (response.status === 204) return undefined as T;
    try {
      return (await response.json()) as T;
    } catch {
      throw new ApiError(response.status, 'Response body was not valid JSON.');
    }
  }

  function productListQuery(params: ProductListParams): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
    }
    const qs = search.toString();
    return qs ? `?${qs}` : '';
  }

  return {
    async login(email, password) {
      const data = await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      });
      epoch += 1; // new session: detach any stale in-flight 401 handling
      await persistTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return data;
    },

    async logout() {
      const tokens = await getTokens();
      epoch += 1; // intentional logout: stale 401s must not refresh, retry, or invalidate
      await persistTokens(null);
      if (tokens?.refreshToken) {
        try {
          await fetchImpl(`${baseUrl}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(tokens.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
            },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
          });
        } catch {
          // best-effort revoke; local session is already cleared
        }
      }
    },

    me: () => request<UserDto>('/auth/me'),
    getProducts: (params = {}) =>
      request<PagedResult<Product>>(`/products${productListQuery(params)}`),
    getProduct: (id) => request<ProductDetail>(`/products/${id}`),
    getProductStats: () => request<ProductStats>('/products/stats'),
    updateProduct: (id, body) => request<Product>(`/products/${id}`, { method: 'PUT', body }),
    updateStock: (id, stock) => {
      // Contract §8: an absent/NaN stock field silently sets stock to 0 server-side.
      if (!Number.isInteger(stock) || stock < 0) {
        return Promise.reject(
          new ApiError(0, `Refusing to send invalid stock value: ${String(stock)}`),
        );
      }
      return request<Product>(`/products/${id}/stock`, { method: 'PATCH', body: { stock } });
    },
    getCategories: () => request<Category[]>('/categories'),
    getBrands: () => request<Brand[]>('/brands'),
    getSuppliers: () => request<Supplier[]>('/suppliers'),
  };
}

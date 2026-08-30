# StokMate API Contract

Authoritative record of **verified** backend behavior (`api/StokMate`, .NET 8, EF Core InMemory, fixed port `5080`, HTTP only, CORS `*`). Produced from the reviewed API discovery findings (runtime curl battery + full source read, 2026-08-28) and from runtime verification of the one approved backend addition (§3).

**Evidence levels used below**

- **[runtime]** — observed against the running API.
- **[source]** — read from backend source, not triggered at runtime.
- **[doc]** — stated only in `api/StokMate/API.md` / `README.md`.

Everything is [runtime] unless marked otherwise. This document contains no speculative API design. Uncertainties are listed in §12 — do not paper over them in client code.

---

## 1. Scope and provenance

| Part | Provenance |
| --- | --- |
| §2, §4–§11 | Original provided backend, verified by discovery |
| §3 | **Assignment-motivated minimal addition** `GET /products/{id}` (approved decision D1 Option A), runtime-verified after implementation |
| §2a | **Assignment-motivated minimal addition** — rate limiting on product reads (data-freshness directive; `docs/DECISIONS.md` §13), runtime-verified after implementation |
| §12 | Source-only-verified items and remaining uncertainties |

---

## 2. Endpoint inventory

All endpoints require `Authorization: Bearer <accessToken>` except login and refresh. Confirmed against controllers and the served `/swagger/v1/swagger.json`.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/login` | no auth |
| POST | `/auth/refresh` | no auth |
| POST | `/auth/logout` | 204, body `{"refreshToken"}` |
| GET | `/auth/me` | current user |
| GET | `/products` | list + search + filter + sort + pagination |
| GET | `/products/{id}` | **added — see §3** |
| GET | `/products/stats` | `{total, outOfStock, lowStock}` |
| POST | `/products` | 201; not required by the assignment |
| PUT | `/products/{id}` | full replace (§7) |
| PATCH | `/products/{id}/stock` | stock only (§8) |
| DELETE | `/products/{id}` | 204; not required by the assignment |
| GET | `/categories`, `/brands`, `/suppliers` | lookups (§9) |

### 2a. Rate limiting on product reads — assignment addition

> **Not part of the original provided backend.** Added 2026-08-31 for the data-freshness/manual-refresh feature (decision record: `docs/DECISIONS.md` §13). Client-side refresh protections are not a security boundary; the API independently limits unusually frequent refresh-shaped requests.

- **Scope:** `GET /products`, `GET /products/{id}`, `GET /products/stats` only. Auth, lookups, and all write endpoints are unlimited.
- **Limit:** fixed window, **60 requests per 10 seconds**, partitioned by `Authorization` header value (per access token; falls back to client IP when the header is absent). No queueing.
- **Over limit:** `429 text/plain; charset=utf-8` `Çok fazla istek gönderildi. Lütfen kısa bir süre sonra tekrar deneyin.` with a `Retry-After: <seconds>` header. The window resets normally afterwards.
- **Deliberately generous:** legitimate client behavior (15 s list polling, 10 s detail polling, cooldown-gated manual refreshes, pagination bursts) stays far below the limit. Runtime-verified 2026-08-31: 30 sequential reads at 2 req/s → all `200`; a tight loop of 100 requests → exactly the first 60 `200`, the rest `429`; a second session's token unaffected while the first is limited (list and detail share the same per-token budget); lookups, `/auth/me`, and `PATCH /products/{id}/stock` still `200` during a limited window; the same token succeeds again after the window passes; unauthenticated requests still receive the usual `401`.
- **Client obligation:** none in normal operation — a client that respects its own refresh cooldown can never trip this. A `429` is a 4xx: do not auto-retry it in a loop (the clients' retry policy already never retries 4xx).

---

## 3. `GET /products/{id}` — approved minimal addition

> **This endpoint is not part of the original provided backend.** It was added for this assignment under approved decision D1 (Option A) and is not documented in the provided `api/StokMate/API.md`.

**Decision.** Add one read-only endpoint `GET /products/{id}` returning `ProductDetailDto` = the 16 `ProductDto` fields (§5) **plus** `costPrice` (int kuruş), `supplierId` (int), `description` (string, `""` when empty).

**Intent.** The assignment mandates product-detail screens "loaded from the actual API" on both clients, and web edits persisted via the API. The original backend had no product-by-id read, while its only whole-product write (`PUT`, §7) is a full replace requiring `costPrice`, `supplierId`, `description` — three fields no read endpoint returned. Discovery proved at runtime that any legal client PUT therefore silently overwrote real data. This addition closes exactly that gap: detail screens get a real API source and PUT becomes losslessly round-trippable.

**Constraints.** Read-only; one controller action + one DTO + one service method following existing backend patterns; no change to any other endpoint's behavior; error behavior matches existing conventions.

**Non-goals.** No general backend redesign, no new write paths, no concurrency mechanism, no changes to list/PUT/PATCH semantics.

**Runtime-verified contract** (verification performed on 2026-08-28 against the running backend):

- `GET /products/7` with valid bearer → `200 application/json`:

  ```json
  {"costPrice":9200,"supplierId":2,"description":"Çaykur Filiz Çay 500 g. İçecek kategorisinde raf ürünü; Ege Toptan Ticaret Ltd. Şti. tarafından tedarik edilir.",
   "id":7,"name":"Çaykur Filiz Çay 500 g","sku":"ICE-1007","barcode":"8690637010073",
   "imageUrl":"https://picsum.photos/seed/7/400/400","categoryId":1,"categoryName":"İçecek",
   "brandId":7,"brandName":"Çaykur","price":11500,"stock":12,"minStock":15,
   "unit":4,"status":1,"isFeatured":false,"updatedAt":"2026-08-10T02:11:50.398682Z"}
  ```

- Unknown id: `GET /products/9999` → `404 text/plain` `9999 numaralı ürün bulunamadı.` — identical convention to PUT/PATCH/DELETE 404s.
- No auth header → `401 text/plain` `Yetkilendirme başlığı eksik veya hatalı.`; invalid token → `401 text/plain` `Erişim anahtarı geçersiz veya süresi dolmuş.` — identical to all other protected endpoints.
- Non-integer id (`/products/abc`) → `404`, empty body (route constraint `{id:int}` — unknown-route behavior, unchanged).
- Regression checks: `GET /products/stats` unaffected (route precedence intact); list DTO unchanged (still exactly 16 fields); lossless round-trip proved — `GET /products/7` → PUT back with only `price` changed → `costPrice`, `supplierId`, `description`, `barcode`, `isFeatured` all preserved.
- Observable side effect of adding the route: `GET /products/{id}` no longer returns 405, and the `Allow` header on a 405 (e.g. `POST /products/7`) is now `DELETE, GET, PUT`.

**Client obligation:** the web edit flow must build its PUT body from this endpoint's response (fresh read → user edits → full body back). See §7.

---

## 4. Authentication

### Login — `POST /auth/login`

Request `{"email","password"}` (email trimmed + lowercased server-side). Response `200`:

```json
{"accessToken":"<32-hex>","refreshToken":"<32-hex>",
 "expiresAt":"<UTC ISO-8601>","user":{"id":1,"email":"test@ornek.com","fullName":"Deniz Yılmaz"}}
```

- Tokens are **opaque** (not JWTs) — nothing is decodable client-side.
- Access token lifetime **15 minutes** (empirically confirmed end-to-end); `expiresAt` = issue time + 15:00. Refresh token lifetime **7 days**.
- Failures (all `text/plain`): empty fields → `400` `E-posta ve şifre zorunludur.`; wrong credentials → `401` `E-posta veya şifre hatalı.`; malformed JSON → `400` `İstek geçersiz veya eksik alan içeriyor.`

### Bearer mechanism

`Authorization: Bearer <accessToken>` on every protected endpoint. Missing/malformed header → `401` `Yetkilendirme başlığı eksik veya hatalı.`; invalid **or expired** token → `401` `Erişim anahtarı geçersiz veya süresi dolmuş.` The expired-token body is byte-identical to the invalid-token body — clients cannot distinguish expiry from revocation. No `WWW-Authenticate` header.

### Refresh — `POST /auth/refresh`

Request `{"refreshToken"}` → `200` with the **same shape as login** (new access + new refresh token).

- **Strict rotation:** the used refresh token is revoked in the same call. Replaying it → `401` `Yenileme anahtarı geçersiz veya süresi dolmuş.` Clients must persist the new pair *before* treating the refresh as complete; a lost response is a dead session.
- Refreshing does **not** invalidate previously issued access tokens.
- Empty token → `400` `Yenileme anahtarı zorunludur.`

### Logout — `POST /auth/logout`

Bearer auth + `{"refreshToken"}` → `204` (always succeeds, even for already-revoked tokens).

- Revokes the supplied refresh token **and drops ALL of the user's access tokens across every client/session**. Other sessions' refresh tokens survive and can mint new access tokens.
- **Client obligation:** with one shared test user, logout on web instantly 401s mobile mid-use (and vice versa). A centralized **401 → refresh → retry** interceptor is required plumbing on both clients, not an enhancement. Refresh must be single-flight (concurrent refreshes are fatal under rotation).

### Session invalidation summary

Dead access token → `401`; recover via refresh; if refresh also 401s (rotated away, expired, revoked, or backend restarted) the session is unrecoverable → return to login.

---

## 5. Product list — `GET /products`

Response envelope: `{"items":[...],"total":<int>,"page":<int>,"pageSize":<int>}`.

`ProductDto` — exactly these 16 fields, none ever `null`:

`id`, `name`, `sku`, `barcode`, `imageUrl`, `categoryId`, `categoryName`, `brandId`, `brandName`, `price`, `stock`, `minStock`, `unit`, `status`, `isFeatured`, `updatedAt`

- `costPrice`, `supplierId`, `description`, `createdAt` are **not** in the list DTO (fetch via §3 when needed).
- `barcode`/`description` may be `""`, never null. `imageUrl` always set (`picsum.photos` — requires internet).
- `unit` and `status` are **numbers**: unit `1`=Adet, `2`=Kg, `3`=Lt, `4`=Paket; status `1`=Aktif, `2`=Pasif, `3`=Üretim Durduruldu.
- `price` (and `costPrice`) are **integers in kuruş** (`3950` = ₺39,50). `stock`/`minStock` are integers (no decimal stock, even for Kg/Lt units).
- Default ordering: `name` ascending (server-defined collation, §12) with `id` tiebreaker → stable page boundaries.
- Datetimes are UTC ISO-8601 with `Z`.
- Seed data: 80 products / 8 categories / 12 brands / 6 suppliers / 1 user, re-seeded on every startup.

`GET /products/stats` → `{"total","outOfStock","lowStock"}` where lowStock = `0 < stock <= minStock`, outOfStock = `stock == 0`. Together with per-product `minStock`, this is a **verified low-stock signal** (relevant to UX-008).

### Query parameters — search / filter / sort

All optional, all combinable (AND semantics, verified):

| Param | Behavior |
| --- | --- |
| `q` | Case-insensitive **substring** match on `name` OR `sku` OR `barcode`. Trimmed server-side; empty/whitespace = no filter; no match → `200` with `items: []`. |
| `categoryId` | Single int, exact match. Unknown id → `200` empty (not 404). Non-numeric → `400`. |
| `brandId` | Same contract as `categoryId`. |
| `status` | `1\|2\|3`. Undefined value (e.g. `99`) → `400`. (Enum names also happen to work — do not rely on it.) |
| `sort` | `name` (default) \| `price` \| `stock` \| `updatedAt`; case-insensitive; unrecognized → name. |
| `dir` | `asc` (default) \| `desc`; anything else → asc. |

**Single-value only.** Repeating a param does not error and does not OR — the first value wins. The API has no multi-select filtering.

### Pagination

| Param | Default | Rules |
| --- | --- | --- |
| `page` | 1 | 1-based; `< 1` silently treated as 1; non-numeric → `400`. |
| `pageSize` | 20 | `< 1` → 20; **silently clamped to 100** above 100. |

Response echoes *effective* `page`/`pageSize` after clamping. **No `totalPages` / `hasNext`** — compute `ceil(total / pageSize)` client-side. Out-of-range pages return `200` with `items: []` and the true `total` (not an error).

---

## 6. Product detail

Use `GET /products/{id}` (§3). The original backend had no detail read; that gap and its resolution are recorded in §3 and `docs/DECISIONS.md`.

---

## 7. Product update — `PUT /products/{id}`

**Full replace.** Body: `name, sku, barcode?, categoryId, brandId, supplierId, price, costPrice, stock, minStock, unit, status, description?, isFeatured?`. Success → `200` with the updated 16-field `ProductDto`; `updatedAt` refreshed.

- **Omitted fields are NOT preserved — they take C# defaults.** Runtime-proved: omitting `price` set it to `0`; omitting `barcode` wiped it to `""`; omitting `isFeatured` reset it to `false`. There are no partial-update semantics.
- **Client obligation:** always send the complete object, built from a fresh `GET /products/{id}` (§3) plus the user's edits. Never send a diff. Round-trip tests should assert `barcode`/`isFeatured`/`costPrice`/`description` survive an edit.

Validation (order: 404 → field validation → relations → SKU conflict; all bodies `text/plain`):

| Case | Response |
| --- | --- |
| Unknown product id | `404` `<id> numaralı ürün bulunamadı.` (takes precedence even over an invalid body) |
| Blank `name` | `400` `Ürün adı zorunludur.` |
| Blank `sku` | `400` `Stok kodu (sku) zorunludur.` [source] |
| `price < 0` | `400` `Fiyat negatif olamaz.` |
| `costPrice < 0` | `400` `Maliyet negatif olamaz.` [source] |
| `stock < 0` | `400` `Stok negatif olamaz.` |
| `minStock < 0` | `400` `Minimum stok negatif olamaz.` [source] |
| `unit` ∉ 1–4 | `400` `Geçersiz birim değeri.` |
| `status` ∉ 1–3 | `400` `Geçersiz durum değeri.` |
| Unknown `categoryId`/`brandId`/`supplierId` | `400` `<id> numaralı kategori/marka/tedarikçi bulunamadı.` |
| `sku` used by another product | `409` `'<sku>' stok kodu başka bir üründe kullanılıyor.` |
| Type errors (decimal in int field, malformed JSON) | `400` generic `İstek geçersiz veya eksik alan içeriyor.` |

Constraints on assignment-editable fields: `price` int kuruş ≥ 0; `stock` int ≥ 0 (int32); `status` exactly 1/2/3; `name` non-blank, trimmed, no length limit found. Numbers-as-strings are accepted by the JSON binder — do not rely on it.

---

## 8. Stock update — `PATCH /products/{id}/stock`

Dedicated endpoint; stock is updatable fully independently (primary mobile workflow is first-class).

- Request `{"stock": <int ≥ 0>}` — an **absolute replacement**, not a delta. `0` is valid.
- Response `200` with the **full updated `ProductDto`**; `updatedAt` refreshed.
- Errors: negative → `400` `Stok negatif olamaz.`; unknown id → `404` `<id> numaralı ürün bulunamadı.`; `null`/decimal/overflow → generic `400`.
- **Discontinued rule — assignment decision (added 2026-08-30, not part of the original provided backend; see `docs/DECISIONS.md` §12).** When the product's `status` is `3` (Üretim Durduruldu), the stock update is **rejected**: `409 text/plain` `Üretimi durdurulmuş ürünün stoğu güncellenemez.`, stock unchanged, `updatedAt` unchanged. Statuses `1` (Aktif) and `2` (Pasif) accept stock updates exactly as before. `PUT /products/{id}` is deliberately **not** restricted — `status` itself stays editable, so Discontinued is reversible through product edit, after which stock updates work again. Runtime-verified 2026-08-30 (curl battery + `npm run test:live --workspace shared`): Active → 200; Passive → 200; Discontinued → 409 with stock unchanged; unknown id → 404 and auth behavior unchanged.
- **Trap — client obligation:** an empty body `{}` is accepted and **silently sets stock to 0** (field binds to default). Clients must guarantee the `stock` field is always present and numeric before sending. Never generate this request.
- Missing `Content-Type: application/json` → `415` with a **JSON ProblemDetails** body — the only known non-plain-text error.

---

## 9. Lookups

- `GET /categories` → `[{id, name, slug, sortOrder}]`, ordered by `sortOrder` then name; 8 rows.
- `GET /brands` → `[{id, name}]`, ordered by name; 12 rows.
- `GET /suppliers` → `[{id, name, contactName, phone, email, city}]`, ordered by name; 6 rows.

All require Bearer auth; all return bare arrays (no paging envelope).

---

## 10. Errors — consolidated contract

**Error bodies are Turkish plain text (`text/plain; charset=utf-8`), not JSON.** Clients must read non-2xx bodies with `response.text()` — calling `response.json()` on an error will throw. Messages are human-readable but unstructured: no error codes, no machine-readable field names.

| Situation | Status | Body |
| --- | --- | --- |
| Domain validation | 400 | Specific Turkish sentence (§7 matrix) |
| Model-binding failure (malformed JSON, wrong type, undefined enum, overflow) | 400 | Always generic `İstek geçersiz veya eksik alan içeriyor.` |
| Missing/malformed auth header | 401 | `Yetkilendirme başlığı eksik veya hatalı.` |
| Invalid/expired access token | 401 | `Erişim anahtarı geçersiz veya süresi dolmuş.` |
| Bad credentials | 401 | `E-posta veya şifre hatalı.` |
| Invalid/rotated/expired refresh token | 401 | `Yenileme anahtarı geçersiz veya süresi dolmuş.` |
| Unknown product id | 404 | `<id> numaralı ürün bulunamadı.` |
| Unknown route / non-int id segment | 404 | **Empty body** |
| Wrong method on existing route | 405 | **Empty body**, `Allow` header |
| SKU conflict | 409 | `'<sku>' stok kodu başka bir üründe kullanılıyor.` |
| Stock update on a Discontinued product (**assignment addition**, §8) | 409 | `Üretimi durdurulmuş ürünün stoğu güncellenemez.` |
| Product-read rate limit exceeded (**assignment addition**, §2a) | 429 | `Çok fazla istek gönderildi. Lütfen kısa bir süre sonra tekrar deneyin.` + `Retry-After` header |
| Missing `Content-Type` on body request | 415 | **JSON** ProblemDetails (only non-plain-text case) |
| Unexpected server error | 500 | `Beklenmeyen bir hata oluştu.` **[source]** (§12) |

Client obligations: centralize text-body error reading; expect empty bodies on 404-route/405; do not string-match Turkish messages for control flow beyond known, reliably identifiable cases (see localization policy, `docs/UX_DECISIONS.md` UX-009); prevent generic binding 400s via local validation.

---

## 11. Concurrency and persistence

**No concurrency protection exists.** Verified exhaustively:

- No version/rowversion/concurrency-token fields in entities or DTOs; no ETag/Last-Modified; `If-Match` is ignored (stale value → `200`); no 412 path; no `updatedAt` precondition.
- **Lost updates confirmed at runtime:** two PUTs from the same stale read both return 200 — last write wins. Same for PATCH stock. A full-form PUT silently clobbers a stock PATCH that landed in between (stock is inside the PUT body).
- `409` exists for SKU uniqueness and (assignment addition, §8) for stock updates on Discontinued products. The Discontinued rule is a **domain-state** rejection that does protect stale clients from writing stock to a product discontinued elsewhere; neither 409 is a general stale-write/version signal. Writes otherwise remain last-write-wins.
- `updatedAt` is **observable state only** — returned and refreshed on every write, never checked. It is the only change-detection primitive (poll/refetch); it can reduce staleness windows, not prevent lost updates.
- **Client obligation:** do not invent a client-side concurrency protocol. Mitigate at UX level only (edit from a fresh read, refetch after writes, document the limitation).

**Everything is in-memory.** Backend restart wipes all data mutations *and* all access + refresh tokens, then re-seeds pristine data. A persisted client session dies on restart: clients must handle "valid-looking token, immediate 401, refresh also 401" by returning to login gracefully.

---

## 12. Source-only-verified items and remaining uncertainties

**Source-only (not runtime-triggered):**

- The `500` handler and its body `Beklenmeyen bir hata oluştu.` (`ExceptionMiddleware`) — no 500 was triggerable without modifying the backend. Treat the 500 body as expected-but-unconfirmed; the generic-fallback obligation stands regardless.
- Four `400` validation messages marked [source] in §7 (blank `sku`, negative `costPrice`/`minStock`) — same code path as the runtime-verified ones.

**Remaining uncertainties (do not build behavior on these):**

- **Turkish dotted/dotless-I search folding is host-locale-dependent.** On the discovery host `FILIZ` matched `Filiz` but `fıliz` did not; under a `tr-TR` process culture the results would differ. Treat I/İ/ı/i matching as **server-defined**; pass user input through untouched; do not re-filter client-side.
- **Name-sort collation is server-defined** (host culture; observed `Çaykur` < `Coca-Cola`). The contract promises "server-defined alphabetical order", not a specific collation. Do not re-sort client-side.
- **Currency (TRY/₺) is [doc]-only.** No response carries a currency field; kuruş semantics and ₺ come from `api/StokMate/API.md`. Clients display TRY per the provided documentation — this is a documented assumption, not runtime-verified metadata.

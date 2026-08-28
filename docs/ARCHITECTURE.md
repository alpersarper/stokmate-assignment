# StokMate Architecture

Approved technical architecture for the StokMate assignment, produced from reviewed discovery findings and coordinator decisions (2026-08-28). API-dependent choices below are grounded in the **verified** `docs/API_CONTRACT.md`; every API-dependent item the Architecture Scout left pending has been resolved against it. Reviewer-facing rationale summaries live in `docs/DECISIONS.md`; user-facing behavior is owned by `docs/UX_DECISIONS.md`.

Guiding principle: the smallest architecture that satisfies the assignment, the UX decisions, the verified API contract, and the required acceptance criteria. Nothing exists here to look sophisticated.

---

## 1. Monorepo structure and package ownership

**Decision.** One npm-workspaces monorepo, flat layout:

```
/
├── api/StokMate/        provided backend (+ the one approved endpoint, see API_CONTRACT.md §3)
├── docs/                project documents
├── shared/              @stokmate/shared — types, api-core, query keys, shared utils
├── web/                 Vite + React + TypeScript app
├── mobile/              Expo (managed) + TypeScript app
├── package.json         workspaces: ["shared", "web", "mobile"]
└── README.md            candidate-facing
```

**Intent.** npm ships with Node — zero evaluator setup beyond `npm install`; first-class workspace support; fewest React Native/Metro edge cases (pnpm's isolated layout still occasionally fights Metro; its standard mitigation reproduces npm's layout anyway).

- `shared` ships **TypeScript source directly** (`"main": "./src/index.ts"`): Vite transpiles workspace TS, Metro compiles through Babel regardless. No build step, no project references, no compiled artifacts.
- Root scripts orchestrate: `dev:web`, `dev:mobile`, `typecheck` (per-workspace `tsc --noEmit`), `lint`, `build:web`. Single root `package-lock.json`, committed.
- Ownership: `web/` — Web Agent; `mobile/` — Mobile Agent; `shared/` and root tooling — Foundation Agent (coordinated changes only afterwards); `api/StokMate` — frozen except the approved endpoint.

**Non-goals.** No Nx/Turborepo/Lerna; three workspaces need `npm run` scripts, not a build graph.

## 2. Shared-code boundaries (`@stokmate/shared`)

**Decision.** Share only framework-free code whose behavior is genuinely identical on both platforms:

| Module | Contents |
| --- | --- |
| `types` | `Product`, `ProductDetail` (adds `costPrice`, `supplierId`, `description`), `PagedResult<T>`, auth request/response shapes, lookup types, enum value→label maps for `unit` (1–4) and `status` (1–3) per the verified contract |
| `api-core` | `createApiClient({ baseUrl, getTokens, persistTokens, onSessionInvalid })` — fetch wrapper, Bearer injection, text/plain error normalization → `ApiError { status, message }`, single-flight 401→refresh→retry; typed endpoint functions (`login`, `getProducts`, `getProduct`, `updateProduct`, `updateStock`, lookups, …) |
| `query-keys` | key factory: `keys.products.list(filters)`, `keys.products.detail(id)`, `keys.lookups.*` — consistent invalidation semantics across apps |
| `utils` | kuruş→₺ display formatting (integer math, `Intl`, no floats), stock-input normalization (string → valid non-negative int) |

**Explicitly not shared:** UI components, React-DOM/Native-touching hooks, navigation, form logic, snackbar systems, storage implementations (web `localStorage`/`sessionStorage` vs mobile `expo-secure-store` — each app passes its own adapter into `api-core`), lifecycle behavior, platform configuration.

**Intent.** One source of truth for the wire format and the auth/refresh/error plumbing that both clients must get exactly right; everything platform-flavored stays in its app. Optionally shared later if trivial: TanStack `queryOptions()` builders.

## 3. API-client boundaries

- **`fetch` only** — native on both platforms; no axios.
- One client instance per app, constructed at startup with platform adapters. Components never call `fetch`; TanStack Query hooks call the typed endpoint functions from `api-core`.
- **Error normalization is centralized and text-aware** (verified: error bodies are Turkish `text/plain`, except 415-JSON and empty-body 404/405 — see API_CONTRACT.md §10). Non-2xx → read body as text → `ApiError { status, message }`. UI layers map: 401 → session flow; 400/409 → surfaced per localization policy (§9); else → generic error state.
- The client never generates the dangerous requests the contract forbids: stock PATCH bodies always carry a validated numeric `stock`; PUT bodies are always complete objects built from a fresh `GET /products/{id}`.

## 4. Authentication and session architecture

Grounded in verified behavior: opaque tokens, 15-min access / 7-day refresh, **strict rotation**, cross-client logout dropping all access tokens, in-memory sessions dying on backend restart (API_CONTRACT.md §4, §11).

- **Session state:** a small `AuthProvider` context per app holding `{ user, status }`; tokens live in the storage adapter, not React state. TanStack Query is not used for session state.
- **401 → refresh → retry, centralized in `api-core`:** single-flight (mutexed — rotation makes concurrent refreshes fatal: the second uses a revoked token), persist the new pair before resolving, retry the original request once; refresh failure ⇒ `onSessionInvalid()` → clear storage → login. Reactive-only; no proactive `expiresAt` timers. This is required plumbing: logout on one client instantly 401s the other mid-use.
- **Web persistence (UX-007 Remember me):** remember → `localStorage`; not → `sessionStorage`. XSS caveat documented in README; an in-memory + refresh-cookie scheme is disproportionate here.
- **Mobile persistence:** `expo-secure-store`; remember → persist tokens, not → memory only.
- **Backend-restart handling:** a persisted, valid-looking session may 401 on first call with refresh also failing — the session-invalid path must handle this gracefully (return to login without error spam).
- **Logout:** best-effort `POST /auth/logout` (always 204), always clear local session, replace navigation history (web `navigate('/login', {replace:true})` + guard; mobile stack reset). UX-003 unsaved-changes confirmation applies first.
- **Route guarding:** web `RequireAuth` wrapper; mobile renders Login vs App navigator on auth status.

## 5. TanStack Query organization (v5)

- One `QueryClient` per app; defaults: `retry` 1 for queries but **never retry 4xx**, `refetchOnWindowFocus: true` on web, `staleTime` ~15–30 s for lists, long for lookups (effectively static).
- Queries: `products.list(filters)`, `products.detail(id)` (backed by the verified `GET /products/{id}`), `lookups.categories`, `lookups.brands`.
- **Pagination/filter UX:** `placeholderData: keepPreviousData` on the list query — satisfies UX-001/UX-006 "keep existing results visible" natively; `isPlaceholderData`/`isFetching` drives lightweight loading feedback. Verified pagination shape: 1-based `page`, `pageSize` clamp at 100, no `totalPages` → compute `ceil(total/pageSize)` client-side; out-of-range pages return empty items, not errors.
- **Stale-response protection** comes free: each filter combination is its own query key; late responses land under their own key.
- Mutations: `updateProduct` (PUT, full object from fresh detail read), `updateStock` (PATCH). On success: `setQueryData` on the detail key from the returned full product (verified: PUT and PATCH both return the complete `ProductDto`) + `invalidateQueries` on the list — the active list reflects persisted server state, as the assignment requires. **No optimistic updates** — the UX decisions require displaying persisted server state after save; optimism buys nothing and adds rollback complexity.
- **Optional cross-client-refresh bonus (web, only after required work is stable):** `refetchInterval` ~15 s on the mounted list query + `refetchOnWindowFocus`. Zero backend change; `keepPreviousData` keeps it visually calm. Verified constraint: this reduces staleness windows only — nothing can prevent lost updates (§13).

## 6. Web application

**Vite + React + TypeScript (strict), SPA.** Feature-folder-lite structure (`api/`, `auth/`, `products/`, `components/`, `lib/`, `i18n/`), three routes: `/login`, `/products`, `/products/:id` (+ `/` redirect).

- **Routing: React Router** (declarative mode). `useSearchParams` holds list state (search/filters/page) in the URL — UX-006 "returning from detail preserves search, filters, page" for free, survives reload, doubles as the query-key input. 300 ms debounce (UX-001) between input state and URL/query-key update. `useBlocker` covers UX-003 navigation blocking.
- **Forms: React Hook Form** for the product edit form — `formState.isDirty` drives Save enablement (UX-002) and the unsaved-changes guard (UX-003); `isSubmitting` prevents duplicate saves. Login form also RHF (trivial, consistent). No schema library: few client-known rules; backend is authoritative. Verified server 400s are Turkish prose without field keys → client-side rules carry inline field validation; server errors surface via the global feedback system per the localization policy (§9). Price editing converts display ₺ ↔ integer kuruş exactly (no floats; decimals are rejected by the API).
- **Application-level fallback** (UX-004): one top-level `ErrorBoundary` with a reload action.

### Web UI — shadcn/ui + Tailwind

**Decision.** shadcn/ui components on Tailwind CSS. (Supersedes the discovery-phase Mantine recommendation.)

**Intent.** Composable accessible primitives whose source is owned locally in the repo — components are easy to inspect, adapt, and review; lightweight customization; a small, understandable UI dependency surface. Repository-aware and LLM-assisted development is an additional benefit, not the primary justification.

**Constraints.** Install only the components the assignment needs (roughly: table, select, button, input, badge, dialog, skeleton, toast/sonner for the UX-004 snackbar queue — top-right, max 3 visible, queued); prefer composition over modifying primitives; modify a primitive only for a concrete product need; keep Tailwind usage consistent; no premature wrapper components; no styling abstraction layers.

**Non-goals.** Not a design-system project; no generic component library grows out of this assignment.

## 7. Mobile application

**Expo (managed workflow) + TypeScript.** Structure mirrors web (`api/`, `auth/`, `products/`, `components/`, `lib/`, `i18n/`, `navigation.tsx`).

- **Navigation: React Navigation native stack** — Login → ProductList → ProductDetail. Expo Router rejected for 3–4 screens.
- **List:** `FlatList` + `RefreshControl` (pull-to-refresh per UX-006, without clearing search), `Pressable` press feedback.
- **Stock editor (UX-005, primary workflow):** a self-contained component owning a local **string** draft, normalization on blur/save via the shared utility, stepper buttons on the parsed value, Save enabled = changed ∧ valid ∧ !saving. Backed by the verified dedicated `PATCH /products/{id}/stock` (absolute value; the client always sends a validated numeric field — the empty-body-sets-0 trap is structurally impossible). No form library.
- **Unsaved-change guard (UX-003):** React Navigation `beforeRemove` + confirm dialog.
- **UI: hand-styled `StyleSheet`, no component kit.** The surface is small (4 screens + snackbar/empty/error states); UX-004's queued bottom snackbars need custom code even with RN Paper; hand-styling keeps dependencies minimal. Fallback if velocity suffers: React Native Paper (escalate first).

## 8. Localization — lightweight EN/TR

**Decision.** Both clients ship `en` and `tr` locales; default English; user-switchable at runtime (persisted per client). No translation backend, no heavy i18n framework — small hand-written typed message catalogs per app, with genuinely shared pieces (enum label maps, formatting helpers) in `shared`.

**What is localized:** application chrome, navigation, buttons/actions, form labels, client-side validation messages, loading/empty states, known error states, status/domain labels (Aktif/Pasif/Üretim Durduruldu ↔ Active/Passive/Discontinued). Currency is always TRY/₺ (`3950` kuruş → `₺39,50`), formatted via `Intl` with integer math — currency is data, not chrome, and is never converted.

**What is not localized:** API data (product/category/brand/supplier names) and arbitrary backend strings. **Error policy:** known, reliably identifiable failures — identified by status code + request context (e.g. login 401, product 404, SKU 409), never by matching Turkish message strings — map to localized client messages; unknown failures get a localized generic fallback (raw server text may be shown as secondary detail). No brittle translation of backend prose.

**Non-goals.** Not an internationalization platform; mandatory assignment requirements always take priority over localization polish. User-facing behavior details are owned by `docs/UX_DECISIONS.md` UX-009.

## 9. Environment configuration and mobile connectivity

- **Web:** `VITE_API_URL`, default `http://localhost:5080`; a `.env` with the default is committed (no secrets exist in this project).
- **Mobile: `EXPO_PUBLIC_API_URL` is the single configurable API base URL.** There is **no in-app Server Settings screen** — configuration over UI surface. Resolution: Android emulator → `http://10.0.2.2:5080` (never assume Android `localhost` is the dev machine); iOS simulator → `http://localhost:5080`; physical device / APK → the dev machine's LAN address, set at build/start time; hosted environment → an HTTPS URL through the same variable, with no application-code change.
- **Cleartext HTTP:** Android 9+ blocks cleartext by default; enable it via `expo-build-properties` (`android.usesCleartextTraffic: true`) **only because** the local/demo backend is HTTP-only on port 5080; HTTPS remains the expected production approach. Without this flag the release APK fails every network call — the most likely "APK doesn't work at the demo" cause.
- Verified: the backend binds to `0.0.0.0:5080` and CORS is fully open, so browser and device calls work without proxying.
- README (final phase) must document: `EXPO_PUBLIC_API_URL`, emulator vs physical-device connectivity, local-network assumptions, cleartext requirement, backend startup, and how the delivered APK was verified.

## 10. Android build / APK strategy

**Decision.** Expo managed + `npx expo prebuild --platform android` + local Gradle `assembleRelease`. Signing: Gradle debug-keystore for the deliverable APK, documented as assignment-grade.

**Intent.** No cloud account/queue dependency (vs EAS Build), reproducible offline, and the evaluator can run the same documented command. Expo managed keeps native config surface minimal while prebuild yields the full native project when Gradle needs it. Local toolchain verified during discovery: Android SDK 36, build-tools 35/36, JDK 17 (must export `JAVA_HOME` explicitly — Homebrew JDK is not registered with `/usr/libexec/java_home`; document in README).

**Constraints.** The APK bakes `EXPO_PUBLIC_API_URL` at build time — README must state the rebuild command for an evaluator's own LAN IP. First Gradle build is slow/network-heavy — run it well before delivery. **APK verification policy:** an APK that merely builds is not verified; final QA must run the actual deliverable APK against the backend on an Android target (startup, reachability, auth, list, detail, stock update, session-expiry recovery). Android connectivity remains an explicit delivery risk until that passes.

## 11. Verification strategy

Lean, matching what the acceptance criteria verify:

- TypeScript **strict** everywhere; root `typecheck` runs all workspaces (required criterion).
- ESLint (flat config) + Prettier; root `lint` kept green.
- **Vitest unit tests for `shared/` only:** error normalization (text/plain → `ApiError`), stock-input normalization, kuruş formatting, query-key factory — plus a PUT-body round-trip shape test (asserting `barcode`/`isFeatured`/`costPrice`/`description` survive an edit, per the contract's loudest trap).
- Manual verification checklist mapped 1:1 to `docs/ACCEPTANCE_CRITERIA.md` (QA-owned). No component-test or E2E infrastructure.

## 12. Backend concurrency limitations (accepted)

Verified: the backend has **no concurrency protection** — no versions, no ETag/If-Match, no preconditions; stale writes succeed; last write wins; `updatedAt` is observable state only (API_CONTRACT.md §11).

**Decision.** Accept last-write-wins; do not invent a client-side concurrency protocol. Mitigations are UX-level only: the edit form initializes from a fresh `GET /products/{id}`; every mutation refetches/updates from the returned server state; the optional polling bonus shortens staleness windows. The limitation is documented for the reviewer (README + `docs/DECISIONS.md`).

## 13. Intentionally rejected complexity

| Rejected | Why |
| --- | --- |
| Next.js / Remix / SSR meta-frameworks | SPA over a local API; SSR infra is pure overhead. CRA deprecated. |
| Redux / Zustand / Jotai / MobX | TanStack Query owns server state (locked decision); remaining client state is one auth context + local component state. |
| axios / ky | `fetch` is native on both platforms; the wrapper is needed either way. |
| OpenAPI type codegen | ~10 hand-written types vs a codegen toolchain requiring a running backend at build time. |
| Nx / Turborepo / Lerna | Three workspaces need scripts, not a build graph. |
| Shared UI component package | Discouraged by `AGENTS.md`; DOM and RN primitives don't share cleanly at this scale. |
| Zod / Yup | Few client-known rules; backend authoritative; RHF built-ins suffice. |
| Formik | Legacy; RHF is smaller and its dirty-tracking maps onto UX-002. |
| Expo Router | File-based routing for 3–4 screens; a plain stack is less magic. |
| TanStack Router | React Router is the boring, universally reviewable default at 3 routes. |
| Heavy i18n framework (i18next etc.) / translation backend | Two locales, small message set — typed catalogs suffice (§8). |
| SSE / WebSockets / SignalR for the bonus | Backend changes + realtime infra the assignment discourages; polling meets the criterion. |
| Optimistic updates | UX requires persisted-server-state display after save; optimism adds rollback for zero required UX. |
| Client-side concurrency protocol (If-Match emulation, updatedAt preconditions) | The backend ignores all preconditions (verified); inventing one would fake safety. |
| E2E frameworks (Playwright, Detox, Maestro) | Acceptance is verified by builds + manual flows per the QA role. |
| MSW / API mocking | A real, seeded, zero-setup backend is provided. |
| Runtime Server Settings screen on mobile | Superseded by `EXPO_PUBLIC_API_URL` policy (§9): configuration over UI surface. |
| Proactive token-refresh timers | Reactive 401→refresh is simpler and sufficient; timers add clock-skew/lifecycle complexity. |
| Husky / CI pipelines | Not required by acceptance criteria; root scripts + QA phase cover verification. |
| Status-filter UI, product create/delete, stats dashboard | API supports them; assignment doesn't ask. (`minStock` + stats remain the verified low-stock signal for UX-008 emphasis.) |

## 14. Key risks

1. **APK ↔ backend connectivity** (top risk): baked LAN IP, shared Wi-Fi, macOS firewall, cleartext flag. Mitigations: cleartext flag from day one, README rebuild instructions, verify the delivery APK on emulator (`10.0.2.2`) and ideally a physical device.
2. **Brittle sessions by design:** in-memory tokens + restart wipes + cross-client logout. The single-flight refresh path must be exercised early on both platforms.
3. **PUT data-loss trap:** any omitted field is silently defaulted (verified). Mitigated structurally (§3, §11 round-trip test).
4. **Metro + npm workspaces:** keep exactly one React/React Native version in the tree; Expo SDK auto-configures monorepos; don't hand-roll Metro config unless forced.
5. **Images need internet** (`picsum.photos`): graceful image fallback so image failures don't read as app failures.
6. **Turkish plain-text server errors** in a localized chrome: normalized once in `api-core`, surfaced per the §8 error policy.

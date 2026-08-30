# StokMate Engineering Decisions

Reviewer-facing summary of the material engineering and product decisions behind this solution, and why they were made. Authoritative details live in the referenced documents: verified backend behavior in `docs/API_CONTRACT.md`, technical architecture in `docs/ARCHITECTURE.md`, user-facing behavior in `docs/UX_DECISIONS.md`. This document summarizes; it does not override them.

---

## 1. Minimal backend addition: `GET /products/{id}`

**Decision.** Add one read-only endpoint returning the full product, including `costPrice`, `supplierId`, `description`. The only backend modification made.

**Intent.** The assignment requires product-detail screens fed from the actual API, and web edits persisted via the API. Discovery proved the provided backend had no product-by-id read, while its only whole-product write (`PUT`) is a full replace requiring three fields no read endpoint returned — so any legal client PUT silently overwrote real data (runtime-proved, not theoretical). The endpoint closes exactly that gap.

**Alternatives considered.** (a) No backend change — render detail from cached list rows and send guessed values for the three blind fields: rejected as silent data corruption and a detail screen not truly fed by the API. (b) Extend the list DTO with the three fields: touches an existing endpoint's contract for every consumer, still no per-id fetch for deep links. (c) Relax PUT to partial-update semantics: a behavioral change to an existing write path — strictly more invasive.

**Trade-off.** The assignment says to avoid backend changes; the assignment's own mandatory requirements made this one necessary. Kept minimal: one controller action + one DTO + one service method, existing patterns and error conventions, no other behavior touched. Contract and runtime evidence: `docs/API_CONTRACT.md` §3.

## 2. npm workspaces monorepo

**Decision.** One repository, three workspaces (`shared`, `web`, `mobile`), npm as the package manager, flat layout.

**Intent.** Two clients sharing types and API plumbing want one dependency tree and one install command. npm ships with Node — zero evaluator setup — and has the fewest React Native/Metro edge cases. The `shared` package ships TypeScript source directly: no build step, no project references.

**Alternatives.** pnpm (faster, but adds an evaluator install step and occasional Metro friction); separate repos/folders without workspaces (duplicated types and client code); Nx/Turborepo (a build graph for three packages — rejected complexity).

## 3. Shared-code boundaries

**Decision.** Share only framework-free code with genuinely identical behavior: API/domain types, the fetch-based API client core (auth header, error normalization, 401→refresh→retry), the query-key factory, and small formatting/normalization utilities. UI, navigation, forms, and storage stay per-app; each app injects its own storage adapter.

**Intent.** The wire format and the auth/refresh/error plumbing must be exactly right in both clients — one implementation each. Forcing UI or navigation into shared abstractions produces lowest-common-denominator components; DOM and React Native don't share cleanly at this scale.

**Non-goal.** No shared UI component package.

## 4. TanStack Query for server state (both clients)

**Decision.** TanStack Query v5 is the only server-state layer on web and mobile; no other state library. (A locked project decision, adopted willingly.)

**Intent.** The app is almost entirely server state. Query keys per filter combination give stale-response protection for free; `keepPreviousData` satisfies the "keep existing results visible while loading" UX decisions natively; mutation → `setQueryData` + list invalidation satisfies "list reflects persisted server state after update". Remaining client state is one auth context and local component state — no Redux/Zustand needed.

**Trade-off.** No optimistic updates by design: the UX decisions require showing persisted server state after save, so optimism would add rollback complexity for nothing.

## 5. shadcn/ui + Tailwind for web UI (instead of Mantine)

**Decision.** Web UI uses shadcn/ui primitives on Tailwind CSS. Supersedes the discovery-phase Mantine recommendation.

**Intent.** shadcn components are vendored into the repository as owned source — inspectable, adaptable, reviewable — with accessible primitives and a small dependency surface. Repository-aware and LLM-assisted development is an additional benefit, not the main justification.

**Alternatives.** Mantine (strong fit for the snackbar/table requirements, but a larger opaque dependency and its own styling system); MUI (heavier); hand-rolled CSS (weakest accessibility for the effort).

**Constraints / Non-goals.** Only the components the assignment needs are installed; composition over modifying primitives; this must not grow into a design-system project.

## 6. Hand-styled mobile UI (no component kit)

**Decision.** React Native `StyleSheet` styling with a few small owned components; no RN Paper or similar kit.

**Intent.** The mobile surface is four screens plus feedback states. The one genuinely hard piece — queued bottom snackbars per UX-004 — needs custom code even with a kit (Paper's Snackbar is single-instance). A kit would add a dependency without removing work.

**Trade-off.** Slightly more styling effort, accepted for the minimal dependency set. Escape hatch: React Native Paper, with escalation first.

## 7. Lightweight EN/TR localization

**Decision.** Both clients ship English (default) and Turkish, user-switchable, via small hand-written typed message catalogs; TRY/₺ formatting wherever currency appears. No i18n framework, no translation backend.

**Intent.** The domain data is Turkish and the evaluator context is Turkish; the chrome defaults to English per project decision. Two locales and a small message set don't justify i18next-class infrastructure.

**Constraints.** API data (product/brand/category names) is never translated. Backend error prose is never string-matched for translation: known failures are identified by status code + request context and mapped to localized messages; unknown failures get a localized generic fallback.

**Non-goal.** Not an internationalization platform. User-facing details: `docs/UX_DECISIONS.md` UX-009.

## 8. `EXPO_PUBLIC_API_URL` instead of a Server Settings screen

**Decision.** The mobile API base URL is configured exclusively via the `EXPO_PUBLIC_API_URL` environment variable (emulator → `10.0.2.2`, physical device → LAN IP, hosted → HTTPS URL — no code change). No in-app server-address UI.

**Intent.** Configuration over UI surface: a settings screen is product surface the assignment never asked for, with validation/persistence/UX costs. The README documents the variable and the APK rebuild command.

**Trade-off.** Changing the API address of a built APK requires a rebuild. Accepted for scope discipline; revisitable if demo logistics demand it.

## 9. Expo prebuild + local Gradle for the APK

**Decision.** Expo managed workflow; APK produced by `expo prebuild` + local `gradlew assembleRelease`, debug-keystore signed (documented as assignment-grade).

**Intent.** No cloud build account or queue; reproducible offline; the evaluator can run the exact same command. Managed workflow keeps native config declarative (including the cleartext-HTTP flag the HTTP-only backend requires); prebuild yields the native project only when Gradle needs it.

**Alternatives.** EAS cloud build (account + upload dependency); bare React Native (permanent native-config maintenance for one-time prebuild output).

**Constraint.** An APK that builds is not "done": final QA verifies the actual deliverable against the backend on an Android target.

## 10. Accepting the backend's missing concurrency protection

**Decision.** Live with verified last-write-wins; build no client-side concurrency protocol.

**Intent.** Discovery verified the backend ignores every precondition (`If-Match` ignored, no versions, no 412/409-on-stale; stale writes return 200). Any client-side "protection" would be fake safety the server doesn't enforce — and inventing API behavior is prohibited.

**Mitigations (UX-level only).** Edit forms initialize from a fresh `GET /products/{id}`; every mutation applies the server's returned state and refetches the list; the optional list-polling bonus shortens staleness windows. The limitation is documented for the reviewer.

## 11. Centralized 401 → refresh → retry

**Decision.** One shared, single-flight authentication interceptor in the API client core: on 401, refresh once (mutexed), persist the new token pair before proceeding, retry the original request once; on refresh failure, invalidate the session and return to login.

**Intent.** This is required plumbing, not an enhancement: access tokens live 15 minutes; refresh tokens rotate strictly (a replayed token kills the session — so concurrent refreshes are fatal); logout on one client instantly invalidates the other client's access tokens; a backend restart wipes all sessions. Without centralized recovery both apps would appear randomly broken mid-use.

**Non-goals.** No proactive expiry timers (clock-skew and lifecycle complexity for no benefit over reactive refresh); no shared token storage between web and mobile (each client owns its session chain).

## 12. Discontinued products cannot receive stock updates

**Decision.** Product status `3` (Üretim Durduruldu / Discontinued) is treated as a terminal *operational* state: `PATCH /products/{id}/stock` on a Discontinued product is rejected by the **backend** with `409 Conflict` (`Üretimi durdurulmuş ürünün stoğu güncellenemez.`) and the stock stays unchanged. Status `1` (Active) allows stock updates as before; status `2` (Passive) is **deliberately unchanged** — the assignment defines no operational restriction for Passive, so inventing one would be scope creep, and Passive products (e.g. seasonally delisted) still legitimately receive deliveries.

**Intent.** An explicit engineering/product assumption made during manual-review stabilization: the API originally allowed stock mutations regardless of status, which lets a store terminal keep booking stock onto a product head office has already discontinued. Enforcing the rule in the backend (not just a disabled button) is what protects against **stale clients**: a mobile device that opened the product while it was Active gets a definitive `409` if it saves after another client discontinued the product, and the app then refetches and shows the Discontinued state with disabled controls.

**Boundaries.** Visibility and mutability are separate concepts — Discontinued products remain readable, listable (via the status filter), and fully editable through `PUT /products/{id}` (so the status itself is reversible; after switching back to Active, stock updates work again). Aside from this one rule, the backend remains last-write-wins with no concurrency protection (see §10). Contract details and runtime evidence: `docs/API_CONTRACT.md` §8.

## 13. Data freshness, protected manual refresh, and product-read rate limiting

**Decision.** Every data surface (web list + detail, mobile list + detail) shows a subtle freshness indicator ("Updated just now / 24 sec ago / 3 min ago / Last updated at 14:32") driven by the time of the last *successful* fetch, plus an explicit cooldown-protected Refresh action. All refresh triggers for a dataset — manual button, mobile pull-to-refresh, background polling, focus/reconnect revalidation, post-mutation invalidation — converge on one TanStack Query pipeline per query key, and the backend independently rate-limits product-read endpoints (60 requests / 10 s fixed window per access token → `429`, scoped to `GET /products*` only).

**Intent.** Refreshing should increase confidence in the data without disrupting work or creating avoidable backend load. TanStack Query's own primitives carry most of the weight: `dataUpdatedAt` is definitionally "last successful fetch" (a failed refresh cannot move the indicator), and joining in-flight fetches (`refetch({ cancelRefetch: false })`) makes single-flight + dedup structural rather than policed. The layered protection is: (1) single in-flight per query, (2) ~4 s client cooldown after a manual refresh, (3) query-level dedup of identical resource+params, (4) backend rate limiting as the independent non-client boundary, (5) bounded retries (retry ≤ 1, never on 4xx — a `429` is 4xx and is never auto-retried), (6) no stacking — both former `refetchInterval` polls (web list 15 s, mobile detail 10 s) were replaced by a scheduler anchored to the last fetch *settle*, so an automatic poll can never fire immediately after a manual/focus/mutation refetch.

**Boundaries.** Refresh preserves user context by construction (same query key → filters, search, sort, page, scroll, and unsaved drafts untouched; the existing snap-to-last-page and dirty-draft reconciliation paths handle invalidated state explicitly). The backend limit is deliberately generous — legitimate polling plus cooldown-paced manual refreshes cannot approach it; only abusive request loops trip it. Contract details and runtime evidence: `docs/API_CONTRACT.md` §2a.

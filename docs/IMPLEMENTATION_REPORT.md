# StokMate Implementation Report

Maintained by the QA / Reporter agent. This pass evaluated the **integrated project on `main`** (`f31affa`) against `docs/ACCEPTANCE_CRITERIA.md`, by execution wherever applicable. Verification date: **2026-08-28**, macOS host, Node 22, backend run from `api/StokMate` via `~/.dotnet/dotnet`.

Verdict vocabulary — **Pass (executed)**: verified by running the flow/command; **Pass (inspected)**: verified by direct code/repo inspection where runtime verification is impractical; **Not verified**: intentionally out of scope this pass (never counted as complete); **Fail**: defect recorded in Known Defects.

## Status

**QA checkpoint (pre-APK, pre-README): all Required backend, web, and mobile criteria pass; all verified Quality/UX criteria pass; all three Optional/Bonus features implemented and pass. 1 cosmetic defect found. APK build/verification and README are the two remaining delivery-phase items (both coordinator-scheduled, not regressions).**

---

## Required Features

### 1. Backend & API contract

| Criterion | Verdict | Evidence (§Verification Evidence) |
| --- | --- | --- |
| Backend under `api/StokMate` starts | Pass (executed) | E1 |
| Test credentials authenticate | Pass (executed) | E1 |
| `docs/API_CONTRACT.md` contains the verified contract | Pass (inspected) | E1 — spot-checks matched (list envelope, 16-field DTO, 19-field detail, lookups, error bodies) |
| Clients use verified endpoints/contracts | Pass (executed) | E2 (shared client live tests), E3–E5 (all client flows hit the real API) |
| No invented API behavior | Pass (inspected) | Shared client implements only contract endpoints; `updateStock` guards the §8 empty-body trap; PUT built from fresh `GET /products/{id}` |
| Necessary backend modification documented | Pass (inspected) | The one addition (`GET /products/{id}`) is documented in `docs/API_CONTRACT.md` §3 and `docs/DECISIONS.md` §1 |

### 2. Required — Web

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| Login screen | Pass (executed) | E3.1 |
| Valid credentials authenticate | Pass (executed) | E3.1 |
| Token/session persisted | Pass (executed) | E3.6 — sessionStorage default, localStorage with Remember me |
| Authenticated requests carry auth | Pass (executed) | E3.2 — all data loads succeed post-login; unauthenticated `/products` is 401 (E1) |
| Invalid+unrenewable session → redirect to login | Pass (executed) | E3.8 — backend restart kills tokens; next request → refresh fails → login redirect with toast |
| Auth failures visibly communicated | Pass (executed) | E3.1 — "Email or password is incorrect." alert |
| No indefinite auth loading | Pass (executed) | E3.1/E3.8 — all failure paths settle; restore logic settles state on every path (`web/src/auth/AuthProvider.tsx`) |
| Products loaded from actual API | Pass (executed) | E3.2 — counts and rows match direct API queries exactly |
| Usable catalog list/table | Pass (executed) | E3.2 — dense table: name+SKU, category, brand, price, stock, status, chevron |
| Search | Pass (executed) | E3.2 — `q=kahve` UI result = API result (1/1) |
| Category filter | Pass (executed) | E3.3 |
| Brand filter | Pass (executed) | E3.3 — combined İçecek+Coca-Cola = 5 = API 5 |
| Pagination per contract | Pass (executed) | E3.4 — Page 1 of 4 over 80 items, pageSize 20, Prev disabled on p1 |
| Search/filter produce correct result set | Pass (executed) | E3.2/E3.3 — verified against direct API calls with same params |
| No full reload for search/filter | Pass (executed) | E3.2 — SPA URL updates (`?q=…&category=…`), no navigation |
| Product opens from list | Pass (executed) | E3.5 |
| Detail loaded from actual API | Pass (executed) | E3.5 — shows `description` (exists only on `GET /products/{id}`) |
| Relevant info displayed | Pass (executed) | E3.5 — name, SKU, status, price, stock, category, brand, minStock, unit, barcode, updatedAt, description, image |
| Name update | Pass (executed) | E3.5 |
| Price update | Pass (executed) | E3.5 — 2450→2575 kuruş |
| Stock update | Pass (executed) | E3.5 — 190→191 |
| Status update | Pass (executed) | E3.5 — 1→2 via controlled select |
| Invalid values handled per API rules | Pass (executed) | E3.5 — blank name / negative price / negative stock blocked inline before request |
| Updates persisted via API | Pass (executed) | E3.5 — confirmed by direct API read-back |
| Detail refreshed after save | Pass (executed) | E3.5 — updatedAt refreshed on screen |
| List reflects server state w/o reload | Pass (executed) | E3.5 — renamed row visible on return, same SPA session |
| Failed updates don't appear successful | Pass (executed) | E3.7 — backend down: error toast, stays in edit mode |
| Failed updates allow correction/retry | Pass (executed) | E3.7 — values preserved, Save re-enabled |
| Initial loading visible | Pass (inspected) | `ListSkeleton` / skeleton components render during initial load (`web/src/products/ProductListPage.tsx:230,348`); local backend too fast to observe |
| List failure error state | Pass (executed) | E3.7 — "Ürünler yüklenemedi" + retry |
| Detail failure error state | Pass (inspected) | Same query/error-state pattern as list; detail error branch present in `ProductDetailPage.tsx` |
| Update failure feedback | Pass (executed) | E3.7 |
| Empty-catalog empty state | Pass (inspected) | Distinct empty-catalog branch exists; cannot execute without deleting all 80 seed products |
| Zero-result state distinguishable | Pass (executed) | E3.2 — "No matching products … search or filters" + Clear filters |
| Save progress visible | Pass (executed) | Spinner in Save button while pending (`ProductEditForm.tsx:218`), observed during saves |
| Duplicate saves prevented | Pass (executed) | Save disabled while `mutation.isPending` (`ProductEditForm.tsx:217`), observed disabled during save |

### 3. Required — Mobile

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| Login screen | Pass (executed) | E4.1 |
| Valid credentials authenticate | Pass (executed) | E4.1 |
| Session usable for protected requests | Pass (executed) | E4.2 — list/detail/stock all load |
| Auth failures visibly communicated | Pass (executed) | E4.1 — error banner; email preserved, password cleared |
| Products from actual API | Pass (executed) | E4.2 — showed live data incl. changes made by web/curl (stock 555), and re-seeded values after restart |
| Mobile-friendly scrolling list | Pass (executed) | E4.2 — compact cards, name+stock prominent, SKU·category·brand secondary, chevrons |
| Search | Pass (executed) | E4.2 — "cola" → 3, "kahve" → 1 |
| Product opens from list | Pass (executed) | E4.3 |
| Initial loading visible | Pass (inspected) | Loading state branch in `ProductListScreen.tsx` (`query.isLoading`); local network too fast to observe |
| Request failure error state | Pass (executed) | E4.5 — backend down produced visible error handling (snackbar path); session-death path also visibly handled |
| Zero-result no-results state | Pass (executed) | E4.2 — "No matching products" + Clear search |
| Detail from actual API | Pass (executed) | E4.3 — includes description (detail-only field) |
| Name and current stock clearly visible | Pass (executed) | E4.3 — header + "Current stock: N" in stock card |
| Detail loading/failure handled | Pass (inspected/executed) | Loading branch inspected; failure behavior exercised via backend-down save (E4.5) |
| Current stock clearly visible | Pass (executed) | E4.3 |
| User can change stock | Pass (executed) | E4.4 — steppers and direct entry |
| Invalid stock handled per contract | Pass (executed) | E4.4 — empty input → inline "Enter a whole number of 0 or more.", Save disabled; client refuses non-integer/negative (shared client guard) |
| Stock persisted via API | Pass (executed) | E4.4 — API read-back: stock 300 |
| Save progress visible | Pass (executed) | Busy state on Save Stock button during save |
| Duplicate submissions prevented | Pass (executed) | Save disabled while saving (`StockEditor.tsx:85`), input non-editable during save |
| Failed saves don't appear successful | Pass (executed) | E4.5 — red "Stock could not be saved." snackbar |
| Failed saves allow correction/retry | Pass (executed) | E4.5 — draft 35 preserved, Save still enabled |
| Persisted stock refreshed+displayed after success | Pass (executed) | E4.4 — "Current stock: 300" from PATCH response + refetch |

### 4. Required — Delivery & Runtime

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| Web deps install from committed lockfile | Pass (executed) | E0 — `npm ci` clean |
| TypeScript validation | Pass (executed) | E0 — `npm run typecheck` (all 3 workspaces) |
| Lint | Pass (executed) | E0 — `npm run lint` (all 3 workspaces) |
| Production web build | Pass (executed) | E0 — `npm run build:web` (informational >500 kB chunk warning only) |
| Built web app starts | Pass (executed) | E3.9 — `vite preview` on :4173, login + list verified against live backend |
| Mobile deps install | Pass (executed) | E0 — same workspace install |
| Mobile TypeScript / lint | Pass (executed) | E0 |
| Mobile app starts | Pass (executed) | E4.1 — Expo Go on AVD `TripFlow_API_36`, Metro :8082 |
| Mobile communicates with backend via documented config | Pass (executed) | E4 — default `10.0.2.2:5080` resolution (`mobile/src/lib/env.ts`), `EXPO_PUBLIC_API_URL` override available |
| Installable APK generated | **Not verified** | Out of scope this pass by coordinator decision — see Remaining Work |
| APK installs / launches / completes 5 flows | **Not verified** | Same |

### 5. Required — Documentation

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| All `README.md` criteria (backend/web/mobile startup, env config, mobile base-URL, APK generation, assumptions, library choices, limitations, checked instructions) | **Not verified — README.md does not exist yet** | E6. Expected open item: README is a delivery-phase deliverable, scheduled after this QA checkpoint. Not silently passed. |

---

## Quality / UX

All UX-001…UX-009 decisions were checked; verdicts below. "Executed" items were exercised in the running apps.

**Search & filtering (UX-001):** 300 ms debounce + trim (executed for behavior; constant confirmed at `ProductListPage.tsx:73`); clearing search restores default list (executed); search/filter resets to page 1 (executed — searching from page 2 dropped `page` param); search and filters preserve each other (executed — `?category=1&brand=6` retained while searching); previous data stays visible during refetch via `keepPreviousData` (inspected + no flicker observed); stale responses can't clobber current query (inspected — TanStack keying per param set); input preserved on request failure (executed — "sabun" survived backend-down error). **Pass.**

**Web detail & editing (UX-002):** read-only first, explicit Edit, Save+Cancel, Save disabled when unchanged/invalid/saving (all executed); sticky action area (inspected, `ProductEditForm.tsx:216`); stays on detail + exits edit mode + success toast after save (executed); failed saves preserve values (executed). **Pass.**

**Unsaved-changes protection (UX-003):** web Cancel and Back-navigation both raise "Discard unsaved changes?" with Stay/Discard; Stay preserves state; Discard leaves (all executed). Mobile hardware-back raises "Discard changes?" Stay/Discard (executed). No dialog when clean (executed — clean navigation never prompted). **Pass.**

**Feedback & fallback (UX-004):** stackable snackbars — web sonner top-right `visibleToasts={3}` (inspected config; toasts observed), mobile bottom queued snackbars (executed — two stacked after session death); field errors inline next to fields (executed, both clients); retry available (executed — list retry button, save retry); app-level render fallback — web router `ErrorBoundary` (`web/src/main.tsx:20`), mobile `AppErrorBoundary` (inspected). **Pass.**

**Mobile stock workflow (UX-005):** controls directly on detail, no edit mode (executed); − / input / + / Save Stock (executed); draft-only until save (executed — "Current stock" unchanged while draft 241); stable input — selectTextOnFocus, steppers act on parsed draft, background refetch never clobbers a dirty draft (executed + inspected `StockEditor.tsx:42-47`); Save gated on changed+valid+not-saving (executed). **Pass.**

**Lists & navigation (UX-006):** web dense table, clickable rows, hover/focus feedback + pointer + chevron (executed/inspected); returning from detail preserves search/filters/page (executed — `?q=eti` preserved); page change scrolls to top (executed — scrollY 0 after Next from y=2000); previous page kept on failure (inspected — keepPreviousData). Mobile compact list, fully tappable items with press feedback and chevrons, name+stock prioritized (executed). **Pass.**

**Auth & session UX (UX-007):** password visibility toggle (executed both clients); failed login preserves email, clears password (executed both); duplicate login submits prevented (`isSubmitting` disable, inspected; single-flight observed); Remember me unchecked by default (executed both); web remember mapping sessionStorage↔localStorage (executed); mobile mapping memory↔SecureStore (inspected `token-store.ts`); valid persisted session skips login (executed — web reload stayed authenticated); logout accessible (executed both); logout blocks re-entry via history/back (executed — web back stays on login; mobile back exits app). **Pass.**

**Data presentation (UX-008):** human-readable status labels, badge treatment, controlled select for editing (executed); status not color-only (labels everywhere); zero stock strongly emphasized ("Out of stock" badge web, red "Stock: 0" mobile — executed); low-stock emphasis uses the verified `minStock` signal ("Low stock" at stock 12/minStock 15 — executed, no invented threshold); locale-aware ₺ formatting: `₺115.00` EN / `₺115,00`+`₺79,50` TR (executed); currency from documented domain (TRY per contract §12 note). **Pass.**

**Localization (UX-009):** EN default (`shared/src/i18n.ts:7`), in-app switch on both clients (executed); choice persists per client (executed — web localStorage `stokmate.locale`, survived reload; mobile SecureStore, survived app relaunch); chrome/actions/validation/status labels localized (executed — TR verified across login, list, detail, edit form, dialogs, errors); API data displayed as delivered (executed — Turkish product/category names shown verbatim in both languages); known failures shown as localized client messages (executed — localized wrong-credential, server-unreachable, session-expired messages on both clients), raw backend text as secondary detail only. **Pass.**

---

## Optional / Bonus

| Feature | Verdict | Evidence |
| --- | --- | --- |
| Web cross-client refresh | Pass (executed) | E5 — external PATCH (stock 62→555) appeared on the open web list without reload within the 15 s poll (`queries.ts` `refetchInterval: 15_000`). Strategy documented in code + `docs/ARCHITECTURE.md`; must also reach README at delivery. |
| Mobile pagination | Pass (executed) | E4.6 — infinite scroll loaded pages beyond page 1 deep into the name sort (Torku/Ülker items visible); guard prevents duplicate/past-end requests (`ProductListScreen.tsx:67-71` — `hasNextPage && !isFetchingNextPage`); no duplicate rows observed |
| Mobile pull-to-refresh | Pass (executed) | E4.6 — RefreshControl reloads the active query; active search "cola" preserved with results intact |

---

## Build & Runtime Verification

| Check | Result |
| --- | --- |
| `npm ci` (root, committed lockfile) | ✅ 1064 packages, no errors |
| `npm run typecheck` (shared, web, mobile) | ✅ clean |
| `npm run lint` (shared, web, mobile) | ✅ clean |
| `npm run test` (shared unit tests) | ✅ 22/22 passed (3 files) |
| `npm run build:web` | ✅ built (563 kB main chunk; informational size warning) |
| `npm run test:live --workspace shared` (against running backend) | ✅ 6/6 passed |
| Backend startup (`~/.dotnet/dotnet run --project src/StokMate.Api`) | ✅ listening on 5080, re-seeds on start |
| Web dev server (`npm run dev:web`, :5173) | ✅ |
| Web production preview (`vite preview`, :4173) | ✅ login + list against live backend |
| Mobile (Metro :8082 + Expo Go on `TripFlow_API_36`) | ✅ bundled (984 modules), all flows above |

## APK Status

**Not yet built or verified — intentionally out of scope for this QA pass (coordinator decision; final APK work happens after this checkpoint review).** Remaining for the APK phase, in order:

1. `npx expo prebuild` (Android project generation; cleartext flag comes from `app.json` → verify it lands in the manifest).
2. Release build via Gradle (`JAVA_HOME=/opt/homebrew/opt/openjdk@17`, `assembleRelease`), with `EXPO_PUBLIC_API_URL` set to the dev machine's LAN address at build time.
3. `adb install` the exact delivery artifact on the emulator/device.
4. Launch without crash; complete login → list → search → detail → stock update against the backend.
5. Prove cleartext HTTP works in the release build (the `usesCleartextTraffic: true` path).

---

## Known Defects

**D1 (cosmetic, low): English product-count label does not pluralize.** The web list header renders "1 products" / "0 products".
- File/flow: `web/src/i18n/messages.ts:57` (`productCount: '{count} products'`), rendered in `web/src/products/ProductListPage.tsx`. Turkish is unaffected (no plural inflection).
- Repro: web → search "kahve" → header shows "1 products".
- Expected: "1 product" (singular) or a count-neutral phrasing.
- Suspected scope / fix request: web-only, i18n message + a trivial count-based selection at the call site (or reword to "Products: {count}"). No shared/mobile impact.

No other defects found. (The Expo Go floating dev-menu gear overlapping the Log out button during testing is a dev-client artifact — it does not exist in a standalone APK — and is noted only so the APK pass re-checks the header.)

---

## Unresolved Risks

1. **APK-specific behavior is unproven** until the APK phase runs (cleartext in release manifest, baked-in `EXPO_PUBLIC_API_URL`, release-mode Hermes differences). Mitigation is the 5-step checklist above against the exact delivery artifact.
2. **Backend has no concurrency protection** (verified: last-write-wins on PUT and PATCH). Accepted and documented (`docs/API_CONTRACT.md` §11, `docs/DECISIONS.md` §10); clients mitigate by editing from fresh reads and refetching after writes. Must be listed in README limitations.
3. **In-memory backend**: restart wipes data and all tokens. Both clients verifiably recover to login; README must warn evaluators.
4. **Turkish dotted/dotless-I search folding is host-locale-dependent** (contract §12). Clients correctly pass input through untouched; behavior may differ on other hosts. Informational.
5. Web main JS chunk exceeds 500 kB (Vite warning). Cosmetic for this assignment; no action recommended.

## Architecture Deviations

None found. The implementation matches `docs/ARCHITECTURE.md`: npm-workspaces monorepo (`shared`/`web`/`mobile`), shared client with single-flight refresh + epoch guard, TanStack Query v5 on both clients (no competing state library), Vite+React+shadcn web, Expo managed + hand-styled mobile UI, `EXPO_PUBLIC_API_URL`/`VITE_API_URL` env strategy, EN/TR per UX-009. The locked TanStack Query decision is respected.

## Remaining Work

1. **Android APK phase** (build → install → on-device flow verification → cleartext proof) — see APK Status.
2. **`README.md`** (delivery phase): backend/web/mobile startup, env + mobile base-URL config, APK generation steps, assumptions, library choices with reasons, limitations (concurrency, in-memory backend, single-value filters), cross-client refresh strategy note; then re-check instructions against the repo.
3. **Optional fix D1** (plural nit) — one-line web i18n change; must not block delivery.
4. Final QA pass (Phase 8) after 1–2: re-verify required criteria on the integrated result, including the exact APK artifact.

---

## Verification Evidence

All commands run on 2026-08-28 from the integrated worktree at `f31affa`; backend freshly started (re-seeded) unless noted. "API read-back" = direct authenticated curl to :5080, independent of the client under test.

- **E0 — Baseline:** `npm ci` → 1064 packages added, no errors. `npm run typecheck` → all 3 workspaces clean. `npm run lint` → all 3 workspaces clean. `npm run test` → shared: 3 files, 22 tests, all passed. `npm run build:web` → dist built (563.53 kB main chunk; size warning only).
- **E1 — Backend:** started via `~/.dotnet/dotnet run --project src/StokMate.Api` from `api/StokMate`, listening on 5080. `POST /auth/login` with `test@ornek.com`/`Test1234!` → 200 with access+refresh tokens, `expiresAt`, user "Deniz Yılmaz". Wrong password → 401 `E-posta veya şifre hatalı.`. Unauthenticated `GET /products` → 401. `GET /products?page=1&pageSize=2` → envelope `{items,total:80,page,pageSize}` with exactly the 16 contract fields. `GET /products/7` → 19 fields incl. `costPrice`/`supplierId`/`description`. `/categories` → 8, `/brands` → 12.
- **E2 — Shared client live contract tests:** `npm run test:live --workspace shared` → 6/6 passed against the running backend.
- **E3 — Web (Chrome via chrome-devtools-axi, dev server :5173):**
  - **E3.1 Auth:** wrong password → visible alert "Email or password is incorrect.", email kept, password cleared; empty email → inline "E-posta zorunludur."; valid login → `/products`. Password toggle switched field to plain text ("Show"→"Hide"). Remember me unchecked by default.
  - **E3.2 List/search/empty:** 80 products, 20/page table. Search "kahve" → 1 row, equals API `total` for `q=kahve`; URL `?q=kahve`. Nonsense search → "No matching products … current search or filters" + Clear search/filters buttons, "0 products".
  - **E3.3 Filters:** category İçecek → 10; + brand Coca-Cola → 5 rows (Coca-Cola×3, Fanta, Sprite) = API total for `categoryId=1&brandId=6`; URL `?category=1&brand=6`; both dropdowns keep visible active values.
  - **E3.4 Pagination:** "Page 1 of 4", Previous disabled on p1; Next → `?page=2`, new rows, `window.scrollY === 0` after clicking Next from y=2000. Typing a search on p2 → `page` param dropped (reset to 1).
  - **E3.5 Detail/edit lossless round-trip (product 49):** detail read-only with Edit; API state captured before edit. Edited all four fields in UI (name +" QA", price 24.50→25.75, stock 190→191, status Active→Passive) → Save → success toast, edit mode closed, stayed on detail, updatedAt refreshed. **API read-back diff: `price` 2450→2575, `stock` 190→191, `status` 1→2, name updated; `costPrice`, `supplierId`, `description`, `barcode`, `isFeatured`, `sku`, `categoryId`, `brandId`, `minStock`, `unit`, `imageUrl` all byte-identical.** Return via Back → list URL `?q=eti` preserved, renamed row displayed. Validation: blank name → "Name is required."; price "-5" → "Enter a valid price, e.g. 39.50"; stock "-3" → "Enter a whole number of 0 or more."; Save disabled. Unsaved-changes: Cancel and Back both raised Stay/Discard dialog; Stay preserved entered values.
  - **E3.6 Session persistence:** without Remember me → tokens only in `sessionStorage` (`stokmate.tokens`); page reload stayed authenticated. With Remember me → tokens in `localStorage`, none in sessionStorage.
  - **E3.7 Failure states (backend stopped):** save attempt → error toast "Ürün kaydedilemedi / Sunucuya ulaşılamadı…", edit mode + values retained, retry possible. New search on list → "Ürünler yüklenemedi" + "Tekrar dene"; typed search text retained.
  - **E3.8 Session brittleness:** (a) *401→refresh recovery:* second session (curl) logged in and out — backend drops **all** the user's access tokens. Web's next query succeeded with no login redirect; stored access token visibly rotated (`6ff6c5f3…`→`40447e63…`) proving 401→single-flight refresh→retry. Repeated twice. (b) *Backend restart:* tokens wiped server-side; clicking retry → refresh failed → clean redirect to `/login` + session-expired toast; no hang, no crash. (c) *Logout:* server revoke (204) + both storages cleared + redirect; browser Back stayed on login. (d) *No stale-request resurrection:* epoch guard in `shared/src/api/client.ts` (bumped on login/logout; refresh persistence and 401 handling skipped on epoch mismatch), covered by shared unit tests (E0).
  - **E3.9 Production build runtime:** `npm run preview --workspace web` → :4173 served 200; login + 80-product list verified in browser against live backend.
  - **E3.10 EN/TR:** switcher on all screens; TR verified across list (Ürünler/Ara/Kategori/Marka/Aktif), login (Giriş yap/Beni hatırla), edit form (Fiyat/Stok/Kaydet/Vazgeç), dialogs and error toasts; prices switch to comma decimals (`₺79,50`); choice persisted in `localStorage` (`stokmate.locale=tr`) across reload; API data (Turkish names) shown verbatim in both languages.
- **E4 — Mobile (Expo Go on AVD `TripFlow_API_36`, Metro :8082, backend via `10.0.2.2:5080`):** bundle built (984 modules); all evidence from emulator screenshots + API read-backs.
  - **E4.1 Auth:** login screen with email/password/Show password/Remember me (unchecked)/Sign in + EN/TR chips. Wrong password → red banner "Email or password is incorrect.", email kept, password cleared. Valid login → product list.
  - **E4.2 List/search:** live data (reflected the 555-stock change made externally, and re-seeded values after backend restart). Compact tappable cards with chevrons; low stock amber "Stock: 12", zero red "Stock: 0"; ₺ prices. Search "cola" → 3 rows, "kahve" → 1; clear button restores full list; nonsense search → "No matching products" + Clear search. Search term survived navigating to detail and back.
  - **E4.3 Detail:** loaded from `GET /products/{id}` (description shown); name, price, status badge, and "Current stock" clearly visible; Update-stock card directly on detail.
  - **E4.4 Stock workflow (product 1, stock 240):** steppers +/+/− → 241 (consistent), Save enabled only when changed; direct entry replaced draft with 300; Save Stock → green "Stock updated." snackbar, "Current stock: 300" re-displayed, Save disabled again, Last updated refreshed. **API read-back: product 1 stock = 300.** Empty input → red border + "Enter a whole number of 0 or more." + Save disabled. Hardware back with dirty draft → "Discard changes?" Stay/Discard; Stay preserved draft 301; Discard returned to list.
  - **E4.5 Failure + session brittleness:** *401→refresh:* after the curl-logout token drop, a fresh search fetched successfully with no login bounce. *Backend down:* Save Stock → red "Stock could not be saved. / Could not reach the server…", draft preserved, retry enabled. *Backend restarted (tokens wiped):* retry → returned to login with stacked snackbars "Your session has expired. Please sign in again." + "Stock could not be saved." — graceful, no crash. Relogin succeeded. *Logout:* Log out → login screen; hardware back exited the app (launcher), no protected content reachable.
  - **E4.6 Optional:** infinite scroll walked the name-sorted list deep into T/Ü SKUs (pages beyond the first loaded; monotonic alphabet, no visible duplicates; guarded `fetchNextPage`). Pull-to-refresh with active search "cola" reloaded and kept both term and results. TR verified on authenticated screens (Ürünler, "Ad, SKU veya barkod ara", Stok, Çıkış yap, `₺39,50`); locale persisted across app relaunch (SecureStore).
- **E5 — Cross-client refresh (web bonus):** with the web list open, external `PATCH /products/54/stock` set 62→555; within the 15 s poll interval the open list row showed 555 without any reload or interaction.
- **E6 — Credential hygiene & docs state:** `git grep -i "Test1234\|test@ornek"` over tracked files → hits only in `shared/src/__tests__/` (unit-test mock + opt-in live test), project docs (`docs/`, `AGENTS.md`), and the provided backend's own seeder/docs. **Zero hits in application source, `app.json`, `web/.env` (contains only `VITE_API_URL`), or the built web bundle (grep of `web/dist/assets/*.js` → 0 matches).** No connectivity-probe/debug artifacts tracked (`git ls-files | grep -i probe|connectivity|smoke` → none). `README.md` does not exist (recorded under Required — Documentation as the expected delivery-phase gap).

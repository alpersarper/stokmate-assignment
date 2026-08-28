# StokMate Implementation Report

Maintained by the QA / Reporter agent. This is the **final QA pass (Phase 8)**, evaluating the delivered project on `main` (`d81e1ef`, includes the D1 fix, `README.md`, and the release-APK delivery work) against `docs/ACCEPTANCE_CRITERIA.md`. Verification date: **2026-08-28**, macOS host, Node 22, backend run from `api/StokMate` via `~/.dotnet/dotnet`.

Verdict vocabulary — **Pass (executed)**: verified by running the flow/command; **Pass (inspected)**: verified by direct code/repo inspection where runtime verification is impractical; **Not verified**: not checked (never counted as complete); **Fail**: defect recorded in Known Defects.

Two verification passes back this report:

- **Checkpoint pass** (same day, integrated tree at `f31affa`): full execution of every backend/web/mobile criterion — evidence E0–E6 below.
- **Final pass** (this pass, `main` at `d81e1ef`): re-ran baseline validation, re-verified everything the delivery phase changed (D1 fix, README, credential hygiene), and independently verified the exact release-APK artifact end-to-end — evidence F0–F6 below. Mobile and web application source is byte-identical between the two passes except the two-file D1 web fix (`git diff 2d75e1e..main` → `README.md`, `AGENTS.md` note, `web/src/i18n/messages.ts`, `web/src/products/ProductListPage.tsx`), so checkpoint-pass runtime evidence remains valid for unchanged criteria and is cited as such.

## Status

**FINAL: delivery-ready. All Required criteria (backend, web, mobile, delivery & runtime including the release APK, documentation) pass with executed evidence. All verified Quality/UX criteria pass. All three Optional/Bonus features pass. The one known defect (D1, cosmetic pluralization) is fixed and re-verified. No open defects.**

---

## Required Features

### 1. Backend & API contract

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| Backend under `api/StokMate` starts | Pass (executed) | F1 — re-run this pass (multiple restarts) |
| Test credentials authenticate | Pass (executed) | F1 |
| `docs/API_CONTRACT.md` contains the verified contract | Pass (inspected) | E1 spot-checks (list envelope, 16-field DTO, 19-field detail, lookups, error bodies) |
| Clients use verified endpoints/contracts | Pass (executed) | F0 (shared live tests re-run), E3–E5, F5 (APK flows hit the real API) |
| No invented API behavior | Pass (inspected) | Shared client implements only contract endpoints; `updateStock` guards the §8 empty-body trap; PUT built from fresh `GET /products/{id}` |
| Necessary backend modification documented | Pass (inspected) | `GET /products/{id}` documented in `docs/API_CONTRACT.md` §3, `docs/DECISIONS.md` §1, and `README.md` "Backend modification" |

### 2. Required — Web

All web criteria were verified by execution at the checkpoint pass (E3.1–E3.10); web source since then changed only in the D1 count-label fix, which was re-verified by execution this pass (F2). Summary of verdicts (details in the evidence sections):

| Criterion group | Verdict | Evidence |
| --- | --- | --- |
| Auth: login screen, valid login, session persisted (sessionStorage / localStorage per Remember me), auth header on requests, invalid-session → login redirect, visible auth failures, no indefinite loading | Pass (executed) | E3.1, E3.6, E3.8 |
| List: real API data, dense catalog table, search, category filter, brand filter, pagination per contract, correct result sets, SPA (no reload) | Pass (executed) | E3.2–E3.4; F2 re-exercised search in the current build |
| Detail: opens from list, loaded from real API (`description` proves `GET /products/{id}`), relevant info displayed | Pass (executed) | E3.5 |
| Update: name/price/stock/status all editable; validation per API rules; persisted (API read-back diff — `costPrice`/`supplierId`/`description`/`barcode` byte-identical, i.e. lossless PUT); detail refreshed; list reflects server state without reload; failed updates visibly fail and allow retry | Pass (executed) | E3.5, E3.7 |
| States: initial loading, list/detail failure states, update-failure feedback, empty catalog (inspected — cannot execute without deleting seed data), zero-result state distinguishable, save progress, duplicate-save prevention | Pass (executed; 2 sub-items inspected) | E3.2, E3.5, E3.7; F2 re-exercised the zero-result state ("0 products" + "No matching products") |

### 3. Required — Mobile

All mobile criteria were verified by execution at the checkpoint pass in dev mode (E4.1–E4.6); mobile source is unchanged since. This pass additionally re-verified the critical flows **in the release APK** (F5), which supersedes dev-mode evidence for delivery purposes:

| Criterion group | Verdict | Evidence |
| --- | --- | --- |
| Auth: login screen, valid login, session usable for protected requests, visible auth failures (email kept, password cleared) | Pass (executed) | E4.1; F5 (login executed in the APK) |
| List: real API data, mobile-friendly scrolling list, search, open detail, loading state, failure state, zero-result state | Pass (executed) | E4.2; F5 (list + search "cola" → 3 = API, in the APK) |
| Detail: real API data (`description` shown), name + current stock clearly visible, loading/failure handled | Pass (executed) | E4.3; F5 (detail in the APK) |
| Stock update: current stock visible, stepper + direct entry, invalid values blocked per contract, persisted via API (independent curl read-back), visible save progress, duplicate-submit prevention, failures visibly fail and allow retry, persisted value re-displayed after success | Pass (executed) | E4.4, E4.5; F5 (full workflow executed in the APK with API read-back) |

### 4. Required — Delivery & Runtime

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| Web deps install from committed lockfile | Pass (executed) | F0 — `npm ci` re-run on `main`: 1064 packages, no errors |
| TypeScript validation | Pass (executed) | F0 — all 3 workspaces clean |
| Lint | Pass (executed) | F0 — all 3 workspaces clean |
| Production web build | Pass (executed) | F0 — built (563.62 kB main chunk; informational size warning only) |
| Built web app starts via documented workflow | Pass (executed) | F3 — `npm run preview --workspace web` → :4173, login + 80-product list against live backend |
| Mobile deps install | Pass (executed) | F0 — same workspace install |
| Mobile TypeScript / lint | Pass (executed) | F0 |
| Mobile app starts | Pass (executed) | E4.1 (dev mode, Expo Go, Metro :8082); F4 (README `dev:mobile` command starts Expo; F5 APK runtime) |
| Mobile communicates with backend via documented config | Pass (executed) | E4 (dev default `10.0.2.2:5080`); F5 (APK with baked `EXPO_PUBLIC_API_URL`) |
| Installable Android APK generated | Pass (executed) | F5 — release artifact exists and is the exact delivery APK (path + sha256 below) |
| Delivery APK installs on emulator | Pass (executed) | F5 — `adb install -r` → Success on AVD `TripFlow_API_36` (fresh install after uninstall) |
| APK launches without immediate crash | Pass (executed) | F5 — cold start → splash → login screen |
| Installed APK completes login / list / search / detail / stock update | Pass (executed) | F5 — all five flows executed in the installed release APK against the live backend, stock persistence cross-checked by curl |

### 5. Required — Documentation

`README.md` now exists (added by the delivery phase, commit `d81e1ef`). Every criterion checked against the actual file and, where it contains commands, by executing them (F4):

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| Explains how to start the backend | Pass (executed) | F4 — `dotnet run --project src/StokMate.Api` from `api/StokMate` works (run via `~/.dotnet/dotnet`, a machine-local path issue, not a README defect); port 5080, in-memory reset warning, and test credentials all stated and correct; Swagger URL returns 200 |
| Explains how to start the web application | Pass (executed) | F4 — `npm run dev:web` → :5173 (used for F2); `VITE_API_URL` documented and matches committed `web/.env` |
| Explains how to start the mobile application | Pass (executed) | F4 — `npm run dev:mobile` starts Expo (on this machine port 8081 is held by an unrelated project and Expo prompts for 8082 — environmental, matches the documented port-conflict quirk; not a README defect) |
| Required environment/configuration values documented | Pass (inspected) | `VITE_API_URL`, `EXPO_PUBLIC_API_URL`, `JAVA_HOME` for Gradle — all present and match the code (`mobile/src/lib/env.ts`, `web/.env`) |
| Mobile API/base-URL configuration documented | Pass (inspected) | Emulator `10.0.2.2` default, iOS `localhost`, physical-device LAN-IP override — matches `mobile/src/lib/env.ts` exactly |
| Android APK generation documented | Pass (executed) | F5 — the documented commands (`expo prebuild` → `JAVA_HOME=… EXPO_PUBLIC_API_URL=… ./gradlew assembleRelease`) are the ones that produced the verified artifact; artifact path in README matches; baked-URL behavior described accurately (confirmed in the bundle) |
| Important assumptions documented | Pass (inspected) | In-memory backend/session reset, last-write-wins concurrency, server-defined search collation, TRY currency, single-value filters, fixed APK URL |
| Significant library choices listed with short reasons | Pass (inspected) | "Architecture & libraries" section: workspaces, TanStack Query, Vite/React/shadcn, Expo/React Navigation/SecureStore, shared client with single-flight refresh, APK strategy — each with a reason |
| Relevant limitations documented | Pass (inspected) | "Assumptions & known limitations" section covers the real ones (matches Unresolved Risks below) |
| README instructions checked against the integrated repository | Pass (executed) | F4 — this pass executed the README's install, backend, web dev, preview, mobile dev, and verification commands as written and checked every referenced file/path (`docs/DECISIONS.md`, `.gitignore` excludes `mobile/android/` and `*.apk`, cleartext plugin in `app.json`) |

---

## Quality / UX

All UX-001…UX-009 decisions verified at the checkpoint pass (detailed rationale in E3/E4); application behavior unchanged since except D1. **All pass.** Final-pass deltas:

- **D1 pluralization (Data presentation / list header):** fixed in `f40a6d3` and re-verified by execution (F2): EN shows "0 products" / "1 product" / "2 products" for real 0/1/2-result queries; TR unchanged ("ürün", no inflection needed).
- **Release-APK UX spot-checks (F5):** zero-stock red emphasis and low-stock amber emphasis, ₺ price formatting, EN/TR chips on login, localized session-expiry snackbar, stepper draft-only behavior, Save Stock disabled-when-unchanged/saving — all present in the release build.

Checkpoint-pass verdict summary (unchanged): search debounce/trim/reset/preservation (UX-001) ✅; web read-only-first detail + guarded edit form (UX-002) ✅; unsaved-changes dialogs web+mobile (UX-003) ✅; stackable snackbars, inline field errors, retry, error boundaries (UX-004) ✅; mobile stock workflow (UX-005) ✅; lists & navigation incl. state preservation and scroll-to-top (UX-006) ✅; auth UX incl. password toggle, Remember me default-off, logout lockout (UX-007) ✅; data presentation incl. status labels, stock emphasis from verified `minStock`, locale-aware ₺ (UX-008) ✅; EN/TR localization with per-client persistence (UX-009) ✅.

---

## Optional / Bonus

| Feature | Verdict | Evidence |
| --- | --- | --- |
| Web cross-client refresh | Pass (executed) | E5 — external stock PATCH appeared on the open web list within the 15 s poll without reload. Strategy documented in `docs/ARCHITECTURE.md` and README ("query keys per filter combination … invalidation after mutations"; poll interval in `web/src/products/queries.ts`) |
| Mobile pagination | Pass (executed) | E4.6 — infinite scroll deep into the name sort, guarded against duplicate/past-end requests, no duplicate rows |
| Mobile pull-to-refresh | Pass (executed) | E4.6 — reloads active query, preserves active search |

---

## Build & Runtime Verification (final pass, `main` @ `d81e1ef`)

| Check | Result |
| --- | --- |
| `npm ci` (root, committed lockfile) | ✅ 1064 packages, no errors |
| `npm run typecheck` (shared, web, mobile) | ✅ clean |
| `npm run lint` (shared, web, mobile) | ✅ clean |
| `npm run test` (shared unit tests) | ✅ 22/22 passed (3 files) |
| `npm run build:web` | ✅ built (563.62 kB main chunk; informational size warning) |
| `npm run test:live --workspace shared` (against running backend) | ✅ 6/6 passed |
| Backend startup | ✅ 5080, re-seeds on start (restarted multiple times during session-recovery testing) |
| Web dev server (:5173) | ✅ (D1 verification) |
| Web production preview (:4173) | ✅ login + 80-product list |
| Release APK on emulator | ✅ all critical flows (see APK Status) |

## APK Status — VERIFIED (final pass)

**Artifact (the exact delivery APK, independently verified this pass):**

- Path: `/Users/alpersarper/.treehouse/stokmate-assignment-465d51/2/stokmate-assignment/mobile/android/app/build/outputs/apk/release/app-release.apk` (the delivery worktree's Gradle output; 77,780,557 bytes)
- SHA-256: `01863a92cbfd8f1b272d60230f4cd738673261d4ce2983555dad9bcb3340e995`
- Variant: `release` (per `output-metadata.json`); applicationId `com.stokmate.app`, versionName 0.1.0, minSdk 24, targetSdk 36
- Signature: Android debug keystore (`CN=Android Debug`) — assignment-grade, as disclosed in README
- Baked API URL: `http://10.0.2.2:5080` — confirmed inside the Hermes bytecode bundle (`strings` on `assets/index.android.bundle`: exactly one occurrence)
- Cleartext: `android:usesCleartextTraffic=true` confirmed in the APK's `AndroidManifest.xml` (aapt2), and proven at runtime — all API traffic in the flows below is plain HTTP

**Executed on AVD `TripFlow_API_36` (Android 16 emulator) against the live backend — my own observations, not the delivery worker's claims:**

1. `adb install -r` → Success (fresh install; a prior installation was uninstalled first).
2. Launch → splash → login screen; no crash.
3. Login with `test@ornek.com` → product list with live re-seeded data; low-stock amber and zero-stock red emphasis; ₺ prices.
4. Search "cola" → exactly 3 rows, equal to the API result for `q=cola`.
5. Detail (Coca-Cola 1 L Pet, product 1) → loaded from `GET /products/1` (description shown), "Current stock: 240", Save Stock disabled while unchanged.
6. Stock workflow: steppers `+ + −` → draft 241 (current stock display unchanged — draft-only); direct entry replaced draft with 250; Save Stock → green "Stock updated." snackbar, "Current stock: 250" re-displayed, Save disabled again, Last updated refreshed. **Independent curl read-back: `GET /products/1` → stock 250.**
7. Session recovery: backend restarted (all tokens wiped server-side) → next in-app request → clean redirect to login with red "Your session has expired. Please sign in again." snackbar — no hang, no crash; re-login immediately succeeded.
8. Logout from the list header → login screen.
9. Backgrounding the app (home) and relaunching kept the authenticated session (process alive).

Environmental notes (emulator host issues, not app defects, recorded for transparency): an Android "Try out your stylus" system sheet once intercepted `adb input text`; after one emulator cold boot the **system** UI threw an ANR dialog ("System UI isn't responding" — the StokMate login screen kept rendering behind it) which cleared after restarting `com.android.systemui`. Neither reproduces in the app itself.

---

## Known Defects

**None open.**

- **D1 (cosmetic, English product-count pluralization)** — reported at the checkpoint pass, fixed in `f40a6d3`, re-verified by execution this pass (F2: "0 products" / "1 product" / "2 products"). **Closed.**

## Unresolved Risks

1. **Backend has no concurrency protection** (verified last-write-wins on PUT/PATCH). Accepted and documented (`docs/API_CONTRACT.md` §11, `docs/DECISIONS.md` §10, README limitations); clients mitigate by editing from fresh reads and refetching after writes.
2. **In-memory backend**: restart wipes data and all tokens. Both clients verifiably recover to login (web E3.8, APK F5.7); README warns evaluators.
3. **Turkish dotted/dotless-I search folding is host-locale-dependent** (contract §12). Clients pass input through untouched; informational.
4. **APK API URL is fixed at build time** — running the delivered artifact outside an emulator-hosted-backend setup requires the rebuild documented in README. By design (`docs/DECISIONS.md` §8).
5. Web main JS chunk exceeds 500 kB (Vite informational warning). Cosmetic; no action recommended.

## Architecture Deviations

None. Matches `docs/ARCHITECTURE.md`: npm-workspaces monorepo, shared fetch client with single-flight refresh + epoch guard, TanStack Query v5 on both clients (locked decision respected; no competing state library), Vite+React+shadcn web, Expo managed mobile, env-based API URL strategy, EN/TR per UX-009, local prebuild+Gradle APK strategy.

## Remaining Work

**None for delivery.** The project satisfies every Required criterion with executed evidence. (Post-assignment hardening ideas — real signing key, HTTPS, server-side concurrency — are documented as out of scope in README/DECISIONS.)

---

## Verification Evidence

### Final pass (F0–F6) — `main` @ `d81e1ef`, 2026-08-28

- **F0 — Baseline re-validation:** `npm ci` → 1064 packages added, no errors. `npm run typecheck` → shared/web/mobile clean. `npm run lint` → all clean. `npm run test` → 3 files, 22/22 passed. `npm run build:web` → dist built, 563.62 kB main chunk (size warning only). `npm run test:live --workspace shared` (backend up) → 6/6 passed.
- **F1 — Backend:** started repeatedly via `~/.dotnet/dotnet run --project src/StokMate.Api`; unauthenticated `GET /products` → 401; `POST /auth/login` with test credentials → 200 with access+refresh tokens; `/swagger` → 200 (after redirect).
- **F2 — D1 fix verification (web dev :5173, Chrome):** logged in; deep-linked searches with API-confirmed counts: `q=kahve` (API total 1) → header **"1 product"**; `q=makarna` (API total 2) → **"2 products"**; `q=cif` (API total 0) → **"0 products"** + "No matching products" empty state. TR string inspected (unchanged, no inflection). Also re-confirmed login flow, redirect handling, and zero-result state in the current build.
- **F3 — Production build runtime:** `npm run preview --workspace web` → :4173 HTTP 200; login + "80 products" list rendered against the live backend.
- **F4 — README instruction check (executed as written):** root `npm install`/`npm ci` ✅; backend command ✅ (via `~/.dotnet/dotnet` — dotnet not on this machine's PATH; README's assumption of an installed .NET SDK is reasonable and stated in Prerequisites); `npm run dev:web` ✅; `npm run preview --workspace web` ✅; `npm run dev:mobile` starts Expo ✅ (8081 occupied by an unrelated local project → Expo offers 8082; matches the known machine quirk); all four verification commands ✅ (F0); referenced files verified: `web/.env` contains only `VITE_API_URL`; `mobile/src/lib/env.ts` matches the documented URL resolution; `app.json` contains the `expo-build-properties` cleartext flag; `.gitignore` excludes `mobile/android/` and `*.apk` as claimed; `docs/DECISIONS.md` §1/§10 exist; APK build commands and artifact path match the verified artifact.
- **F5 — Release APK (exact delivery artifact):** everything in "APK Status" above — static verification (sha256, variant metadata, debug-keystore signature via apksigner, baked URL and zero credentials via `strings` on the Hermes bundle, cleartext flag via aapt2) plus the nine executed on-device steps with independent curl read-back of the persisted stock value (240 → 250).
- **F6 — Credential & artifact hygiene (re-run on `main`):** `git grep -i "Test1234\|test@ornek"` → hits only in README (assignment-provided credentials, intentionally documented), project docs, `AGENTS.md`, the provided backend's own seeder/docs, and `shared/src/__tests__/` (unit-test mock + opt-in live test). **Zero hits in application source, `app.json`, `web/.env`, the built web bundle (`web/dist/assets/*.js` → 0 matches), or the APK's JS bundle (`strings` → 0 matches).** No probe/connectivity/debug artifacts tracked (`git ls-files` → none).

### Checkpoint pass (E0–E6) — integrated tree @ `f31affa`, 2026-08-28

Retained as evidence for criteria whose implementing code is unchanged on `main`. "API read-back" = direct authenticated curl to :5080, independent of the client under test.

- **E0 — Baseline:** `npm ci` → 1064 packages, no errors. `typecheck`/`lint` → all 3 workspaces clean. `test` → 22/22. `build:web` → dist built (563.53 kB main chunk).
- **E1 — Backend:** login 200 (access+refresh, `expiresAt`, user "Deniz Yılmaz"); wrong password → 401 `E-posta veya şifre hatalı.`; unauthenticated `/products` → 401; list envelope `{items,total:80,page,pageSize}` with the 16 contract fields; `GET /products/7` → 19 fields incl. `costPrice`/`supplierId`/`description`; `/categories` → 8, `/brands` → 12.
- **E2 — Shared client live contract tests:** 6/6 passed against the running backend.
- **E3 — Web (Chrome, dev :5173):**
  - **E3.1 Auth:** wrong password → visible alert, email kept, password cleared; inline required-field errors; valid login → `/products`; password toggle works; Remember me unchecked by default.
  - **E3.2 List/search/empty:** 80 products, 20/page; search "kahve" → 1 row = API total; URL `?q=kahve`; nonsense search → distinguishable zero-result state + Clear buttons.
  - **E3.3 Filters:** İçecek → 10; + Coca-Cola → 5 rows = API total for `categoryId=1&brandId=6`; URL params; filters and search preserve each other.
  - **E3.4 Pagination:** Page 1 of 4; Previous disabled on p1; Next → `?page=2`, `scrollY === 0`; search from p2 resets to p1.
  - **E3.5 Detail/edit lossless round-trip (product 49):** all four fields edited in UI → Save → success toast, edit closed, updatedAt refreshed. **API read-back diff: `price` 2450→2575, `stock` 190→191, `status` 1→2, name updated; `costPrice`, `supplierId`, `description`, `barcode`, `isFeatured`, `sku`, `categoryId`, `brandId`, `minStock`, `unit`, `imageUrl` byte-identical.** Return preserved `?q=eti`. Inline validation blocks blank name / negative price / negative stock. Cancel/Back raise Stay/Discard; Stay preserves values.
  - **E3.6 Session persistence:** sessionStorage default, localStorage with Remember me; reload stays authenticated.
  - **E3.7 Failure states (backend stopped):** save → error toast, edit mode + values retained, retry possible; list → localized error + retry, typed search retained.
  - **E3.8 Session brittleness:** (a) server-side token drop → next query transparently recovered via single-flight refresh (stored token visibly rotated), twice; (b) backend restart → refresh fails → clean `/login` redirect + session-expired toast; (c) logout → server revoke 204, storages cleared, Back stays on login; (d) epoch guard against stale-request auth resurrection (shared unit tests).
  - **E3.9 Production build runtime:** preview :4173 login + list.
  - **E3.10 EN/TR:** full chrome/validation/toast localization; comma decimals in TR; choice persisted across reload; API data verbatim in both languages.
- **E4 — Mobile (Expo Go on `TripFlow_API_36`, Metro :8082, `10.0.2.2:5080`):**
  - **E4.1 Auth:** login screen with Show password/Remember me/EN-TR; wrong password → red banner, email kept, password cleared; valid login → list.
  - **E4.2 List/search:** live data (reflected external changes and re-seeds); compact tappable cards; low/zero stock emphasis; search "cola" → 3, "kahve" → 1; clear restores; zero-result state; search term survived detail round-trip.
  - **E4.3 Detail:** description shown (detail-only field); name, price, status badge, current stock; stock controls directly on detail.
  - **E4.4 Stock workflow:** steppers consistent; draft-only until save; direct entry; Save → success snackbar, persisted value re-displayed, **API read-back stock 300**; empty input → inline validation + Save disabled; dirty-draft hardware-back → Stay/Discard.
  - **E4.5 Failure + session brittleness:** transparent 401→refresh recovery; backend down → red failure snackbar, draft preserved, retry; backend restart → stacked snackbars + return to login, relogin OK; logout → login, back exits app.
  - **E4.6 Optional:** guarded infinite scroll deep into the sort; pull-to-refresh preserving active search; TR + locale persistence across relaunch.
- **E5 — Cross-client refresh:** external `PATCH /products/54/stock` 62→555 appeared on the open web list within the 15 s poll, no reload.
- **E6 — Hygiene & docs state at checkpoint:** credential grep clean outside docs/tests/seeder; no probe artifacts; README did not yet exist (recorded then as the expected delivery-phase gap — now closed, see §5 and F4).

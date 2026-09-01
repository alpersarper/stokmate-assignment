# StokMate Implementation Report

Maintained by the QA / Reporter agent. The release-artifact verification below records `main` at `339d00c` on **2026-08-31**. A senior pre-merge addendum on **2026-09-01** reviews the later combined state (`main` at `7818a49` plus documentation PR #11) and supersedes the earlier approval verdict where they conflict. Host: macOS, Node 22; backend run from `api/StokMate` via `~/.dotnet/dotnet`.

Verdict vocabulary — **Pass (executed)**: verified by running the flow/command; **Pass (inspected)**: verified by direct code/repo inspection where runtime verification is impractical; **Not verified**: not checked (never counted as complete); **Fail**: defect recorded in Known Defects.

Four verification passes back this report:

- **Checkpoint pass** (2026-08-28, integrated tree at `f31affa`): full execution of every backend/web/mobile criterion — evidence E0–E6 (retained at the end of this report).
- **Prior final pass** (2026-08-28, `main` at `d81e1ef`): baseline re-validation, README execution, first release-APK end-to-end verification — evidence F0–F6 (retained).
- **This pass** (2026-08-31, `main` at `339d00c`): re-verified by execution everything the post-`1fcb4fb` PRs (#1–#7) changed — mobile list/detail query architecture with server search/filters/sort, the Discontinued 409 stock rule, freshness indicators + protected manual refresh on both clients, the mobile visual redesign, web status filter and header sorting — plus a **new release APK built from `339d00c` and verified standalone end-to-end (12-point matrix)**, full baseline re-validation, and a fresh README execution check. Evidence G0–G7 below. Evidence from earlier passes is carried forward, with its date, only where the implementing code is genuinely unchanged since.
- **Senior pre-merge review** (2026-09-01, `main` at `7818a49` + PR #11): full post-`1fcb4fb` source/diff inspection, baseline and live checks, exact web polling/rate-limit/Turkish-query/Discontinued probes, and a timestamped-proxy mobile session. Evidence H0–H6 below.

Source delta covered by this pass: `git diff 1fcb4fb..339d00c` — 31 files, ~2 300 insertions across `api/` (Discontinued 409, read rate-limit), `shared/` (freshness descriptor, new tests), `web/src/products/` (status filter, header sorting, freshness/refresh, table polish), `mobile/src/` (query architecture rework, freshness/refresh, full visual redesign), plus docs/tooling.

## Status

**SENIOR REVIEW: approval held. No BLOCKER was found, but one HIGH product defect is open: mobile pagination can issue multiple page requests for one physical gesture because drag-start and momentum-start both re-arm the guard. Fresh proxy evidence reproduced page 2 and page 3 requests 441 ms apart without a deliberate second fling. One MEDIUM limitation is also open: mobile stock success patches values without re-sorting/re-paging stock- or updated-time-sorted datasets. The published APK identity and the historical 12-point matrix remain valid; they do not override this later evidence.**

---

## Required Features

### 1. Backend & API contract

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| Backend under `api/StokMate` starts | Pass (executed) | G0 — started/restarted repeatedly this pass from the `339d00c` worktree |
| Test credentials authenticate | Pass (executed) | G0 — `POST /auth/login` → 200 with access+refresh tokens |
| `docs/API_CONTRACT.md` contains the verified contract | Pass (inspected + executed spot-checks) | G2 — this pass exercised `q`, `brandId`, `status`, `sort`/`dir`, `PATCH /products/{id}/stock` (200 and 409 paths) and all matched the contract; E1 covers the fuller battery (2026-08-28) |
| Clients use verified endpoints/contracts | Pass (executed) | G1 (shared live tests 7/7), G2 (web network log shows contract query params), G4 (APK flows against the real API) |
| No invented API behavior | Pass (inspected) | Shared client implements only contract endpoints; sort/filter params match §6 of the contract |
| Necessary backend modifications documented | Pass (inspected) | `GET /products/{id}` (`docs/DECISIONS.md` §1), Discontinued stock 409 (`docs/DECISIONS.md` §12, contract §8), read rate-limit (contract §2a) — all in the contract with runtime-verification notes |

New backend behavior since the prior pass, both assignment decisions recorded in `docs/DECISIONS.md` and `docs/API_CONTRACT.md`:

- **Discontinued stock rule (`faf1a85`)** — re-verified by execution this pass (G2): `PATCH /products/40/stock` on a Discontinued product → `409` `Üretimi durdurulmuş ürünün stoğu güncellenemez.`, stock confirmed unchanged by read-back; Active products still accept stock updates (multiple 200s this pass).
- **Read rate-limit (`e1ff1b0`)** — Pass (executed): contract §2a records the original runtime battery. H3 rechecked the boundary: 60 product reads returned 200, the next 10 returned 429 with `Retry-After` and the documented body; a second token, auth, lookups, and stock writes remained unaffected.

### 2. Required — Web

Web criteria were verified by execution at the checkpoint pass (E3.1–E3.10, 2026-08-28). Since then web changed in: status filter + header sorting (`79fe7c4`), freshness indicator + protected manual refresh (`b4d9643`), table/list polish (`2b5211b`), favicon (`c616d8a`), and a 6-line `ProductEditForm` touch-up. Everything changed was re-verified by execution this pass (G2); unchanged criteria carry their 2026-08-28 evidence:

| Criterion group | Verdict | Evidence |
| --- | --- | --- |
| Auth: login, session persistence, auth header, invalid-session redirect, visible failures | Pass (executed) | G2 (login executed this pass); E3.1/E3.6/E3.8 (2026-08-28, auth code unchanged) |
| List: real API data, dense table, search, category filter, brand filter, **status filter**, pagination, correct result sets, SPA | Pass (executed) | G2 — status filter → URL `?status=3`, "2 products", exactly the API's 2 Discontinued items; search `q=Rize` → "1 product" (D1 still fixed); E3.2–E3.4 for category/brand/pagination (2026-08-28) |
| **Sorting (new)**: sortable Name/Price/Stock/Updated headers, server-side | Pass (executed) | G2 — Price header cycles asc/desc; URL `?sort=price&dir=asc|desc`; network log shows the API request carrying `sort`/`dir`; row order flips accordingly |
| **Freshness + manual refresh (new)** | Pass (executed) | G2 — "Updated just now" indicator; external curl stock change (64→99) appeared after clicking "Refresh data"; button disabled during the protected cooldown |
| Detail + update: full edit flow, lossless PUT, validation, states | Pass (executed, 2026-08-28) | E3.5/E3.7 — edit-flow code effectively unchanged since (only a cosmetic 6-line form touch-up) |
| States: loading/failure/empty/zero-result/save progress/duplicate-save | Pass (executed) | E3.2/E3.5/E3.7 (2026-08-28); G2 re-confirmed the zero-result count label and table skeleton in the polished build |

### 3. Required — Mobile

Mobile changed substantially since the checkpoint pass (query architecture rework `cd2c8a9`, freshness/refresh `753fed2`, full visual redesign in PRs #6–#7). **This pass re-verified the entire mobile vertical slice by execution in the release APK — the exact submission artifact — under standalone conditions** (G4, 12-point matrix, screenshots archived with the artifact):

| Criterion group | Verdict | Evidence |
| --- | --- | --- |
| Auth: product login screen, valid login, session for protected requests, EN/TR | Pass (executed) | G4.2–G4.3, G4.12 — in the release APK |
| List: real API data, card list with stat rail, search (server-side), loading/failure/zero states | Pass (executed) | G4.4–G4.5 — search "çay" matched the server's `q=çay` response exactly (3 items, same order) |
| **Filters/sort (new)**: status/category/brand filter sheet, 8-option sort sheet, server-side | Pass (executed) | G4.6 — brand+status filter → 2 items matching curl for `brandId=7&status=1`; Price High→Low reorders; Discontinued status filter → the exact 2 items |
| Detail: hero card, name + current stock clearly visible, info section | Pass (executed) | G4.7 |
| Stock update: stepper, save, persistence, visible progress, re-display | Pass (executed) | G4.8 — 64→66 in-app, "Stock updated." toast, **independent curl read-back: server stock 66, fresh `updatedAt`**, list row reflects 66 |
| **Discontinued lock (new)**: stock editor locked with localized banner, backend 409 enforced | Pass (executed) | G4.9 — disabled stepper/save + "Stock cannot be updated for discontinued products."; curl `PATCH` → 409, stock unchanged |
| **Freshness + manual refresh (new)** | Pass (executed) | G4.10 — indicator ticks; external stock change picked up by Refresh with cooldown state |
| Session recovery: backend restart mid-session → clean localized return to login | Pass (executed) | G4.11 — stale data retained until the next request, then session-expired toast + login; no hang or crash |
| Safe areas on sheets (visual redesign) | Pass (executed) | G4.6 — filter/sort bottom sheets keep actions above the gesture nav bar |

Dev-runtime evidence (Expo Go) from 2026-08-28 is superseded by this release-APK evidence; the dev workflow itself is now native debug builds (PR #1) and its Metro entry point was execution-checked in G5.

### 4. Required — Delivery & Runtime

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| Web deps install from committed lockfile | Pass (executed) | G1 — `npm ci` on `339d00c`, no errors |
| TypeScript validation | Pass (executed) | G1 — all 3 workspaces clean |
| Lint | Pass (executed) | G1 — all 3 workspaces clean |
| Shared unit tests | Pass (executed) | G1 — 27/27 (4 files; grew from 22 with the freshness descriptor tests) |
| Shared live contract tests | Pass (executed) | G1 — 7/7 against the running backend (single-flight assertion did not flake this run) |
| Production web build | Pass (executed) | G1 — built; the known informational >500 kB chunk warning only |
| Built web app starts via documented workflow | Pass (executed) | G5 — `npm run preview --workspace web` → :4173 HTTP 200, login page rendered |
| Mobile deps install / TypeScript / lint | Pass (executed) | G1 |
| Mobile app starts (dev workflow) | Pass (executed) | G5 — `npm run dev:mobile` starts Metro ("Waiting on http://localhost:8081"); full `expo run:android` native debug build not re-executed this pass (exercised extensively during the PR #1–#7 development cycle) |
| Mobile communicates with backend via documented config | Pass (executed) | G4 — release APK with baked `EXPO_PUBLIC_API_URL=http://10.0.2.2:5080` completed all flows against the live backend |
| Installable Android APK generated | Pass (executed) | G3 — **new artifact built this pass from `339d00c`**; identity below |
| Delivery APK installs on emulator | Pass (executed) | G4.1 — full uninstall then `adb install -r` → Success on `TripFlow_API_36` |
| APK launches without crash, no dev tooling | Pass (executed) | G4.2 — boots straight to the product login; no dev launcher (expo-dev-client verified inert in release: no dev-launcher activity in the manifest, zero devlauncher/devmenu entries in the APK) |
| Installed APK completes login / list / search / detail / stock update | Pass (executed) | G4 — all flows in the standalone matrix |

### 5. Required — Documentation

README instruction check re-executed this pass (G5) because the dev-workflow section changed since the prior pass (PR #1: native debug builds):

| Criterion | Verdict | Evidence |
| --- | --- | --- |
| Backend startup documented | Pass (executed) | G0/G5 — command works (via `~/.dotnet/dotnet`, the known machine-local PATH quirk); port, reset warning, credentials, Swagger all accurate |
| Web startup documented | Pass (executed) | G5 — `npm run dev:web` → :5173 (used for all G2 verification); `VITE_API_URL` matches `web/.env` |
| Mobile startup documented | Pass (executed) | G5 — `npm run dev:mobile` starts Metro on 8081 exactly as described; `expo run:android` workflow consistent with the recorded dev practice (not re-executed, see above) |
| Env/config values documented | Pass (inspected) | `VITE_API_URL`, `EXPO_PUBLIC_API_URL`, `JAVA_HOME` — match the code |
| Mobile API/base-URL config documented | Pass (inspected) | Matches `mobile/src/lib/env.ts` |
| APK generation documented | Pass (executed) | G3 — the README's prebuild+Gradle commands are the ones used (this pass added `CI=1`/`--clean` for a guaranteed-fresh regeneration; on a fresh clone the README's plain `npx expo prebuild --platform android` is equivalent — README snippet updated this pass to include the flags for exactness) |
| Assumptions/limitations documented | Pass (inspected) | Includes the Discontinued stock-lock rule, in-memory reset, last-write-wins, baked APK URL, collation |
| Library choices with reasons | Pass (inspected) | Unchanged section, still accurate |
| README checked against the integrated repository | Pass (executed) | G5 — all commands executed as written this pass. **One stale claim found (D2)**: the mobile dev-workflow note said the DevTools Network panel cannot capture traffic because expo-dev-client "is not included" — expo-dev-client has been a dependency since PR #2 and the debug build's network capture demonstrably works (recorded in `AGENTS.md`). Corrected in this change set. |

---

## Quality / UX

All UX-001…UX-009 decisions verified at the checkpoint pass; behavior-preserving evidence carried forward (2026-08-28) except where this pass re-verified changed surfaces:

- **Mobile visual redesign (PRs #6–#7)** — re-verified in the release APK (G4): card rows with stat rail, chrome sheet, skeleton load, detail hero card, raised stock editor, login brand mark, bottom-sheet refinement, safe-area insets, stock text labels ("Low stock"/"Out of stock"), status badge semantics (Discontinued in red), press feedback. All present in the shipped artifact.
- **Web polish (`2b5211b`)** — spot-checked in G2: stock numeral rail and table skeleton render; favicon (`c616d8a`) served (`/favicon.svg` → 200, linked from index).
- **Freshness/refresh UX (PR #5)** — verified on both clients (G2/G4): relative-age indicator, cooldown-protected manual refresh.
- **Localization** — G4.12: full TR pass in the release APK (chrome, states, decimal comma); web TR verified 2026-08-28 (E3.10, i18n architecture unchanged; new strings inspected in `web/src/i18n/messages.ts`).
- **D1 pluralization** — still fixed: "1 product" for a 1-result query re-confirmed this pass (G2).

Checkpoint-pass verdict summary (unchanged surfaces): search debounce/trim/reset (UX-001) ✅; web read-only-first detail + guarded edit (UX-002) ✅; unsaved-changes dialogs (UX-003) ✅; snackbars/inline errors/retry/error boundaries (UX-004) ✅; mobile stock workflow (UX-005) ✅; lists & navigation (UX-006) ✅; auth UX (UX-007) ✅; data presentation (UX-008) ✅; EN/TR persistence (UX-009) ✅.

---

## Optional / Bonus

| Feature | Verdict | Evidence |
| --- | --- | --- |
| Web cross-client refresh | Pass (executed) | G2 — an external curl stock change surfaced via the refresh pipeline this pass; E5 (2026-08-28) verified the 15 s poll picking up external changes without interaction |
| Mobile pagination | **Fail — HIGH** | H5 — source shows both drag-start and momentum-start re-arm one guard; the timestamped proxy recorded page 2 then page 3 only 441 ms apart without a deliberate second fling. Earlier end-of-list checks did not prove one-gesture/one-page behavior. |
| Mobile pull-to-refresh | Pass (executed) | E4.6 (2026-08-28); shares the G4.10-verified refresh pipeline (`753fed2` unified them) |

---

## Build & Runtime Verification (this pass, `main` @ `339d00c`, 2026-08-31)

| Check | Result |
| --- | --- |
| `npm ci` (root, committed lockfile) | ✅ no errors |
| `npm run typecheck` (shared, web, mobile) | ✅ clean |
| `npm run lint` (shared, web, mobile) | ✅ clean |
| `npm run test` (shared unit tests) | ✅ 27/27 (4 files) |
| `npm run test:live --workspace shared` | ✅ 7/7 |
| `npm run build:web` | ✅ built (informational chunk-size warning only) |
| Backend startup | ✅ :5080, re-seeds on start (restarted deliberately for session-recovery testing) |
| Web dev server (:5173) | ✅ all G2 flows |
| Web production preview (:4173) | ✅ serves the built app |
| `npm run dev:mobile` | ✅ Metro starts on :8081 (killed afterwards to preserve standalone APK conditions) |
| Release APK on emulator | ✅ 12/12 standalone checks (G4) |

## APK Status — VERIFIED (submission artifact)

**This pass built and verified a NEW release artifact from `339d00c`; it supersedes the 2026-08-28 artifact.** The published submission artifact is the GitHub Release build recorded under [Published artifact](#published-artifact-2026-08-31-github-release-v100) below; this section is the QA record of the build and matrix it was verified against.

- Local delivery copy: `app-release-final.apk` (copied byte-identical from this worktree's Gradle output)
- Size: 77 824 176 bytes
- SHA-256: `543c2d54339973566c777fad5dccf366b6af5365fdbe5c027426a825cb6ac356`
- Source commit: `339d00c` (main; local == origin/main; clean worktree)
- Build commands (exact): `cd mobile && CI=1 npx expo prebuild --platform android --clean`, then `cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@17 EXPO_PUBLIC_API_URL=http://10.0.2.2:5080 ./gradlew assembleRelease`; build log confirms `:app:createBundleReleaseJsAndAssets` executed (BUILD SUCCESSFUL, 655 tasks)
- Variant: release; applicationId `com.stokmate.app`, versionName 0.1.0, minSdk 24, targetSdk 36; no `android:debuggable`
- Hermes bundle present (`assets/index.android.bundle`, bytecode magic `c6 1f bc 03`); baked API URL `http://10.0.2.2:5080` (exactly 1 occurrence)
- **expo-dev-client release-inertness verified in the artifact**: only activity is `MainActivity` (no dev-launcher activity), zero `devlauncher`/`devmenu` entries in the APK, and at runtime the app boots directly into the product login with no dev menus

**Standalone conditions**: Metro killed (0 listeners on 8081/8082, lsof-verified), `adb reverse --remove-all`, backend from the same worktree on `0.0.0.0:5080`, full uninstall before install.

**12-point standalone matrix — all executed on AVD `TripFlow_API_36`, all PASS** (G4; screenshots archived next to the artifact in `final-shots/`): 1 install · 2 clean launch to product login · 3 login · 4 list with new visual pass · 5 server-side search · 6 filters + sort · 7 detail hero card · 8 stock update with curl read-back + list reflection · 9 Discontinued locked editor + curl 409 · 10 freshness + protected manual refresh · 11 backend-restart session recovery to localized login · 12 EN/TR switch (full TR session). Full command-level evidence: `app-release-final-notes.md` beside the artifact.

### Published artifact (2026-08-31, GitHub Release `v1.0.0`)

The delivery mechanism is now a public GitHub Release rather than a machine-local file. A **fresh** release APK was rebuilt from the same product commit with the same commands and re-verified before publishing:

- Download: <https://github.com/alpersarper/stokmate-assignment/releases/tag/v1.0.0> — asset `stokmate-v1.0.0-release.apk`
- Size: 77 824 176 bytes · SHA-256: `a004fa9c04fa42f469073dbf256cad4a2335e73e4fadeaede3dde904ea081290`
- Source commit: `339d00c` (unchanged — the final application-source commit; the documentation commits after it do not touch `mobile/`, `shared/`, `web/`, or `api/`)
- Variant `release`, applicationId `com.stokmate.app`, versionName 0.1.0, not debuggable; baked API URL `http://10.0.2.2:5080` (sole app URL in the bundle; no proxy, LAN, or localhost leak)

**The checksum differs from the 2026-08-28 artifact above even though the source commit is identical.** Android APK packaging is not byte-reproducible (zip entry timestamps and build-tool metadata vary per build), so an identical checksum was not expected. The artifact that was verified is the artifact that was published.

**Re-verified on the exact published binary** (AVD `TripFlow_API_36`, backend on the host): install of the named artifact · launch straight to the product login (no dev launcher) · login with the test user · product list matching an independent `curl` read · product detail matching the same read field-for-field · **stock write 12 → 15 confirmed server-side by independent `curl`** · Turkish-query search (`çaykur` → 2 results) matching the server · force-stop and relaunch restoring the remembered session (secure storage intact in the release build). Static audit: not debuggable, no secrets, no hardcoded credentials, Gradle debug keystore (assignment-grade). After upload, the release asset was downloaded again and its SHA-256 confirmed byte-identical to the tested binary.

---

## Known Defects

- **D3 (HIGH, mobile pagination; open)** — one physical gesture can request multiple pages. `ProductListScreen` arms the pagination ref from both `onScrollBeginDrag` and `onMomentumScrollBegin`; runtime proxy evidence reproduced chained page requests. Recommended product fix: arm once per physical gesture (or track a gesture identifier) and retain the existing placeholder/end/in-flight/retry guards. Not changed in documentation-only PR #11.
- **D4 (MEDIUM, stock-sorted cache order; open)** — mobile stock success patches the canonical value into detail and existing list rows with no GET, but does not reorder/re-page stock- or updated-time-sorted infinite datasets. Values are current; ordering can stay stale until explicit refresh.

- **D1 (cosmetic, EN product-count pluralization)** — fixed in `f40a6d3` (2026-08-28); still correct this pass (G2). **Closed.**
- **D2 (documentation, found this pass)** — README's mobile dev-workflow note claimed the DevTools Network panel cannot capture app traffic because expo-dev-client is not included; stale since PR #2 added expo-dev-client (`a6c50b3`). Corrected in this change set (README updated; no code impact). **Closed.**

## Unresolved Risks

1. **Backend has no general concurrency protection** — last-write-wins on PUT/PATCH (contract §11). The Discontinued 409 is a domain-state rejection, not a version check. Accepted and documented; clients edit from fresh reads and apply canonical mutation responses. Web edits invalidate lists; mobile stock success does not refetch.
2. **In-memory backend**: restart wipes data and tokens. Both clients verifiably recover to login (web E3.8; release APK G4.11).
3. **Turkish dotted/dotless-I search folding is host-locale-dependent** (contract §12). Informational.
4. **APK API URL fixed at build time** — by design (`docs/DECISIONS.md` §8); rebuild instructions in README.
5. Web main JS chunk exceeds 500 kB (Vite informational warning). Cosmetic.
6. `npm run test:live` single-flight-refresh assertion can flake to 2 refresh calls on this machine — a timing race in the live test, not a client bug (verified on pristine main 2026-08-30; did not occur this pass).

## Architecture Deviations

No product-architecture deviation from the locked TanStack Query decision. The post-checkpoint additions (freshness descriptor in shared, rate-limit + Discontinued rule in the backend, native-debug-build dev workflow) are recorded in `docs/DECISIONS.md` / `docs/API_CONTRACT.md` / README rather than silently introduced. D3 is an implementation defect in the pagination guard, not an approved architecture change.

## Remaining Work

1. Fix D3 in product code, or have the coordinator explicitly accept its impact before approval.
2. Decide whether D4 warrants targeted invalidation of only stock/updated-time-sorted datasets; otherwise retain it as an explicit limitation.
3. Re-run the focused mobile one-fling/one-page and stock-save network-footprint checks on a stable emulator after any product fix. The 2026-09-01 emulator repeatedly exited, so the exact 10 s mobile-detail cadence and stock-save request footprint were source-verified but not freshly re-measured.

---

## Verification Evidence

### Senior pre-merge review (H0–H6) — `main` @ `7818a49` + PR #11, 2026-09-01

- **H0 — Combined diff/source:** inspected the full post-`1fcb4fb` implementation plus PR #11's documentation-only diff, including freshness schedulers, query keys, pagination guards, mutation cache patching, backend rules/policies, defaults/counts, and EN/TR documentation claims.
- **H1 — Baseline:** `npm run typecheck` ✅; `npm run lint` ✅; `npm run test` ✅ 27/27; `npm run build:web` ✅ (informational chunk warning); backend solution test command ✅; `npm run test:live --workspace shared` ✅ 7/7 (known single-flight flake did not occur).
- **H2 — Web cadence/query/lifecycle:** timestamped proxy measured settled requests about 15.1 s apart. A query containing UTF-8 search, category, brand, status, price sort/direction, page, and page size was preserved exactly. Simulated hidden state stopped polling; visibility restoration triggered an immediate targeted read.
- **H3 — Rate limit:** a normal 12-read sequence remained 200; a fresh-token 70-read loop produced exactly 60×200 then 10×429. The 61st carried `Retry-After` and the documented Turkish body. A second token, `/auth/me`, lookups, and stock PATCH remained 200.
- **H4 — Contract edges:** Discontinued stock PATCH returned the documented 409 and left stock/`updatedAt` unchanged; Passive stock PATCH succeeded. UTF-8 Turkish query encoding was preserved. Common case pairs matched, while dotted/dotless-I variants differed, confirming the documented host-defined casing limitation.
- **H5 — Mobile:** debug build succeeded and the app reached the default Active list (backend total 75). Proxy logs then reproduced chained page requests without a deliberate second fling: page 2 at `21:28:36.337`, page 3 at `21:28:36.778`. The emulator later exited repeatedly; fresh exact measurements of detail cadence, background/refocus behavior, and stock-save footprint are therefore **Not verified in this pass**, not counted as new runtime passes.
- **H6 — Source-backed mobile behavior:** current detail alone is scheduled at ~10 s only while focused + foregrounded; lifecycle return targets that detail. Stock PATCH sends one absolute integer value, applies the canonical response to detail and existing list rows, and does no success-path invalidation/refetch. A Discontinued 409 invalidates only detail.

### This pass (G0–G7) — `main` @ `339d00c`, 2026-08-31

- **G0 — Backend:** started from this worktree (`~/.dotnet/dotnet run --project src/StokMate.Api`, binds `0.0.0.0:5080`); login → 200 (access+refresh, user "Deniz Yılmaz"); restarted mid-pass twice (session-recovery test; fresh seeds each time).
- **G1 — Baseline:** `npm ci` clean → `typecheck` clean ×3 → `lint` clean ×3 → `test` 27/27 → `test:live` 7/7 → `build:web` ✅ (size warning only).
- **G2 — Web (Chrome via chrome-devtools-axi, dev :5173):** login executed; 80-product table with freshness row; status filter → `?status=3`, "2 products" = API; Price header sort asc/desc with URL state and network log showing `sort=price&dir=…` sent to the API; `q=Rize` → "1 product" (D1 regression check); external `PATCH /products/6/stock` (64→99) reflected after clicking "Refresh data", button disabled during cooldown; favicon served.
- **G3 — Release build:** prebuild `--clean` + `assembleRelease` from this worktree; `:app:createBundleReleaseJsAndAssets` in the log; static artifact inspection (Hermes magic, baked URL grep, aapt manifest: release, single activity, no dev-launcher).
- **G4 — Release APK standalone (12-point matrix):** documented above and, command-by-command with screenshots, in `app-release-final-notes.md` beside the delivered artifact. Independent curl read-backs for the stock update (66) and the Discontinued 409 (stock unchanged at 40).
- **G5 — README execution check:** backend command, `npm run dev:web`, `npm run preview --workspace web`, `npm run dev:mobile` (Metro on :8081, then killed), and all five verification commands executed as written; referenced files/paths spot-checked. Found D2 (stale DevTools-network claim), fixed.
- **G6 — Hygiene:** work performed in an isolated worktree; no APKs or generated `android/` committed (`.gitignore` honored); historical delivery artifacts left untouched.
- **G7 — Environment notes (transparency):** screen-off at first screenshot (emulator wake needed — not an app issue); `npm run dev:mobile` found 8081 free this time (the usual squatter process was not running).

### Prior final pass (F0–F6) — `main` @ `d81e1ef`, 2026-08-28

Retained for criteria unchanged since; the F5 APK evidence is superseded by G3/G4 for delivery purposes.

- **F0 — Baseline:** `npm ci` 1064 packages; typecheck/lint clean; tests 22/22; build:web ✅; test:live 6/6.
- **F1 — Backend:** repeated startups; 401 unauthenticated; login 200; Swagger 200.
- **F2 — D1 fix verification (web dev :5173):** API-confirmed counts "0/1/2 products"; zero-result state; TR uninflected.
- **F3 — Production build runtime:** preview :4173, login + 80-product list against the live backend.
- **F4 — README instruction check:** all commands as then written executed; env files and referenced paths verified.
- **F5 — Release APK (the 2026-08-28 artifact, sha `01863a92…`):** static verification + nine on-device steps with curl read-back (stock 240→250); session recovery; logout; backgrounding.
- **F6 — Credential & artifact hygiene:** credential grep clean outside docs/tests/seeder; zero credentials in built bundles; no probe artifacts tracked.

### Checkpoint pass (E0–E6) — integrated tree @ `f31affa`, 2026-08-28

Retained as evidence for criteria whose implementing code is unchanged on `main`. "API read-back" = direct authenticated curl to :5080, independent of the client under test.

- **E0 — Baseline:** `npm ci` → 1064 packages, no errors. `typecheck`/`lint` → all 3 workspaces clean. `test` → 22/22. `build:web` → dist built.
- **E1 — Backend:** login 200; wrong password → 401 `E-posta veya şifre hatalı.`; unauthenticated `/products` → 401; list envelope `{items,total:80,page,pageSize}` with the 16 contract fields; `GET /products/7` → 19 fields; `/categories` → 8, `/brands` → 12.
- **E2 — Shared client live contract tests:** 6/6 against the running backend.
- **E3 — Web (Chrome, dev :5173):** E3.1 auth UX; E3.2 list/search/empty; E3.3 category+brand filters matching API totals; E3.4 pagination with scroll-to-top and search-resets-page; E3.5 lossless edit round-trip (API read-back diff: only edited fields changed); E3.6 sessionStorage/localStorage persistence; E3.7 failure states with retry; E3.8 session brittleness (single-flight refresh recovery, restart → clean redirect, logout revocation, epoch guard); E3.9 preview runtime; E3.10 EN/TR.
- **E4 — Mobile (Expo Go, `TripFlow_API_36`, Metro :8082):** E4.1 auth; E4.2 list/search live data; E4.3 detail with description; E4.4 stock workflow with API read-back (300); E4.5 failure + session brittleness; E4.6 optional features (infinite scroll, pull-to-refresh, TR persistence).
- **E5 — Cross-client refresh:** external stock PATCH appeared on the open web list within the 15 s poll, no reload.
- **E6 — Hygiene & docs state at checkpoint:** credential grep clean outside docs/tests/seeder; no probe artifacts; README gap (closed by `d81e1ef`).

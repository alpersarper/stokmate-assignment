**English** | [Türkçe](README.tr.md)

# StokMate

Take-home assignment: two clients over the provided StokMate .NET API — a **web admin** for head-office product management and a **customer-facing mobile app** for store staff (stock updates as the primary workflow), sharing one framework-free TypeScript API/auth core. The backend is the provided API plus three small, documented modifications.

**Reviewer deep dives** (architecture, decisions, backend changes, AI-assisted workflow) are published on GitHub Pages — see [Reviewer deep dives](#reviewer-deep-dives).

## Quick start

**1. Backend** (requires .NET SDK 8.0+):

```bash
cd api/StokMate
dotnet run --project src/StokMate.Api
```

→ `http://localhost:5080` (Swagger at `/swagger`). In-memory: every restart re-seeds data and invalidates all sessions.

**2. Web admin** (requires Node.js ≥ 20; new terminal, repo root):

```bash
npm install
npm run dev:web
```

→ `http://localhost:5173`.

**3. Mobile** (Android emulator running; requires JDK 17 + Android SDK):

```bash
cd mobile
npx expo run:android
```

First run compiles and installs the native debug app, then starts Metro; later JS-only iteration needs only `npm run dev:mobile` (repo root) plus opening the installed app. Set `JAVA_HOME` to a JDK 17 if it is not your default. The emulator reaches the host backend via the default `http://10.0.2.2:5080`; for a physical device set `EXPO_PUBLIC_API_URL=http://<your-lan-ip>:5080` (same Wi-Fi).

**Test credentials** (intentionally provided by the assignment, test-only):
e-mail `test@ornek.com` · password `Test1234!`

## APK

**GitHub Release `v1.0.0` is being recreated.** The previously published release was removed so that the final deliverable can be rebuilt from the exact final source commit. Once the fresh APK is built and verified end-to-end, it will be attached — together with its SHA-256, size, and source commit — at the canonical URL below, which goes live on publication:

**[Release `v1.0.0` (pending recreation) →](https://github.com/alpersarper/stokmate-assignment/releases/tag/v1.0.0)**

What holds for the delivered APK regardless of the rebuild:

- **Build**: Release variant — applicationId `com.stokmate.app`, not debuggable, signed with the Gradle debug keystore (assignment-grade).
- **API target**: `http://10.0.2.2:5080`, **baked in at build time**. `10.0.2.2` is the Android emulator's alias for the host machine, so run the backend there and install the APK on an emulator on that same machine. There is no hosted backend.
- The exact asset that gets published is verified standalone end-to-end first (12-point matrix, `docs/IMPLEMENTATION_REPORT.md`); the release page will state its SHA-256 and source commit.
- Reproduce (or retarget for a physical device by changing the URL):

  ```bash
  cd mobile
  CI=1 npx expo prebuild --platform android --clean
  cd android
  JAVA_HOME=<path-to-jdk-17> EXPO_PUBLIC_API_URL=http://10.0.2.2:5080 ./gradlew assembleRelease
  # → app/build/outputs/apk/release/app-release.apk
  ```

- The backend is plain HTTP, so Android cleartext traffic is enabled (`expo-build-properties`).

## Project at a glance

```
api/StokMate/   provided .NET 8 API (in-memory) + 3 documented modifications
shared/         framework-free TS: types, API client, query keys, utilities
web/            Vite + React admin (Tailwind + shadcn/ui)
mobile/         Expo (managed) + React Native customer app
docs/           contracts, decisions, QA report, reviewer reports (docs/reviewer/)
```

## What changed

### Web admin

- Full required slice: login/session, dense product table with search, category/brand/**status** filters, server-side header sorting, pagination — all list state lives in the URL.
- Product detail with guarded edit form: lossless full-object PUT built from a fresh read, inline validation mirroring the verified API rules, unsaved-changes protection.
- Data freshness: "Updated X ago" indicator, cooldown-protected manual refresh, and a 15 s poll anchored to the last fetch settle (cross-client changes appear without a reload — the optional bonus).
- Complete loading/error/empty states, queued toasts, EN/TR chrome.

→ Deep dive: [Web admin architecture](https://alpersarper.github.io/stokmate-assignment/reviewer/frontend-report.html)

### Mobile

- Full required slice as a productized customer app: login (with "remember me" via secure storage), product list with server-side search/filters/sort and infinite scroll, detail screen, and the **stock-update workflow** (draft-based editor, steppers, validation, server-verified saves).
- Discontinued products lock the stock editor (and the backend enforces it with a 409 — stale clients cannot book stock onto a discontinued product).
- Pull-to-refresh, freshness indicator, protected manual refresh, and a 10 s detail poll — one coordinated refresh pipeline.
- Hand-styled visual system (no UI kit), queued snackbars, full EN/TR.

→ Deep dive: [Mobile architecture](https://alpersarper.github.io/stokmate-assignment/reviewer/mobile-report.html)

### Backend

- **Provided**: the entire API surface — auth (opaque tokens, 15-min access / 7-day rotating refresh), product list/search/filter/sort/pagination, PUT full-replace update, dedicated stock PATCH, lookups, seeding, error conventions. Verified behavior is recorded in `docs/API_CONTRACT.md`.
- **Changed during the assignment** (each minimal, documented, runtime-verified):
  1. `GET /products/{id}` added — the original backend had no product-by-id read, while its full-replace PUT required three fields no read endpoint returned (a proven silent-data-loss trap).
  2. Stock updates on **Discontinued** products rejected with `409` — server-side protection against stale clients.
  3. Rate limiting on product reads (60 req / 10 s per token → `429`) — an independent backend boundary for the refresh/polling feature.

→ Deep dive: [Backend architecture & modifications](https://alpersarper.github.io/stokmate-assignment/reviewer/backend-report.html)

## Key decisions

| Decision | Why |
| --- | --- |
| npm workspaces monorepo | One install, one dependency tree; three packages need scripts, not a build graph. |
| TanStack Query as the only server-state layer | The app is almost entirely server state; query keys + invalidation replace any global store. |
| Framework-free `shared/` core | The wire format and auth/refresh/error plumbing are implemented exactly once for both clients. |
| Centralized single-flight 401 → refresh → retry | Strict token rotation makes concurrent refreshes fatal; reactive recovery beats expiry timers. |
| shadcn/ui + Tailwind on web | Vendored, inspectable primitives; small dependency surface for an operational admin UI. |
| Hand-styled mobile UI (no kit) | Four screens; the hard part (queued snackbars) needs custom code even with a kit. |
| Expo managed + local Gradle APK | Reproducible offline with documented commands; no cloud build account. |
| EN/TR, English default, TRY everywhere | Typed message catalogs suffice for two locales; currency is data, never converted. |

Full rationale with alternatives and trade-offs: [Engineering decisions](https://alpersarper.github.io/stokmate-assignment/reviewer/development-decisions.html).

## Development process

- Requirements, UX decisions, and acceptance criteria were formalized in `docs/` before implementation and treated as binding contracts.
- The backend's actual behavior was verified at runtime first; clients were built against the recorded contract (`docs/API_CONTRACT.md`), never against assumptions.
- AI agents did the implementation, research, QA, and documentation under human-owned decisions; every PR was human-reviewed before merge — see the [AI-assisted development workflow](https://alpersarper.github.io/stokmate-assignment/reviewer/agent-workflow-report.html).
- Verification combined automated checks (TypeScript, lint, unit + live-contract tests, builds) with real-backend flows in the browser, the emulator, and the final release APK (independent `curl` read-backs included).
- Actual verified status lives in `docs/IMPLEMENTATION_REPORT.md`.

## Assumptions

### Environment and API facts

- **In-memory backend**: restarts wipe data and all sessions; clients recover to login when refresh fails.
- **Last-write-wins**: the API has no concurrency mechanism (verified); mitigated at UX level only (fresh-read edits, canonical mutation responses, targeted refresh). The Discontinued-stock 409 is a domain rule, not a version check.
- **Single-value filters** (one category, one brand) — the API has no multi-select.
- **Search/sort collation is server-defined** (Turkish dotted/dotless-I behavior follows the backend host's locale); input is passed through untouched.
- **TRY (₺)** per the provided domain documentation; rendered explicitly with integer-kuruş math.
- English default chrome with a runtime EN/TR switch; API data (product/brand names) is never translated.

### Product-design initiatives

These are deliberate choices where the assignment left behavior open; [`docs/DECISIONS.md`](docs/DECISIONS.md) owns the full rationale, with UX and wire-level boundaries in [`docs/UX_DECISIONS.md`](docs/UX_DECISIONS.md) and [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).

- **Operational status boundary**: Discontinued is terminal for stock (`409` plus a mobile lock) to protect stale store clients; Passive stays mutable, and Discontinued stays listable and otherwise editable because visibility and status administration were deliberately not restricted.
- **Audience-specific defaults**: mobile opens on Active products for store staff while web opens on All statuses for head-office oversight; both surfaces still expose every status choice.
- **Lossless detail read**: only `GET /products/{id}` was added because the full-replace PUT required fields no read returned; values were not guessed, the list DTO was not widened, and PUT semantics were not changed.
- **Independent read-rate limit**: the three product GETs share a 60-request/10-second budget per authorization value (IP fallback); auth, lookups, and writes are excluded, so legitimate refresh/polling remains unaffected.
- **Verified low-stock semantics**: emphasis follows the API's `minStock` signal so the same domain rule appears on both clients; no client-only threshold was invented.
- **Freshness without realtime**: coordinated polling/refetch makes cross-client changes visible within a reasonable time while preserving one data path; no WebSocket/SSE or second synchronization system was added.

## Main libraries

- **Web**: Vite + React + TypeScript (strict) — SPA toolchain; React Router — routes + URL list state; TanStack Query v5 — server state; react-hook-form — field registration and validation; Tailwind CSS v4 + shadcn/ui — vendored UI primitives; sonner — queued toasts.
- **Mobile**: Expo (managed) + React Native + TypeScript; React Navigation (native stack); TanStack Query v5; expo-secure-store — token persistence; expo-build-properties — cleartext HTTP flag; expo-dev-client — dev-build tooling (inert in release, verified).
- **Backend**: the provided .NET 8 + EF Core InMemory base; three narrow additions documented above, including `System.Threading.RateLimiting` for product reads.
- **Shared/testing**: Vitest — unit + live-contract tests; ESLint v9 + Prettier.

## Notes

- No realtime channel (WebSocket/SSE) — cross-client consistency is polling + coordinated refresh by design; see the freshness sections of the reports.
- **Senior-review findings resolved**: the HIGH mobile pagination finding is fixed — pagination now arms once per physical gesture (drag start only, momentum no longer re-arms), and network evidence re-verified one request per drag/fling across search/filter/sort datasets. The stock-sorted cache-order limitation is explicitly accepted: the updated stock value is correct and a normal refresh restores canonical ordering. See `docs/IMPLEMENTATION_REPORT.md`.
- The delivered APK's API target is fixed at build time; other targets require the documented rebuild.
- Assignment-focused infrastructure: no CI pipeline or E2E framework — verification is scripted checks plus the QA process recorded in `docs/IMPLEMENTATION_REPORT.md`.
- Verification commands: `npm run typecheck`, `npm run lint`, `npm run test` (offline unit), `npm run test:live --workspace shared` (against the running backend), `npm run build:web`.

## Reviewer deep dives

Published via GitHub Pages — every report carries an **EN / TR** switch in its header:

| Report | Link |
| --- | --- |
| **Technical overview** (start here) | [alpersarper.github.io/stokmate-assignment/reviewer](https://alpersarper.github.io/stokmate-assignment/reviewer/) |
| Web admin architecture | [frontend-report.html](https://alpersarper.github.io/stokmate-assignment/reviewer/frontend-report.html) |
| Mobile architecture | [mobile-report.html](https://alpersarper.github.io/stokmate-assignment/reviewer/mobile-report.html) |
| Backend architecture & modifications | [backend-report.html](https://alpersarper.github.io/stokmate-assignment/reviewer/backend-report.html) |
| Engineering decisions | [development-decisions.html](https://alpersarper.github.io/stokmate-assignment/reviewer/development-decisions.html) |
| AI-assisted development workflow | [agent-workflow-report.html](https://alpersarper.github.io/stokmate-assignment/reviewer/agent-workflow-report.html) |

The same reports are also available offline under [`docs/reviewer/`](docs/reviewer/) — every page is a self-contained HTML file that opens directly from a clone.

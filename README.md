# StokMate

Take-home assignment: two clients over the provided StokMate .NET API.

- **Web** (`web/`) — head-office product management: login, product list with search/filter/pagination, product detail, product editing.
- **Mobile** (`mobile/`) — store staff app (Expo/React Native): login, product list with search, product detail, **stock update** as the primary workflow. Delivered as an installable Android APK.
- **Shared** (`shared/`) — framework-free TypeScript shared by both clients: API/domain types, the fetch-based API client (auth header, error normalization, single-flight 401 → refresh → retry), query-key factory, formatting utilities.
- **Backend** (`api/StokMate/`) — the provided .NET 8 API (in-memory, no database), with one minimal documented addition (see [Backend modification](#backend-modification)).

Project documentation lives in `docs/`: engineering decisions and rationale in `docs/DECISIONS.md`, technical architecture in `docs/ARCHITECTURE.md`, verified API behavior in `docs/API_CONTRACT.md`.

## Prerequisites

- **Node.js ≥ 20** and npm (npm workspaces are used; no other package manager needed).
- **.NET SDK 8.0+** for the backend (the project targets `net8.0` and rolls forward to newer SDKs).
- For Android (mobile development and the APK): **JDK 17** and the **Android SDK** (platform 36, build-tools; standard Android Studio install). Not needed to run web.

Install all workspaces from the repo root:

```bash
npm install
```

## Backend (provided API)

From `api/StokMate`:

```bash
dotnet run --project src/StokMate.Api
```

- Listens on **`http://localhost:5080`** (binds `0.0.0.0:5080`, so it is also reachable over LAN for devices).
- **Storage and sessions are in-memory.** Every restart re-seeds the product data **and invalidates all sessions/tokens** — after a backend restart, log in again.
- Test credentials (intentionally provided by the assignment):
  - e-mail: `test@ornek.com`
  - password: `Test1234!`
- Swagger UI: `http://localhost:5080/swagger`.

## Web

```bash
npm run dev:web        # from the repo root → http://localhost:5173
```

- API base URL comes from `VITE_API_URL` (`web/.env`, committed default `http://localhost:5080` — not a secret).
- Production build: `npm run build:web` (output in `web/dist/`; preview with `npm run preview --workspace web`).

## Mobile (development)

Mobile development runs as a **native Android debug build** with interactive Metro. Expo remains the framework; Expo Go is no longer the primary development runtime.

```bash
cd mobile
JAVA_HOME=<path-to-jdk-17> npx expo run:android    # prebuild + Gradle debug build + install + Metro
```

- The first run generates `mobile/android/` (intentionally not committed) and compiles the debug app; later runs are incremental. `npx expo run:android` is only needed again when native configuration or native dependencies change.
- For JS-only iteration once the debug app is installed: start Metro with `npm run dev:mobile` (repo root) and open the installed **StokMate** app — it connects to Metro and supports Fast Refresh.
- Metro is interactive: `r` reloads, `j` opens **React Native DevTools** (Console, Sources/breakpoints, React Components/Profiler). Known limitation: the DevTools **Network panel does not capture app traffic** in this build — the native network-event bridge ships with `expo-dev-client`/Expo Go, which this lean setup does not include.
- If port 8081 is busy, pass `--port 8082` to `expo run:android` — the port is baked into the debug build, so restart Metro with the same `--port` value afterwards.

API base URL comes from `EXPO_PUBLIC_API_URL`. When unset, sensible defaults apply:

- **Android emulator**: `http://10.0.2.2:5080` (the emulator's alias for the host machine — Android `localhost` is the device itself, not your machine).
- **iOS simulator**: `http://localhost:5080`.
- **Physical device**: set it explicitly to your machine's LAN IP, with phone and machine on the same Wi-Fi:

  ```bash
  EXPO_PUBLIC_API_URL=http://<your-lan-ip>:5080 npm run dev:mobile
  ```

## Android APK (final delivery)

The delivered artifact is a **standalone release APK** — JS bundle embedded, no Metro, no development tooling. It is built locally (no cloud build service) via Expo prebuild + Gradle. Exact commands used to produce the delivered artifact:

```bash
cd mobile
npx expo prebuild --platform android
cd android
JAVA_HOME=/opt/homebrew/opt/openjdk@17 EXPO_PUBLIC_API_URL=http://10.0.2.2:5080 ./gradlew assembleRelease
```

- **Artifact**: `mobile/android/app/build/outputs/apk/release/app-release.apk` (build variant: `release`; the generated `android/` directory and APKs are intentionally not committed — see `.gitignore`).
- Set `JAVA_HOME` to your JDK 17 (the path above is the macOS Homebrew location).
- **The API URL is baked into the APK at build time** (Metro inlines `EXPO_PUBLIC_API_URL` during the Gradle JS-bundling step). The delivered artifact was built with `http://10.0.2.2:5080`, which targets a backend on the host machine when the APK runs in an **Android emulator**. To run the APK on a **physical device**, rebuild with your own LAN IP:

  ```bash
  JAVA_HOME=... EXPO_PUBLIC_API_URL=http://<your-lan-ip>:5080 ./gradlew assembleRelease
  ```

  and keep the device and the backend machine on the same network.
- Install: `adb install -r app/build/outputs/apk/release/app-release.apk`.
- **Networking assumptions**: the provided backend is plain HTTP, so the app enables Android cleartext traffic (`usesCleartextTraffic` via `expo-build-properties`) — acceptable for this local/demo setup; a real deployment would use HTTPS through the same `EXPO_PUBLIC_API_URL` mechanism with no code change. Signing uses the Gradle debug keystore (assignment-grade, not a store-ready signature).

## Architecture & libraries (brief)

- **npm workspaces** monorepo (`shared` / `web` / `mobile`) — one install, one dependency tree, shared TypeScript source with no build step.
- **TanStack Query v5** — the only server-state layer in both clients (query keys per filter combination, `keepPreviousData` for smooth filtering, invalidation after mutations).
- **Web**: Vite + React + TypeScript (strict), React Router, Tailwind CSS + shadcn/ui, react-hook-form for the edit form (validation rules mirror the verified API contract).
- **Mobile**: Expo (managed) + React Native + TypeScript, React Navigation, expo-secure-store for tokens.
- **Shared API/auth layer**: one fetch-based client used by both apps — normalized errors, bearer-token handling, and a centralized **single-flight refresh**: concurrent 401s trigger exactly one token refresh, then retry; refresh failure logs the session out cleanly.
- **APK strategy**: local `expo prebuild` + Gradle `assembleRelease` — reproducible offline, no cloud account required.

Rationale and alternatives: `docs/DECISIONS.md`. Full architecture: `docs/ARCHITECTURE.md`.

## Backend modification

The provided backend was modified in exactly one place: **`GET /products/{id}` was added** (it did not exist in the original delivery). It is required because:

1. the assignment requires product-detail screens fed by the real API, and
2. the provided update contract is a **full-replacement `PUT`** that includes fields (`costPrice`, `supplierId`, `description`) which no original read endpoint returned — without a product-by-id read, any legal client `PUT` would silently overwrite real data.

The addition is read-only, follows the backend's existing patterns, and changes no other behavior. Details and evidence: `docs/DECISIONS.md` §1 and `docs/API_CONTRACT.md` §3.

## Assumptions & known limitations

- **In-memory backend**: all data resets and **all sessions are invalidated** on every backend restart; clients handle this by returning to login when refresh fails.
- **Concurrency**: the API has no versioning/ETag mechanism, so product and stock updates are **last-write-wins** (with the single exception below); the clients re-fetch after saving to show the persisted server state.
- **Discontinued products are stock-locked** (explicit assignment decision): the backend rejects `PATCH /products/{id}/stock` with `409 Conflict` when a product's status is Discontinued — enforced server-side so a stale client that opened the product while it was Active cannot book stock onto it afterwards. The mobile app disables the stock editor for Discontinued products and maps the 409 to a specific message plus a detail refresh. Passive products deliberately still accept stock updates (the assignment defines no restriction for Passive). Rationale: `docs/DECISIONS.md` §12; contract: `docs/API_CONTRACT.md` §8.
- **Search/collation is server-defined**: search input is passed through untouched (verified: Turkish characters are sent correctly UTF-8-encoded, e.g. `q=%C3%A7ay` matches the Çaykur products); Turkish dotted/dotless-I matching follows the backend host's locale and is not re-filtered client-side — on the development host `FİLİZ`/`FILIZ`/`filiz` all match, while a dotless-`ı` query (`ıslak`) does not match a capital-I name (`Islak…`). Documented as backend behavior, deliberately not worked around client-side.
- **Currency**: prices are TRY (₺) per the provided domain documentation; the symbol is rendered explicitly for consistency across JS engines.
- **Filters are single-value** (one category, one brand) — the API has no multi-select filtering.
- **APK networking**: the APK's API URL is fixed at build time (no in-app server-settings screen — by design); running the delivered artifact against anything other than an emulator-hosted backend requires the rebuild described above.

## Verification commands

```bash
npm run typecheck   # all workspaces
npm run lint        # all workspaces
npm run test        # shared unit tests (offline)
npm run test:live --workspace shared   # shared client vs. the running backend
npm run build:web   # web production build
```

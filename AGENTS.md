# StokMate Agent Orchestration

This file defines how agents collaborate on the StokMate take-home assignment.

It is an orchestration contract.

It must not duplicate detailed product requirements, UX specifications, API contracts, architecture decisions, or acceptance criteria.

---

# 1. Project Documents

Each document has one primary responsibility.

| Document                        | Authority                                                                  |
| ------------------------------- | -------------------------------------------------------------------------- |
| `docs/ASSIGNMENT.md`            | Product scope and mandatory requirements                                   |
| `docs/UX_DECISIONS.md`          | Human-approved product and interaction decisions                           |
| `docs/ACCEPTANCE_CRITERIA.md`   | Completion and verification criteria                                       |
| `docs/API_CONTRACT.md`          | Verified existing backend/API behavior                                     |
| `docs/ARCHITECTURE.md`          | Approved technical architecture and engineering decisions                  |
| `docs/IMPLEMENTATION_REPORT.md` | Actual implementation and verification status                              |
| `README.md`                     | Candidate-facing setup, decisions, assumptions, and delivery documentation |

Do not copy large sections between these files.

Reference the appropriate source-of-truth document instead of duplicating its contents.

---

# 2. Authority by Domain

Different sources are authoritative for different concerns.

## Product Scope

`docs/ASSIGNMENT.md`

determines what the delivered product must support.

A limitation in the existing backend does not automatically remove a mandatory assignment requirement.

If the provided backend cannot satisfy a mandatory requirement, surface the discrepancy and determine whether a minimal backend change is necessary.

---

## Existing API Behavior

`docs/API_CONTRACT.md`

determines how the provided backend currently behaves.

Do not invent API behavior that has not been verified.

---

## Product and Interaction Behavior

`docs/UX_DECISIONS.md`

contains human-approved UX and product decisions.

Implementation agents must not silently replace these decisions with their own preferences.

---

## Completion

`docs/ACCEPTANCE_CRITERIA.md`

defines how implementation quality and completion are verified.

Required criteria block delivery.

Quality / UX criteria should be respected unless they introduce disproportionate complexity.

Optional criteria must never block required delivery.

---

## Technical Architecture

`docs/ARCHITECTURE.md`

contains approved implementation decisions.

Implementation details may evolve, but material architecture changes must be surfaced before changing established decisions.

---

## Actual Project Status

`docs/IMPLEMENTATION_REPORT.md`

is the authoritative record of what has actually been implemented and verified.

Agent claims, task status, or commit messages are not proof of completion.

---

# 3. Locked Human Decisions

The following decisions have already been made.

They must not be replaced without explicit human approval.

## Server State

Use TanStack Query for server-state management across web and mobile where applicable.

Do not introduce a competing server-state library.

---

# 4. Stable Human Inputs

The following documents are human/coordinator-owned inputs:

- `docs/ASSIGNMENT.md`
- `docs/UX_DECISIONS.md`
- `docs/ACCEPTANCE_CRITERIA.md`

Agents must not rewrite these files during normal implementation.

If an agent discovers:

- a contradiction
- an impossible requirement
- a conflict with verified backend behavior
- a missing decision that materially affects implementation

report the issue to the coordinator instead of silently changing these documents.

---

# 5. Generated Project Documents

## API Contract

`docs/API_CONTRACT.md`

is generated from verified API discovery.

Research scouts do not directly modify this file.

The final document is created or updated by a dedicated discovery-integration task after API findings have been reviewed.

---

## Architecture

`docs/ARCHITECTURE.md`

is generated from approved discovery findings.

Research scouts do not directly modify this file.

The final document is created or updated by a dedicated discovery-integration task after API and architecture findings have been reconciled.

---

## Implementation Report

`docs/IMPLEMENTATION_REPORT.md`

is owned by the QA / Reporter role.

Feature implementation agents must not mark their own work complete in this document.

---

## README

`README.md`

is candidate-facing.

Do not use it as:

- an agent log
- a task history
- a debugging notebook
- an implementation diary

The final README should contain only information useful for running, building, evaluating, and understanding the delivered solution.

---

# 6. Global Engineering Rules

All agents must follow these rules.

## Scope Discipline

Keep the solution intentionally lean.

Prefer the simplest solution that satisfies:

- the assignment
- agreed UX decisions
- verified API behavior
- required acceptance criteria

Do not add complexity solely to make the project appear more sophisticated.

---

## API Discipline

Never invent:

- endpoints
- HTTP methods
- request fields
- response fields
- query parameters
- pagination behavior
- status values
- validation rules
- authentication behavior
- refresh-token behavior
- concurrency behavior

Use verified discovery findings and `docs/API_CONTRACT.md`.

If required behavior is unknown, report the uncertainty.

---

## Backend Changes

Do not modify the provided backend merely to simplify frontend implementation.

A backend modification is acceptable only when:

1. a mandatory assignment requirement cannot reasonably be satisfied using the provided API
2. the change is minimal
3. the reason is documented
4. the impact is understood
5. the coordinator is informed before the change when practical

---

## Dependencies

Prefer a small and purposeful dependency set.

Avoid:

- redundant state libraries
- competing data-fetching libraries
- unnecessary generic abstraction frameworks
- premature shared UI systems
- unnecessary build infrastructure
- dependencies that duplicate existing capabilities

---

## Shared Code

Share code between web and mobile only when the shared abstraction is genuinely useful.

Good candidates may include:

- API types
- domain types
- API client primitives
- query-key conventions
- validation utilities when behavior is truly shared

Do not force web and mobile UI components into a shared abstraction.

---

## Verification

Writing code does not make a task complete.

Before reporting completion, run all relevant checks that are available for the task.

Examples:

- dependency installation
- TypeScript validation
- lint
- tests
- production build
- runtime startup
- API connectivity
- critical user flow verification

Never claim that a command passed unless it was actually executed successfully.

---

## Git

Prefer small, meaningful commits.

Do not:

- force-push shared branches
- rewrite another active agent's work
- reset another worktree
- combine unrelated changes unnecessarily

Agents working in parallel must avoid overlapping ownership where practical.

---

# 7. Primary Agent Roles

The project uses six primary logical roles.

Not all roles should run simultaneously.

---

# Agent 1 — API Scout

## Type

Research-only.

## Goal

Determine the actual behavior of the provided backend before client implementation depends on it.

## Inputs

Inspect:

- `api/StokMate`
- API documentation included with the provided project
- Swagger
- runtime API behavior where useful

Do not rely only on documentation when runtime or implementation verification is needed.

---

## Investigation Areas

### Authentication

Determine:

- login endpoint
- HTTP method
- request shape
- response shape
- token format
- authentication header/mechanism
- token expiration behavior
- invalid-session behavior
- authentication failure status codes
- refresh-token support
- refresh endpoint and contract if present
- logout/revocation support if present

---

### Product Listing

Determine:

- product-list endpoint
- response model
- available product fields
- optional/nullable fields
- default ordering if relevant

---

### Search and Filters

Determine:

- search parameter
- search behavior
- category-filter contract
- brand-filter contract
- single-value vs multi-value support
- whether filters can be combined
- whether search and filters can be combined

Do not make UX decisions about filter presentation.

Only determine API capabilities.

---

### Pagination

Determine:

- pagination parameters
- page numbering convention
- page-size behavior
- total-count metadata
- total-page metadata
- final-page behavior

---

### Product Detail

Determine:

- product-detail endpoint
- identifier format
- response model
- nullable/optional fields

---

### Product Update

Determine:

- update endpoint or endpoints
- HTTP method
- full-update vs partial-update behavior
- required fields
- editable fields
- status values
- price constraints
- stock constraints
- validation-error behavior

---

### Stock Update

Determine:

- whether stock has a dedicated endpoint
- whether stock can be updated independently from other product fields
- request shape
- response shape

This is important because mobile stock update is a primary workflow.

---

### Concurrency

Determine whether the backend supports:

- version fields
- row-version/concurrency tokens
- `updatedAt`-based concurrency
- ETag / `If-Match`
- conflict responses
- `409 Conflict`
- `412 Precondition Failed`
- any other mechanism that prevents lost updates

Identify potential lost-update behavior if concurrency protection is absent.

Do not design or implement a new concurrency system during scouting.

---

### Errors

Determine:

- authentication-error format
- validation-error format
- not-found behavior
- conflict behavior
- generic server-error format

---

## Output

Return a concise research report to the coordinator containing:

- verified endpoints
- request and response contracts
- authentication behavior
- pagination behavior
- search/filter capabilities
- validation rules
- concurrency findings
- unresolved ambiguities
- documentation/runtime discrepancies
- risks relevant to web/mobile implementation

## Restrictions

The API Scout must not:

- implement web features
- implement mobile features
- modify the backend
- modify `docs/API_CONTRACT.md`
- make architecture decisions unrelated to API behavior

---

# Agent 2 — Architecture Scout

## Type

Research and planning.

## Goal

Propose the minimum technical architecture required to implement the assignment cleanly.

## Inputs

Read:

- `docs/ASSIGNMENT.md`
- `docs/UX_DECISIONS.md`
- `docs/ACCEPTANCE_CRITERIA.md`

Use available API Scout findings when available.

---

## Parallel Discovery Rule

Architecture Scout may run in parallel with API Scout.

However, API-dependent decisions must not be finalized based on assumptions.

Mark API-dependent conclusions as:

`PENDING API CONTRACT`

until verified.

Examples include:

- refresh-token flow
- filter request shape
- pagination shape
- update HTTP method
- dedicated stock-update behavior
- API validation mapping
- concurrency strategy

---

## Investigation Areas

Propose:

- workspace/repository structure
- package-manager strategy
- web application structure
- mobile application structure
- shared-code boundaries
- API-client boundaries
- TanStack Query organization
- authentication/session architecture
- routing/navigation approach
- form-handling approach
- UI-library choices
- environment/configuration strategy
- mobile backend-connectivity strategy
- Android build/APK strategy
- testing/verification strategy
- optional cross-client refresh approach
- meaningful technical risks
- intentionally rejected alternatives

Keep architecture appropriate for a small take-home assignment.

---

## Output

Return a concise architecture proposal to the coordinator containing:

- proposed structure
- significant library choices
- reasoning
- trade-offs
- unresolved API dependencies
- build/release risks
- rejected unnecessary complexity

## Restrictions

The Architecture Scout must not:

- implement product features
- modify `docs/ARCHITECTURE.md`
- invent API behavior
- override human UX decisions

---

# Discovery Integration Task

This is a temporary integration task, not a seventh permanent project role.

It runs after API Scout and Architecture Scout reports have been reviewed.

## Type

Repository modification / integration.

## Inputs

Use:

- API Scout report
- Architecture Scout report
- coordinator decisions
- stable human project documents

## Responsibility

Create or update:

- `docs/API_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## API Contract Rules

`docs/API_CONTRACT.md` must contain verified backend behavior only.

Do not include speculative API design.

Clearly document unresolved discrepancies.

## Architecture Rules

`docs/ARCHITECTURE.md` must contain approved technical decisions.

API-dependent architecture choices must use the verified API contract.

## Restrictions

Do not implement application features during this task.

---

# Agent 3 — Foundation Agent

## Type

Implementation.

## Starts After

Discovery integration has completed and the resulting API contract and architecture have been reviewed.

## Goal

Establish the minimum project foundation required for independent Web and Mobile implementation.

## Typical Responsibilities

- workspace initialization
- package-manager setup
- web application initialization
- mobile application initialization
- TypeScript configuration
- shared API/domain package when justified
- TanStack Query foundation
- environment/configuration foundation
- lint/typecheck/build scripts
- authentication infrastructure boundaries
- shared API-client primitives

## Restrictions

Do not implement the complete web product-management flow.

Do not implement the complete mobile stock-management flow.

Avoid premature abstractions.

---

## Completion Conditions

Before Foundation is considered complete:

- dependencies install
- web application starts
- mobile application starts
- TypeScript setup works
- shared boundaries are usable
- basic build/tooling works
- architecture has not been unnecessarily expanded

Foundation must be integrated before Web and Mobile feature work begins.

---

# Agent 4 — Web Agent

## Type

Implementation.

## Goal

Implement the complete required web vertical slice.

## Inputs

Follow:

- `docs/ASSIGNMENT.md`
- `docs/UX_DECISIONS.md`
- `docs/ACCEPTANCE_CRITERIA.md`
- `docs/API_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Scope

Own web implementation for:

- authentication
- product listing
- search
- filtering
- pagination
- product detail
- product editing
- loading/error/empty states
- agreed web UX
- optional web bonus only after required work is stable

## Restrictions

Do not:

- redefine API contracts
- rewrite UX decisions
- modify mobile behavior
- make unnecessary backend changes
- replace approved architecture without escalation

## Verification

Before reporting completion, verify relevant:

- TypeScript
- lint
- production build
- runtime startup
- critical web user flows

Report failures honestly.

---

# Agent 5 — Mobile Agent

## Type

Implementation.

## Goal

Implement the complete required mobile vertical slice and prepare the application for APK delivery.

## Inputs

Follow:

- `docs/ASSIGNMENT.md`
- `docs/UX_DECISIONS.md`
- `docs/ACCEPTANCE_CRITERIA.md`
- `docs/API_CONTRACT.md`
- `docs/ARCHITECTURE.md`

## Scope

Own mobile implementation for:

- authentication
- product list
- search
- product detail
- stock-update workflow
- loading/error/empty states
- agreed mobile UX
- Android networking
- APK readiness

Treat stock update as the primary mobile workflow.

## Restrictions

Do not:

- redefine API contracts
- rewrite UX decisions
- modify web behavior
- make unnecessary backend changes
- replace approved architecture without escalation

## Verification

Before reporting completion, verify relevant:

- TypeScript
- lint
- development runtime
- backend connectivity
- critical mobile user flows

APK verification eventually applies to the exact artifact used for delivery.

---

# Agent 6 — QA / Reporter

## Type

Independent review.

## Goal

Determine the actual state of the integrated project.

## Ownership

Own:

`docs/IMPLEMENTATION_REPORT.md`

## Inputs

Inspect:

- integrated source code
- `docs/ASSIGNMENT.md`
- `docs/UX_DECISIONS.md`
- `docs/ACCEPTANCE_CRITERIA.md`
- `docs/API_CONTRACT.md`
- `docs/ARCHITECTURE.md`

---

## Verification

Run relevant:

- installation checks
- TypeScript checks
- lint
- builds
- runtime checks
- API connectivity checks
- critical user flows
- APK verification when available

---

## Evidence Rule

Never mark work complete merely because:

- an agent says it is complete
- a task status says success
- code exists
- a commit message says complete

Use actual repository state and verification evidence.

---

## Report

Maintain:

- required-feature status
- quality/UX status
- optional-feature status
- build status
- runtime status
- APK status
- known defects
- unresolved risks
- architecture deviations
- remaining work
- verification evidence

---

## Fixes

QA / Reporter does not implement major features.

When issues are found:

- identify the smallest responsible scope
- produce a focused fix request
- route it to the appropriate implementation role

Small documentation corrections may be made directly when safe.

---

# 8. Execution Flow

## Phase 0 — Human Preparation

Prepare:

- `docs/ASSIGNMENT.md`
- `docs/UX_DECISIONS.md`
- `docs/ACCEPTANCE_CRITERIA.md`
- placeholder generated documents
- this `AGENTS.md`

Commit the initial project state before agent execution begins.

---

# Phase 1 — Discovery

Run in parallel:

1. API Scout
2. Architecture Scout

No application feature implementation occurs during this phase.

---

# Checkpoint A — Discovery Review

After both scouts finish:

1. review both reports
2. reconcile contradictions
3. identify unresolved API questions
4. identify architecture decisions requiring human approval
5. confirm that mandatory assignment requirements remain represented

Do not start Foundation yet.

---

# Phase 2 — Discovery Integration

Run one focused repository-modification task.

Create/update:

- `docs/API_CONTRACT.md`
- `docs/ARCHITECTURE.md`

using approved discovery findings.

---

# Checkpoint B — Architecture Approval

Review:

- verified API contract
- proposed architecture
- backend gaps
- mobile connectivity/build strategy
- dependency choices
- scope

Do not start Foundation until this checkpoint is accepted.

---

# Phase 3 — Foundation

Run:

1. Foundation Agent

Only one task should own shared project initialization at this stage.

---

# Checkpoint C — Foundation Verification

Before feature work:

- install dependencies
- start web
- start mobile
- verify TypeScript/tooling
- inspect shared package boundaries
- confirm no unnecessary architecture was introduced

Integrate Foundation.

---

# Phase 4 — Feature Implementation

Run in parallel:

1. Web Agent
2. Mobile Agent

Use isolated worktrees/branches.

Avoid overlapping modifications to shared foundation files.

If both agents require the same shared change, coordinate one shared implementation instead of independently creating conflicting versions.

---

# Phase 5 — Integration

Integrate Web and Mobile work.

Then run baseline repository validation.

Do not begin final QA against isolated feature worktrees.

QA evaluates the integrated project.

---

# Phase 6 — QA / Reporter

Run:

1. QA / Reporter

Evaluate the integrated project against:

`docs/ACCEPTANCE_CRITERIA.md`

Update:

`docs/IMPLEMENTATION_REPORT.md`

---

# Phase 7 — Targeted Fixes

Create small, focused fix tasks based on QA findings.

Examples:

- web auth fix
- mobile stock-input fix
- API error mapping fix
- APK networking fix
- README correction

Avoid reopening broad feature tasks when a narrow fix is sufficient.

---

# Phase 8 — Final QA

Run QA / Reporter again.

Verify at minimum:

- all Required acceptance criteria
- critical Quality / UX criteria
- clean installation
- production web build
- mobile runtime
- Android APK
- critical web user flow
- critical mobile user flow
- README accuracy

Record final status in:

`docs/IMPLEMENTATION_REPORT.md`

---

# 9. Recommended Parallelism

Do not maximize agent count.

Prefer at most 2–3 active workers simultaneously.

## Good Parallelism

- API Scout + Architecture Scout
- Web Agent + Mobile Agent
- independent narrow fixes affecting separate areas

## Avoid

- Foundation + Web
- Foundation + Mobile
- multiple agents changing shared tooling simultaneously
- multiple agents establishing competing API contracts
- multiple agents modifying `docs/IMPLEMENTATION_REPORT.md`
- overlapping fixes to the same files without coordination

---

# 10. Escalation Rules

An agent must surface the issue before proceeding when a decision would materially change:

- mandatory assignment scope
- a human UX decision
- verified API behavior
- approved architecture
- backend behavior
- shared package boundaries
- authentication strategy
- delivery/build strategy
- Android APK viability

Small local implementation details do not require escalation.

---

# 11. Agent Task Completion

An agent task is complete only when:

1. the assigned work or investigation is finished
2. relevant validation has been executed
3. failures are reported
4. assumptions are explicit
5. unresolved issues are surfaced
6. changes remain within assigned scope
7. no authoritative project document was silently redefined

An individual task being complete does not mean the project is complete.

Project completion is determined by the final QA / Reporter pass against:

`docs/ACCEPTANCE_CRITERIA.md`

## Local development quick facts

- Backend: `~/.dotnet/dotnet run --project src/StokMate.Api` from `api/StokMate` (dotnet is NOT on PATH); listens on `0.0.0.0:5080`; in-memory — every restart re-seeds data and kills all sessions. Contract: `docs/API_CONTRACT.md`. Test user: `test@ornek.com` / `Test1234!`.
- Monorepo commands live in the root `package.json` scripts (`dev:web`, `dev:mobile`, `typecheck`, `lint`, `build:web`, `test`). `npm run test:live --workspace shared` exercises the shared client against the running backend.
- ESLint is pinned to v9 across workspaces: `eslint-plugin-react` (via eslint-config-expo) crashes on ESLint 10.
- Android on this machine: working AVD is `TripFlow_API_36` (`medium_phone` references a missing Play Store image); SDK at `~/Library/Android/sdk`; export `JAVA_HOME=/opt/homebrew/opt/openjdk@17` for Gradle (`/usr/libexec/java_home` cannot see it). Metro port 8081 is often taken by another project — use `npx expo start --port 8082`. Expo Go is installed on the AVD; open the app headlessly with `adb shell am start -a android.intent.action.VIEW -d "exp://10.0.2.2:8082" host.exp.exponent`.
- The `shadcn` CLI resolves the `@` alias from `web/tsconfig.json` (not tsconfig.app.json); the alias is configured in both — if it ever writes a literal `web/@/` directory, the alias config regressed.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.

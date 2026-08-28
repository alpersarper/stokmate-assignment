# StokMate Acceptance Criteria

A requirement may only be marked complete when it has been implemented and verified.

If a criterion depends on backend behavior, the verified contract in `docs/API_CONTRACT.md` is the source of truth.

This document separates:

- **Required** — directly required by the assignment
- **Quality / UX** — implementation quality and agreed product decisions
- **Optional / Bonus** — enhancements that must not block required work

---

# 1. Required

## Backend & API Contract

- The provided backend under `api/StokMate` starts successfully.
- The provided test credentials authenticate successfully.
- `docs/API_CONTRACT.md` contains the verified API contract.
- Web and mobile clients use the verified API endpoints and data contracts.
- Unsupported API behavior is not invented by the clients.
- Any necessary backend modification is documented.

---

# 2. Required — Web

## Authentication

- A login screen is available.
- Valid credentials authenticate successfully.
- The authentication token/session is persisted using the mechanism supported by the implementation.
- Authenticated API requests include the required authentication information.
- When the authenticated session becomes invalid and cannot be renewed, the user is redirected to login.
- Authentication failures are visibly communicated.
- Authentication does not become stuck in an indefinite loading state.

## Product List

- Products are loaded from the actual API.
- Products are displayed in a usable catalog-management list/table.
- Products can be searched.
- Products can be filtered by category.
- Products can be filtered by brand.
- Products can be paginated according to the verified API contract.
- Search and filter changes produce the correct product result set.
- Search/filter changes do not require a full browser reload.

## Product Detail

- A product can be opened from the product list.
- Product detail is loaded from the actual API.
- Relevant product information is displayed.

## Product Update

- Product name can be updated.
- Product price can be updated.
- Product stock can be updated.
- Product status can be updated.
- Invalid values are handled according to the verified API validation rules.
- Successful updates are persisted through the actual API.
- After a successful update, product detail is refreshed from the backend.
- After a successful update, the active product list reflects the persisted server state without requiring a full browser reload.
- Failed updates do not appear successful.
- Failed updates allow correction or retry.

## Required Application States

- Initial loading is visibly represented.
- Product-list request failures have a visible error state.
- Product-detail request failures have a visible error state.
- Product-update failures have visible feedback.
- Empty product results have an intentional empty state.
- Zero-result search/filter states are distinguishable from an empty catalog.
- Save operations provide visible progress.
- Duplicate save submissions are prevented.

---

# 3. Required — Mobile

## Authentication

- A login screen is available.
- Valid credentials authenticate successfully.
- The authenticated session can be used for protected API requests.
- Authentication failures are visibly communicated.

## Product List

- Products are loaded from the actual API.
- Products are displayed in a mobile-friendly scrolling list.
- Products can be searched.
- A product can be opened from the list.
- Initial loading is visibly represented.
- Request failures have a visible error state.
- Zero-result searches have an intentional no-results state.

## Product Detail

- Product detail is loaded from the actual API.
- Product name and current stock are clearly visible.
- Product-detail loading and failure states are handled.

## Stock Update

- Current stock is clearly visible.
- The user can change the stock value.
- Invalid stock values are handled according to the verified API contract.
- Stock changes are persisted through the actual API.
- Saving provides visible progress.
- Duplicate stock-update submissions are prevented.
- Failed stock updates do not appear successful.
- Failed stock updates allow correction or retry.
- After success, persisted stock is refreshed from the backend and displayed.

---

# 4. Required — Delivery & Runtime

## Web

- Web dependencies install from the committed repository using the documented command.
- TypeScript validation completes successfully.
- Lint validation completes successfully if linting is configured.
- The production web build completes successfully.
- The built web application can be started using the documented workflow.

## Mobile

- Mobile dependencies install from the committed repository using the documented command.
- TypeScript validation completes successfully.
- Lint validation completes successfully if linting is configured.
- The mobile application starts successfully.
- The mobile application can communicate with the provided backend using documented configuration.
- An installable Android APK is generated.
- The delivery APK can be installed on an Android device or emulator.
- The APK launches without an immediate crash.
- The installed APK can complete:
  - login
  - product list
  - search
  - product detail
  - stock update

---

# 5. Required — Documentation

- `README.md` explains how to start the backend.
- `README.md` explains how to start the web application.
- `README.md` explains how to start the mobile application.
- Required environment/configuration values are documented.
- Mobile API/base-URL configuration is documented.
- Android APK generation is documented.
- Important assumptions are documented.
- Significant library choices are listed with short reasons.
- Relevant limitations are documented.
- README instructions have been checked against the integrated repository.

---

# 6. Quality / UX

These criteria define the agreed product-quality standard.

They improve the implementation but should not cause unnecessary architectural complexity.

## Search & Filtering

- Search uses a 300 ms debounce.
- Leading and trailing whitespace is ignored.
- Clearing search restores the default product list.
- Search or filter changes reset pagination to the first page.
- Search and active filters preserve each other.
- Existing usable data remains visible during background filtering/refetch where practical.
- Filter/search activity has lightweight loading feedback.
- Stale responses do not replace results for the current query.

## Web Product Detail & Editing

- Product detail initially opens in read-only mode.
- Editing requires an explicit `Edit` action.
- Edit mode provides `Save` and `Cancel`.
- Save is unavailable when the form is unchanged, invalid, or already saving.
- After success, the user remains on product detail and edit mode closes.
- Failed saves preserve entered values.
- Long forms keep Save/Cancel reasonably accessible.
- Unsaved changes require confirmation before being discarded.

## Mobile Stock Workflow

- Stock controls are directly available on product detail.
- Stock editing supports:
  - decrement
  - numeric input
  - increment
  - explicit `Save Stock`
- Changing the draft value does not immediately persist it.
- The input remains stable during normal typing and repeated stepper interaction.
- `Save Stock` is unavailable when unchanged, invalid, or already saving.
- Unsaved stock changes require confirmation before being discarded.

## Product Lists & Navigation

### Web

- The product list uses a dense table appropriate for catalog management.
- Product rows are clearly navigable to detail.
- Row interaction provides visible hover/focus feedback.
- Returning from detail preserves search, filters, and current page.
- Page changes scroll the product list to the top.

### Mobile

- The product list uses a stable compact-list presentation.
- The full product item is tappable.
- Product items provide visible press feedback.
- Product name and stock are easy to scan.

## Feedback & Fallback UI

- Initial loading does not result in a blank screen.
- Background refetch keeps usable content visible where practical.
- Global operation feedback uses stackable snackbars.
- Field-specific validation errors appear near the relevant field.
- Retry is available where meaningful.
- Unexpected rendering failures have an application-level fallback.

## Data Presentation

- Status values use human-readable labels.
- Status meaning does not rely on color alone.
- Zero stock receives explicit emphasis.
- Low-stock emphasis is only used when supported by verified domain/API information.
- Price and numeric data use consistent human-readable formatting.
- Currency is not invented or hardcoded without verified domain evidence.

## Authentication UX

- Password visibility can be toggled.
- Failed login preserves the email value and clears the password value.
- Login prevents duplicate submissions.
- A `Remember me` option is available and unchecked by default.
- A valid persisted session skips unnecessary login.
- Logout is accessible from authenticated areas.
- Logout prevents protected content from remaining accessible through normal navigation.

---

# 7. Optional / Bonus

Optional work must never block required functionality.

## Web Cross-client Refresh

- Product changes made by another client become visible on an already-open web product list without manually reloading the browser page.
- The chosen refresh strategy is documented.

## Mobile Pagination

- Additional product pages can be loaded using the verified API pagination model.
- Additional pages do not duplicate or lose existing results.
- Duplicate concurrent pagination requests are avoided.
- No unnecessary requests are made after the final page.

## Mobile Pull-to-refresh

- The mobile product list supports pull-to-refresh.
- Pull-to-refresh reloads the active product query.
- Pull-to-refresh preserves the active search term.

---

# 8. Verification Rules

A criterion may only be marked complete when there is evidence from one or more of:

- successful execution of the relevant user flow
- successful build or validation command
- automated test
- direct inspection when runtime verification is not applicable

An agent's claim that work is complete is not sufficient evidence by itself.

Unknown or unverified behavior must not be marked complete.

The final QA/Reporter pass must record implementation and verification status in:

`docs/IMPLEMENTATION_REPORT.md`

The assignment is considered deliverable when all **Required** criteria are satisfied.

Quality / UX criteria should be completed unless doing so would introduce disproportionate complexity or compromise required delivery.

Optional / Bonus criteria do not affect core completion.

# StokMate UX Decisions

## UX-001 — Product Search & Filtering

### Decision

Search should feel immediate without sending a request on every keystroke.

- search uses a 300 ms debounce
- leading and trailing whitespace is ignored
- clearing search restores the default product list
- changing search or filters resets pagination to the first page
- search and active filters are preserved while modifying each other
- zero matching results show a dedicated no-results state
- user input remains intact if a request fails

On web, search, category, and brand filters are displayed together above the product list.

Active filters remain visible and a clear/reset action is available.

When search or filters trigger a new request, keep existing results visible where possible and show lightweight loading feedback rather than replacing the entire page.

---

## UX-002 — Web Product Detail & Editing

### Decision

The web product detail screen opens in read-only mode.

Editing requires an explicit `Edit` action.

Edit mode provides:

- Save
- Cancel

The form uses a structured two-column layout on desktop when appropriate and collapses to one column on narrower screens.

For longer forms, Save and Cancel remain accessible through a sticky action area.

Save is enabled only when:

- at least one value has changed
- the form is valid
- no save request is currently running

After a successful save:

- remain on the product detail screen
- exit edit mode
- refresh persisted product data from the backend
- display the persisted server state
- show success feedback

If saving fails:

- remain in edit mode
- preserve entered values
- display the error
- allow correction or retry

---

## UX-003 — Unsaved Changes Protection

### Decision

When the user has unsaved changes, navigation that would discard those changes requires confirmation.

This applies to:

- Cancel
- Back navigation
- leaving the product detail flow
- logout when an editable workflow contains unsaved data
- leaving a mobile product detail with an unsaved stock change

If nothing has changed, no confirmation is shown.

The confirmation provides:

- Stay
- Discard Changes

---

## UX-004 — Feedback, Loading & Fallback States

### Decision

All major asynchronous workflows must provide explicit feedback.

### Loading

Initial loading should use structured loading UI such as skeletons when appropriate.

When existing data is being refreshed:

- keep usable content visible
- show lightweight progress feedback
- avoid unnecessary full-page loading states
- avoid visible layout jumps

### Feedback

Use stackable snackbars for global operation feedback.

Web:

- top-right placement
- maximum 3 visible notifications
- additional notifications wait in a queue

Mobile:

- notifications appear near the bottom
- notifications are queued to avoid covering important controls

Field-specific validation errors are shown inline near the affected input.

### Errors

Primary data errors provide:

- a clear error state
- a recovery action when meaningful

Partial failures should not unnecessarily hide unaffected usable content.

Unexpected rendering failures should have an application-level fallback rather than leaving a blank screen.

### Empty States

Distinguish between:

- no products available
- no products matching current search or filters

Provide a recovery action where appropriate.

---

## UX-005 — Mobile Stock Update Workflow

### Decision

Stock update is the primary mobile workflow and must be directly accessible from product detail.

The stock editor includes:

- decrement control
- numeric input
- increment control
- explicit `Save Stock` action

Changing the value does not immediately update the backend.

Changes remain local until `Save Stock` is selected.

### Input Behavior

The stock input must feel stable and responsive.

- temporary editing states should not reset or jump unexpectedly
- invalid characters or values are handled without disrupting typing
- direct numeric entry supports large changes
- increment/decrement supports quick small changes
- rapid interaction must produce a consistent value
- the submitted value is normalized and validated before sending

`Save Stock` is enabled only when:

- the value has changed
- the value is valid
- no stock update is running

After success:

- refetch persisted stock
- display the persisted value
- show success feedback

After failure:

- preserve the draft value
- remain on the screen
- allow correction or retry
- show error feedback

The stock editor is directly visible; there is no separate `Edit Stock` mode.

---

## UX-006 — Product Lists & Navigation

### Web

Use a dense product-management table.

Default information hierarchy:

1. Name
2. Category
3. Brand
4. Price
5. Stock
6. Status
7. Detail navigation affordance

Each row is clickable.

Discoverability is provided through:

- hover feedback
- pointer cursor
- visible keyboard focus
- trailing chevron/navigation affordance

Pagination:

- keeps current data visible while the new page loads
- shows lightweight loading feedback
- scrolls the product list to the top after page changes
- preserves the previous page if the new request fails

When returning from detail, preserve:

- search
- filters
- page
- relevant list context

### Mobile

Use a compact vertically scrolling product list rather than switching presentation based on result count.

Each item:

- is fully tappable
- includes a trailing chevron
- provides press feedback
- prioritizes product name and stock
- shows secondary product information with lower visual emphasis

Mobile search remains easy to access and supports pull-to-refresh.

Pull-to-refresh reloads the active product query without clearing the current search.

---

## UX-007 — Authentication & Session UX

### Login

The login form contains:

- email
- password
- password visibility toggle
- Remember me
- submit action

`Remember me` is unchecked by default.

During login:

- prevent duplicate submissions
- show loading feedback

After failed authentication:

- preserve email
- clear password
- show a clear authentication error

After successful authentication:

- navigate to the default authenticated landing route

### Existing Session

If a valid persisted session exists, skip unnecessary login and enter the authenticated application.

If the session becomes invalid, recover by returning to login according to the supported authentication behavior.

### Logout

Logout is available from authenticated areas.

If unsaved changes exist, the normal unsaved-changes confirmation applies.

After logout, the user must not be able to return to protected content through normal navigation history.

---

## UX-008 — Data Presentation & Validation

### Status

Status information must remain understandable without relying on color alone.

Use:

- explicit human-readable status labels
- accessible badge/pill treatment in read-only views
- controlled select/dropdown editing rather than free text

Actual status values come from the verified API contract.

### Stock

Stock should be visually easy to identify on both web and mobile.

- zero stock receives strong emphasis
- low stock may receive additional emphasis when the domain/API provides a verified low-stock signal
- do not invent a low-stock threshold in the client
- labels should accompany color-based emphasis where meaningful

### Numeric Data

- numeric table columns should be easy to scan
- price should use appropriate locale-aware formatting
- currency must not be invented by the client
- stock should use the precision supported by the API

### Validation

Use local validation for rules known by the client.

Use asynchronous validation only when a rule depends on server state or backend business logic.

Validation must:

- avoid disrupting typing
- preserve user input
- show field-specific errors near the affected field
- treat backend validation as authoritative

General server/business errors use the global snackbar feedback system.

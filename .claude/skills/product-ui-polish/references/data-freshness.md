# Data freshness pattern

Reusable pattern for any server-backed screen that shows a dataset
(product list, product detail, stats). This documents the **pattern**; if
the product has since shipped a freshness feature, read its actual
implementation first and treat this file as the design rationale behind
it — align wording and behavior with what shipped.

## The indicator

- Show when the displayed dataset was last successfully fetched, next to
  an explicit refresh action: `Updated 42 sec ago · Refresh`.
- Copy is customer-calm: **Refresh** / **Refresh data** / **Updated just
  now** / **Updated 3 min ago**. Never "Hard refresh", never technical
  cache language, in any user-facing surface. Localized (EN/TR) like all
  chrome.
- The timestamp reflects the last **successful** fetch of the displayed
  dataset. A failed refetch never advances it — stale-but-honest beats
  fresh-looking-but-wrong. A failed refresh shows error feedback while
  the old data and its true timestamp stay visible.

## Manual refresh behavior

- Revalidates via the data layer (TanStack Query refetch/invalidate) —
  never a full app or page reload.
- Preserves context: search text, active filters, sort, valid pagination,
  scroll position, and any in-progress user input.
- Keeps existing data visible while loading when safe (UX-004); shows
  immediate lightweight feedback on the trigger itself (spinner state on
  the refresh control).

## Coordinating refresh sources

All of these are the *same* logical refresh and must not stack into
request storms: explicit refresh button, pull-to-refresh (mobile), focus
refetch, reconnect refetch, interval polling (if any), and
mutation-driven invalidation.

- One in-flight request per dataset: concurrent triggers join the
  in-flight fetch (TanStack Query deduplicates queries with the same key —
  keep keys canonical).
- Short client-side cooldown on the explicit control so button-mashing
  does nothing extra; disable or no-op during the in-flight fetch.
- Bounded retries with backoff for automatic refetches; manual retry is
  always allowed.
- For genuinely expensive endpoints, backend rate limiting is the real
  protection — **client throttling is UX, not a security boundary**.

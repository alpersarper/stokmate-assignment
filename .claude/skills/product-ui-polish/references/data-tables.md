# Data table rules

Tables are the admin's primary working surface (the product list is the
home screen of the job). Target feel: current, calm, precise, highly
readable.

## Structure and hierarchy

- Deliberate column hierarchy: the approved order for products is
  Name → Category → Brand → Price → Stock → Status → chevron (UX-006).
  Primary columns get visual weight; secondary columns recede.
- Columns must support **vertical scanning**: an operator compares one
  column down many rows, so within a column keep alignment, format, and
  precision identical in every row.
- Numbers right-aligned (or decimal-aligned) with `tabular-nums`; text
  left-aligned. Never center data columns.
- Consistent formatting everywhere: currency via the shared `formatKurus`
  (₺, locale-aware), quantities as plain integers, dates in one format,
  units stated once (header) rather than repeated per cell.
- Predictable long-content handling: decide truncation vs wrapping per
  column and keep it stable; truncation needs a title/tooltip affordance.

## Visual restraint

- Spacing and alignment do the separating; borders are a last resort.
  Restrained row separators only; no heavy grid lines, no spreadsheet
  noise.
- No zebra striping unless rows are genuinely hard to track at the chosen
  density (fix density first).
- Status color is reinforcement, not the message: label always present
  (UX-008). No status-color excess, no badge on every cell.
- Comfortable operational density: not consumer-app tall rows, not
  compressed legacy-ERP rows. The current table's row height is the
  baseline; change it only with a diagnosed reason.

## Interaction

- Sorting state must be visible and understandable (active column +
  direction).
- Active filters must be obvious while scrolling results, and clearing
  them must be one action (UX-001).
- Row actions stay secondary to data; the whole row is the click target
  with hover, pointer cursor, and visible keyboard focus (UX-006).
- Sticky headers/columns only when they genuinely improve navigation at
  realistic data sizes.

## States

- While loading a new page/filter result, keep current data visible with
  lightweight progress feedback; no layout jumps (UX-004/UX-006).
- Initial load: structured skeleton that mirrors the table's real shape.
- Distinguish three distinct states: **empty** (no products exist),
  **no matches** (search/filters exclude everything — offer clearing),
  and **failed** (error + retry). Never present one as another.

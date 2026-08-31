# Data visualization rules

StokMate currently ships almost no charts (the backend exposes
`GET /products/stats`; the clients present numbers plainly). These rules
govern any visualization added or polished later.

## When to chart at all

Every visualization must answer a clear operator question ("what needs
restocking?", "how is stock distributed across categories?"). Use the
simplest representation that answers it — a sorted table or a plain number
with a label often beats a chart. If a chart doesn't improve
understanding, use text.

## Form

- No decorative graphs, no 3D, no ornamental gauges or speedometers.
- No unnecessary gradients or fills; no excessive animation (a chart that
  moves should be justifying why).
- One message per chart: don't stack competing metrics on shared axes to
  look comprehensive.

## Color

- Stable semantic colors, consistent with the product's status language
  (see root `DESIGN.md`): danger/red family for out-of-stock and
  Discontinued-adjacent meaning, amber for low stock, green for
  healthy/Active. Don't reassign these meanings per chart.
- Restrained palette: few hues, and never color alone for critical
  information — pair with labels, patterns, or position (UX-008 extends to
  charts).

## Labeling

- Units, legends, axes, labels, and time ranges must make the chart
  self-explanatory without surrounding prose.
- Currency via the shared ₺ formatting; localized labels (EN/TR).
- No excess numeric precision: quantities as integers, money to the kuruş
  only when the kuruş matters, percentages to a useful precision (usually
  0–1 decimals).

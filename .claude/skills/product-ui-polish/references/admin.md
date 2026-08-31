# Web admin design rules

The web app (`web/`) is head-office **operational software** — product
managers work in it for long sessions. It is not a marketing site, not a
consumer app, and not a portfolio piece. Calm, efficient, readable.

## Principles

- **Useful information density.** Operators compare and scan; generous
  whitespace that hides data is a cost, not a luxury.
- **Optimize for repeated use.** The 500th session matters more than the
  first impression. Predictable beats delightful.
- **Minimal cognitive load.** One obvious way to do each common thing.
- **Scanability and hierarchy over novelty.** The eye should land on the
  right thing without reading everything.
- **Recognition over recall.** Visible labels, visible state, visible
  filters — never make the operator remember hidden context.
- **Progressive disclosure.** Common actions obvious; rare actions
  reachable, not decorating every row.
- **Preserve user context.** Search, filters, page, scroll survive
  navigation and refresh (see `docs/UX_DECISIONS.md` UX-001/UX-006 — these
  are approved behavior, not suggestions).
- **Sensible defaults, error prevention, clear feedback.** Disable-with-
  reason beats fail-with-toast; inline validation near the field
  (UX-004/UX-008).

Never sacrifice usability for visual identity.

## Avoid (both failure directions)

Dated-enterprise **and** artistic-SaaS styling are failures here:

- giant typography, hero sections, decorative dashboards
- excessive cards, cards-inside-cards, every-number-a-KPI-card
- large unused whitespace areas
- gradients, glassmorphism, glowing borders, dramatic shadows
- excessive corner rounding
- ornamental charts, badge excess

## Where polish actually comes from

Precision: consistent spacing rhythm, exact alignment, deliberate type
scale, correct component anatomy, complete interaction states (hover,
focus-visible, active, disabled), consistency across screens. A screen is
polished when nothing is accidental.

## StokMate specifics

- Stack: shadcn/ui (radix-nova style) + Tailwind v4 tokens; see
  `web/DESIGN.md` for tokens, components, and status/stock conventions.
- Tables are the primary surface — see `references/data-tables.md`.
- Feedback: sonner snackbars top-right, max 3 visible (UX-004).
- EN/TR localization: check both locales when label lengths matter (UX-009).

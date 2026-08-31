# Web Admin Design (`web/`)

App-specific design facts, extracted from the shipped code. Shared product
language: root `DESIGN.md`. Approved behavior: `docs/UX_DECISIONS.md`.

## Stack

- shadcn/ui, **radix-nova** style, base color neutral, CSS variables on —
  see `components.json`. Icon library: lucide-react.
- Tailwind CSS v4 (`@theme` in `src/index.css`); no tailwind.config file.
- Font: **Geist Variable** (`@fontsource-variable/geist`), used for both
  `--font-sans` and `--font-heading`.
- Toasts: sonner via `components/ui/sonner.tsx`, top-right, max 3 (UX-004).

## Tokens (`src/index.css`)

- Neutral oklch scale for background/foreground/muted/border etc., with a
  `.dark` variant defined. `--destructive` is the only strongly chromatic
  token; `--primary` is near-black neutral.
- Radius: `--radius: 0.625rem` with derived sm–4xl steps. Don't hand-roll
  radii; use the scale.
- Statuses/stock use Tailwind palette tints on top of the neutral theme:
  emerald-100/800 (Active), amber-50/300/700/800 (low stock),
  `text-destructive` + destructive badge (zero stock / Discontinued).
  Reuse these exact pairings (`src/products/product-display.tsx` is the
  canonical source).

## Components in use (`src/components/ui/`)

alert-dialog, badge, button, checkbox, input, label, select, skeleton,
sonner, table. Add new primitives with the shadcn CLI (registry style
radix-nova) rather than writing parallel ones; the `@` alias resolves via
`web/tsconfig.json`. Domain display components (StatusBadge,
StockIndicator) live in `src/products/product-display.tsx` — extend these,
don't fork their logic into screens.

## Layout conventions

- App shell: sticky header (`border-b`, `bg-background/95 backdrop-blur`),
  content in `mx-auto max-w-6xl px-6`.
- The product table is the primary surface — rules in
  `.claude/skills/product-ui-polish/references/data-tables.md`. Rows are
  fully clickable with hover feedback, pointer cursor, visible
  focus-visible ring, trailing chevron (UX-006).
- Forms: read-only detail with explicit Edit mode; two-column desktop
  collapsing to one column; sticky Save/Cancel for long forms (UX-002).
- Focus style: `focus-visible:ring-3 ring-ring/50` (shadcn default) —
  keep keyboard focus visible everywhere.

## States

- Initial loads: `skeleton` components mirroring the final layout. The
  product-list skeleton is a real table with the actual localized column
  headers (headers don't depend on data) and column-proportioned cells.
- Refetches: keep data visible + lightweight indicator; no layout jumps.
- Empty vs no-matches vs error are distinct, each with a recovery action
  (clear filters / retry).

## Conventions added by the 2026-08-31 polish pass

- **Numeral rail in tables:** numeric cells keep every row's numeral on the
  same right-aligned rail. `StockIndicator` takes `align="right"` in table
  cells, which renders the label badge *before* the numeral; the default
  (numeral first) is for left-aligned contexts like the detail view.
- **Table-row keyboard focus:** rows use the muted tint *plus* an inset ring
  (`focus-visible:ring-2 ring-ring/70 ring-inset`) so keyboard focus never
  reads as hover.
- **Destructive dialog actions:** a data-losing confirm action (e.g. Discard
  changes) uses the `destructive` button variant; the safe action stays the
  quiet default. Never give a destructive action the primary emphasis.

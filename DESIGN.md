# StokMate Design Language (shared)

Purpose: preserve product-design decisions between sessions so future work
extends the existing language instead of reinventing it. This file holds
what **both** apps share; app specifics live in `web/DESIGN.md` and
`mobile/DESIGN.md`. Approved interaction behavior lives in
`docs/UX_DECISIONS.md` and always wins over this file.

Everything below is **extracted from the shipped product** — none of it is
aspirational. When a screen needs a rule this file doesn't have, apply the
principles in `.claude/skills/product-ui-polish/references/` (operational
calm, usability over identity) rather than inventing a fashionable system,
then record the new rule here.

## Product character

Operational inventory software for one product family: a head-office admin
(`web/`) and a store-floor companion (`mobile/`). Tone: calm, precise,
unglamorous. Polish budget goes to hierarchy, alignment, states, and
consistency — never decoration. No gradients, glassmorphism, dramatic
shadows, or hero moments anywhere in the product.

## Shared semantics

### Status (products)

API status values 1/2/3, always shown as a localized **text label** in a
badge/pill; color is reinforcement only (UX-008):

| Status | EN / TR label | Treatment |
| --- | --- | --- |
| 1 Active | Active / Aktif | positive tint (web: emerald-tinted secondary badge) |
| 2 Passive | Passive / Pasif | neutral outline |
| 3 Discontinued | Discontinued / Üretim Durduruldu | destructive |

### Stock emphasis

- `stock === 0` → strong destructive emphasis + "Out of stock" label.
- `0 < stock <= minStock` (the API's own low-stock signal) → amber
  emphasis + "Low stock" label. **Never invent a client-side threshold.**
- Otherwise: plain numeral, `tabular-nums`.

### Currency

Always TRY, formatted with the manual ₺ prefix by
`shared/src/utils/currency.ts` (`formatKurus`, integer kuruş math,
locale-aware separators: `₺39,50` tr / `₺39.50` en). Never use raw
`Intl` currency formatting (Hermes prints "TRY"), never re-denominate on
language switch (UX-009).

### Language

EN (default) + TR, switchable in-app, persisted per client. Chrome,
actions, validation, and status labels are localized; API data (product /
category / brand names) is shown as delivered. Verify layouts in both
locales — TR labels run long ("Üretim Durduruldu").

### Numbers

Quantities are integers. Numeric columns/fields use `tabular-nums`
(web) / consistent alignment (mobile). No decorative precision.

## Shared interaction tone

- Async work always has feedback; existing data stays visible during
  refreshes; no full-screen spinners over usable content (UX-004).
- Empty ≠ no-matches ≠ failed: three distinct states, each with a
  recovery action where meaningful.
- Errors are explicit, localized for known cases, and never destroy user
  input.
- Destructive/discarding navigation asks Stay / Discard Changes (UX-003).
- Feedback via queued snackbars: web top-right (max 3), mobile bottom.

## Icon language

Minimal and functional. Web uses lucide-react (shadcn default); mobile
currently uses text glyphs (chevron `›`) and typography instead of an icon
set. Both apps signal row navigation with a trailing chevron. Don't add
decorative icons; an icon must disambiguate or compress meaning.

## Typography philosophy

Quiet and functional. One typeface family per app (web: Geist Variable;
mobile: platform default), restrained scale, weight 600 for emphasis,
no display sizes. Hierarchy comes from weight, muted-color steps, and
spacing — not from large type.

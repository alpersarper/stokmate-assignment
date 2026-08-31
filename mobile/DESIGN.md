# Mobile Design (`mobile/`)

App-specific design facts, extracted from the shipped code. Shared product
language: root `DESIGN.md`. Approved behavior: `docs/UX_DECISIONS.md`.

## Stack

- Expo (managed) + React Navigation native stack. **Hand-styled UI — no
  component kit**, a deliberate decision (`docs/DECISIONS.md` §6). Don't
  introduce a UI library.
- All colors and radii come from `src/lib/theme.ts`; shared primitives
  (PrimaryButton, LoadingState, ErrorState, EmptyState, …) from
  `src/components/ui.tsx`; snackbars from `src/components/Snackbar.tsx`
  (queued, bottom-anchored, UX-004).

## Tokens (`src/lib/theme.ts`)

- Neutral stone ground: background `#f5f5f4`, white surfaces, border
  `#e5e5e5` / strong `#d4d4d4`; text steps `#171717` → `#525252` →
  `#737373`.
- Primary blue `#1d4ed8` (pressed `#1e40af`) — the only brand-ish hue,
  reserved for primary actions.
- Semantic triads (text / surface / border): danger `#b91c1c` on
  `#fef2f2`/`#fecaca`; warning `#a16207` on `#fefce8`/`#fde68a`; success
  `#15803d` on `#f0fdf4`/`#bbf7d0`. Same meanings as web's
  emerald/amber/destructive — never repurpose them.
- Radius scale 6 / 10 / 14. Light theme only (no dark mode shipped).

## Typography

Platform default font. Sizes in use cluster at 14 (body/muted), 16–17
(titles, buttons), weight `'600'` for emphasis. Keep the scale tight; no
display sizes.

## Interaction conventions

- Every tappable surface is a `Pressable` with a visible pressed style and
  proper `accessibilityRole`/`accessibilityState` — follow the pattern in
  `ui.tsx`.
- List rows: fully tappable, name + stock prioritized, secondary info
  muted, trailing text chevron `›` (UX-006 mobile).
- Stock editor (primary workflow): − / numeric input / + with explicit
  Save Stock; draft is local until saved; input never jumps while typing
  (UX-005).
- Pull-to-refresh on the product list preserves the current search.
- Safe areas via react-native-safe-area-context; keyboard must never
  cover the focused input or the save action. **Edge-to-edge Android:**
  every bottom-anchored or scrolling surface (bottom sheets, FlatList /
  ScrollView content, snackbars) adds `useSafeAreaInsets().bottom` to its
  bottom padding so controls and content clear the system nav bar —
  `Snackbar.tsx` is the reference pattern.
- Status badges follow the shared status semantics (root DESIGN.md):
  Active → success tone, Passive → neutral, Discontinued → danger.
- Stock emphasis never relies on color alone (UX-008): list rows carry the
  localized "Low stock" / "Out of stock" text next to the colored number,
  matching the detail badges.

## States

- Never a blank screen: LoadingState / ErrorState (with retry) /
  EmptyState from `ui.tsx` for every async surface.
- Skeleton color `#e7e5e4`; keep existing data visible during refetches.

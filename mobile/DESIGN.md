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

- Stone ground + surface system (2026-08-31 visual-refinement pass):
  background `#f4f4f2`, white content surfaces, **filled control surface**
  `surfaceMuted #eceae7` (pressed `surfacePressed #dedcd8`). Text steps are
  stone-tinted: `#1c1917` → `#57534e` → `#79716b`.
- **Surface hierarchy, not outlines.** Content cards are borderless white
  with faint `elevation.card`; the screen's one emphasized surface (the
  stock editor) uses `elevation.raised`. Separators are
  `StyleSheet.hairlineWidth` in `borderStrong`. Controls (search field,
  chips, tonal buttons, steppers) are `surfaceMuted` fills with **no
  border**. Never reintroduce 1px-outlined white boxes for everything —
  that was the wireframe look this pass removed.
- Primary blue `#1d4ed8` (pressed `#1e40af`) — the only brand-ish hue,
  reserved for primary actions; `primarySurface #e8eefb` is its tonal
  variant for active chrome (e.g. the Filters chip when filters restrict).
  Never use primary tints for status meaning.
- Semantic triads (text / surface / border): danger `#b91c1c` on
  `#fef2f2`/`#fecaca`; warning `#a16207` on `#fefce8`/`#fde68a`; success
  `#15803d` on `#f0fdf4`/`#bbf7d0`. Same meanings as web's
  emerald/amber/destructive — never repurpose them. Inline notices
  (discontinued, changed-elsewhere) are tinted bordered banners using
  these triads, not bare colored text.
- Radius 6 / 10 / 14 / pill(999); spacing scale 4/8/12/16/20/24 with 16 as
  the screen gutter; `numeral` = `tabular-nums` for every stock numeral.
  Light theme only (no dark mode shipped).

## Typography

Platform default font, scale in `theme.ts` `type`: headline 20/700 (detail
product name), title 17/600 (card titles), item 16/600 (row names), body
15, meta 13 muted, caption 12 muted, sectionLabel 11/600 uppercase
letter-spaced (group labels like "Product info"). Weight 600–700 for
emphasis; no display sizes. Stock numerals lead their context (18/700 in
list rows, 24/700 in the editor input) and are always tabular.

## Brand mark

Three ascending stock bars on a primary-blue rounded tile: `BrandMark` in
`LoginScreen.tsx` (plain Views) and the same motif in `web/public/
favicon.svg`. Don't invent alternative logos.

## Interaction conventions

- Every tappable surface is a `Pressable` with a visible pressed style
  (token-based background shift), `android_ripple` (`colors.ripple`) on
  buttons/rows/steppers, and proper `accessibilityRole`/
  `accessibilityState` — follow the pattern in `ui.tsx`. Ripple targets
  need `overflow: 'hidden'` so it clips to the radius.
- List rows: fully tappable, name + stock prioritized, secondary info
  muted, trailing text chevron `›` (UX-006 mobile). The right rail is a
  stat block: stock numeral (18/700 tabular, semantic color when low/out)
  over a caption — the localized low/out label when it applies (UX-008),
  the plain "Stock" caption otherwise; the row shows no "Stock:" prefix.
- Screen chrome (search + filter/sort + summary + freshness) sits on one
  white sheet under the header with a hairline bottom edge; results scroll
  on the stone ground beneath it.
- Bottom sheets: grabber bar, uppercase section labels, tonal chips
  (selected = solid primary), tonal Clear + primary Done in the footer.
- Reduced motion: gate any looping/added animation on `useReduceMotion()`
  (`ui.tsx`); the skeleton pulse is the reference.
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
  EmptyState from `ui.tsx` for every async surface. The product list's
  initial load uses `SkeletonList` (ghost rows in the real row
  silhouette); recovery actions use `TonalButton`.
- Skeleton color `#e7e5e4`; keep existing data visible during refetches.
- Unsaved-changes confirmations stay on the native `Alert` (platform
  correctness); its default system accent color is accepted as-is.

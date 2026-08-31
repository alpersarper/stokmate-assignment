# Mobile design rules

The mobile app (`mobile/`) is used by store staff on the shop floor —
often one-handed, mid-task, in a hurry. It is **touch-first software
designed for mobile**, not a compressed version of the admin. Stock update
is the primary workflow (UX-005).

## Principles

- **Primary actions first.** Finding a product and updating its stock must
  be the shortest path in the app. Everything else is secondary.
- **One-handed use.** Primary controls within thumb reach; critical
  actions not stranded at the top of tall screens.
- **Touch targets.** Comfortable hit areas (≥44pt effective) with visible
  press feedback on everything tappable.
- **Shallow navigation.** List → detail → done. No deep drill-downs, no
  desktop-pattern transplants (no hover-dependent affordances, no dense
  multi-column layouts, no tiny inline icon buttons).
- **Clear hierarchy + progressive disclosure.** Name and stock lead;
  secondary product info is visually muted (UX-006 mobile).
- **Immediate feedback, predictable behavior.** Every tap responds now;
  async work shows progress; drafts survive failures (UX-005).
- **Platform correctness.** Safe areas respected, keyboard never hides the
  focused input or the save action, smooth scrolling, accessibility roles
  and labels on interactive elements, native-feeling components.

## Same product family as the admin

Share **meaning**, adapt **form**. Shared with web: color semantics
(danger/warning/success), terminology and status language (localized
Active/Passive/Discontinued), icon language, ₺ currency formatting via the
shared package, typography philosophy (quiet, functional), interaction
tone (calm, explicit feedback). Adapted for mobile: density, navigation
model, component anatomy, touch behavior, type scale, disclosure depth,
layout.

## StokMate specifics

- Hand-styled UI, deliberately no component kit (docs/DECISIONS.md §6).
  Tokens live in `mobile/src/lib/theme.ts`; shared primitives in
  `mobile/src/components/ui.tsx`. Extend those — don't introduce a UI
  library or parallel ad-hoc colors.
- Stock editor rules are approved behavior (UX-005): decrement / numeric
  input / increment + explicit Save Stock; local until saved; stable while
  typing.
- Feedback: queued snackbars near the bottom, never covering the save
  action (UX-004).
- Pull-to-refresh reloads the active query without clearing search
  (UX-006).
- Verify on the real emulator/device render, both EN and TR.

---
name: product-ui-polish
description: Controlled UI polish pass for a StokMate screen (web admin or mobile). Invoke explicitly as /product-ui-polish <target>, e.g. "/product-ui-polish products web table" or "/product-ui-polish mobile stock editor". Inspects the real rendered UI, critiques against the product's design rules, implements the smallest coherent improvement, and verifies visually. NEVER auto-apply this skill just because frontend code is being edited — it runs only when the user asks for a polish pass.
---

# Product UI Polish

A repeatable inspect → critique → implement → verify workflow for polishing
StokMate's real screens. **Polish, not redesign**: the outcome is the same
screen, clearly better — never a different screen.

This skill complements the official `frontend-design` skill (enabled for this
repo via the `frontend-design@claude-plugins-official` plugin):
`frontend-design` supplies general visual-design judgment — typography,
hierarchy, restraint, self-critique. This skill supplies what
`frontend-design` cannot know: StokMate's product constraints, its existing
design language, the inspection tooling, and the verification discipline.
When both are loaded, this skill's product rules win over generic aesthetic
preference. `frontend-design`'s "distinctive visual identity / take an
aesthetic risk" framing does **not** apply here — this is operational
software; see `references/admin.md`.

## Ground rules

- Only run when explicitly invoked by the user for a named target. Never
  restyle screens encountered while doing unrelated work.
- Human-approved decisions in `docs/UX_DECISIONS.md` are hard constraints.
  Never change interaction behavior they define. `DESIGN.md` (root),
  `web/DESIGN.md`, and `mobile/DESIGN.md` document the design language —
  extend it, don't replace it.
- Priority order for any change: comprehension > usability > interaction
  design > information hierarchy > data readability > consistency >
  spacing/typography > visual polish > novelty.
- Smallest coherent change set. No unrelated refactors, no new dependencies
  without escalation, no backend changes.

## Workflow

### A. Understand the target

Before touching styling: which app (web admin = head-office product
management; mobile = store staff, stock-first)? What is the screen's job, who
uses it, what do they do most often, what information is primary vs
secondary? Read the target's source to learn its components and states.

### B. Read product context

- Root `DESIGN.md` — shared product language (status semantics, ₺ currency,
  EN/TR, terminology).
- `web/DESIGN.md` or `mobile/DESIGN.md` — the target app's tokens,
  components, and conventions.
- `docs/UX_DECISIONS.md` — approved interaction behavior (constraints).
- The relevant reference file(s) below.
- Existing screens that already work well are constraints: match them.

### C. Inspect the actual rendered UI

Never judge visuals from JSX/StyleSheet/Tailwind classes alone when the real
interface can be observed.

- **Web**: run the dev server (`npm run dev:web`, port 5173; backend must be
  up — see AGENTS.md "Local development quick facts"). Use the Chrome
  DevTools MCP (`chrome-devtools` in `.mcp.json`) to open the page, take
  screenshots, resize to desktop (~1440px) **and** narrow (~768px and
  ~375px) viewports, exercise interactions, and watch the console.
- **Mobile**: use the Android emulator dev build (AGENTS.md quick facts:
  Metro 8082, `adb` available). The Expo plugin
  (`expo@claude-plugins-official`, enabled in `mobile/.claude/settings.json`)
  provides Expo tooling; screenshots can also be captured with
  `adb exec-out screencap -p > shot.png`.
- Capture "before" screenshots of every state you intend to change, at the
  viewports you will verify at.

### D. Diagnose

Critique the captured UI: cognitive load, hierarchy, scanability, spacing
rhythm, typography, alignment, density, discoverability of actions,
table/list readability, form clarity, interaction states (hover, focus,
pressed, disabled), consistency with sibling screens, loading/empty/error
states, accessibility (labels, contrast, focus visibility), responsive
behavior. Separate **usability problems** (fix) from **aesthetic
preference** (mention, usually skip). Write the diagnosis down before coding.

### E. References (optional)

When reference tooling is available (shadcn registry via the `shadcn` MCP,
or documented external sources), look at a *small* number of relevant
examples of the same pattern. Extract anatomy, hierarchy, density, spacing,
control placement — then synthesize into StokMate's own language. Reference
material is inspiration for structure, never a template; no SaaS-trend
collage.

### F. Implement

Resolve the diagnosed problems with the smallest coherent change set. Use
existing tokens and components (`web/src/components/ui/*`,
`mobile/src/components/ui.tsx`, `mobile/src/lib/theme.ts`). Polish ≠
redesign; if the fix seems to require restructuring a screen, stop and
surface it instead.

### G. Verify visually

Re-render the same screens, same viewports/device, and compare before/after
screenshots state by state. The bar is *clearly better*, not merely
different — if it's just different, revise or revert. Check both EN and TR
where text length differs.

### H. Verify behavior

Confirm nothing behavioral regressed: keyboard focus order and visibility,
responsive layouts, loading/empty/error states, search/filtering/sorting/
pagination, scrolling, forms and validation, touch targets, mobile keyboard
handling, safe areas, reduced motion. Run `npm run typecheck` and
`npm run lint`; run `npm run build:web` for web changes.

## References (load only what's relevant)

- `references/admin.md` — web admin design rules (operational software).
- `references/mobile.md` — mobile design rules (touch-first, store staff).
- `references/data-tables.md` — table rules (the admin's primary surface).
- `references/data-visualization.md` — chart/metric rules.
- `references/data-freshness.md` — freshness indicator + refresh pattern.

After a polish pass that establishes a new reusable convention, record it in
the appropriate `DESIGN.md` so future sessions inherit it.

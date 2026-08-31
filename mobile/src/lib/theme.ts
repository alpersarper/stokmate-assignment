import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Hand-styled palette (docs/ARCHITECTURE.md §7: no component kit).
 *
 * Surface system (mobile/DESIGN.md): stone page ground → white content
 * surfaces (no hard outlines; hairline separators + faint elevation) →
 * filled neutral control surfaces → primary/semantic tints for emphasis.
 * Text steps are stone-tinted to sit naturally on the stone ground.
 */
export const colors = {
  background: '#f4f4f2',
  surface: '#ffffff',
  /** Filled control surface (search field, tonal buttons, steppers). */
  surfaceMuted: '#eceae7',
  /** Pressed state for filled/tonal control surfaces. */
  surfacePressed: '#dedcd8',
  border: '#e8e6e3',
  borderStrong: '#d6d3d1',
  text: '#1c1917',
  textSecondary: '#57534e',
  textMuted: '#79716b',
  primary: '#1d4ed8',
  primaryPressed: '#1e40af',
  /** Tonal primary surface for active/selected chrome (never for status). */
  primarySurface: '#e8eefb',
  onPrimary: '#ffffff',
  danger: '#b91c1c',
  dangerSurface: '#fef2f2',
  dangerBorder: '#fecaca',
  warning: '#a16207',
  warningSurface: '#fefce8',
  warningBorder: '#fde68a',
  success: '#15803d',
  successSurface: '#f0fdf4',
  successBorder: '#bbf7d0',
  disabledSurface: '#e7e5e4',
  disabledText: '#a8a29e',
  skeleton: '#e7e5e4',
  /** Android ripple on white/neutral surfaces. */
  ripple: 'rgba(28, 25, 23, 0.10)',
} as const;

export const radius = { sm: 6, md: 10, lg: 14, pill: 999 } as const;

/** 4pt-based spacing rhythm; screens use `lg` (16) as the outer gutter. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 } as const;

/**
 * Type scale — platform font, tight range, hierarchy from size + weight +
 * tone together (root DESIGN.md typography philosophy).
 */
export const type = {
  /** Product name on detail, sheet-level headings. */
  headline: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3, color: colors.text },
  /** Card/section titles. */
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
  /** Primary row text (product name in lists). */
  item: { fontSize: 16, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  /** Secondary metadata lines. */
  meta: { fontSize: 13, color: colors.textMuted },
  /** Utility/freshness text. */
  caption: { fontSize: 12, color: colors.textMuted },
  /** Uppercase section label above content groups. */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
} satisfies Record<string, TextStyle>;

/** Big numerals (stock values) — always tabular so columns don't wobble. */
export const numeral: TextStyle = { fontVariant: ['tabular-nums'] };

/**
 * Elevation, used sparingly: `card` for resting content surfaces on the
 * stone ground, `raised` for the screen's single emphasized surface.
 * Depth clarifies grouping — never decorates.
 */
export const elevation = {
  card: {
    shadowColor: '#1c1917',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  raised: {
    shadowColor: '#1c1917',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} satisfies Record<string, ViewStyle>;

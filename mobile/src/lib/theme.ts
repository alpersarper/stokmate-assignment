/** Hand-styled palette (docs/ARCHITECTURE.md §7: no component kit). */
export const colors = {
  background: '#f5f5f4',
  surface: '#ffffff',
  border: '#e5e5e5',
  borderStrong: '#d4d4d4',
  text: '#171717',
  textSecondary: '#525252',
  textMuted: '#737373',
  primary: '#1d4ed8',
  primaryPressed: '#1e40af',
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
  disabledSurface: '#e5e5e5',
  disabledText: '#a3a3a3',
  skeleton: '#e7e5e4',
} as const;

export const radius = { sm: 6, md: 10, lg: 14 } as const;

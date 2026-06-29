// Platform-agnostic constants shared by web + mobile.
// (RN-specific tokens — SHADOW/elevation, react-native-chart-kit CHART_CONFIG — stay app-side.)

/** Responsive breakpoints (px). */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1200,
} as const;

/** Animation durations (ms). */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 600,
  extraSlow: 1000,
} as const;

/** Spacing scale (px). */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** Typography sizes per breakpoint (px). */
export const TYPOGRAPHY = {
  mobile: {
    hero: 42,
    title: 28,
    subtitle: 18,
    body: 16,
    caption: 14,
  },
  desktop: {
    hero: 68,
    title: 36,
    subtitle: 24,
    body: 18,
    caption: 16,
  },
} as const;

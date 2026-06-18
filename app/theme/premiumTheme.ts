/**
 * Premium Theme — sleek dark + glassmorphism with vibrant solar gradients.
 * Used exclusively by the redesigned Growatt experience.
 */
import { Platform } from 'react-native';

/**
 * Colors accepted by `expo-linear-gradient` (SDK 54+): a non-empty tuple of at
 * least two colors, rather than a plain `string[]`.
 */
export type GradientColors = readonly [string, string, ...string[]];

export const premiumTheme = {
  bg: {
    base: '#070b16',
    // Vertical page gradient
    gradient: ['#0a1124', '#080d1b', '#06080f'] as const,
    // Ambient glow blobs
    glowSolar: 'rgba(245, 158, 11, 0.20)',
    glowEnergy: 'rgba(45, 212, 191, 0.16)',
    glowViolet: 'rgba(139, 92, 246, 0.16)',
  },
  glass: {
    // On web the translucent white fills pair with `backdropFilter: blur()` to
    // create the frosted look. Native has no backdrop blur, so equally faint
    // fills would be ~95% see-through (content bleeds through cards/modals).
    // Use opaque dark surfaces on native instead so cards/modals are solid.
    fill: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.045)' : '#141b2e',
    fillStrong: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.075)' : '#1b2440',
    fillSubtle: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.025)' : '#0d1322',
    border: 'rgba(255, 255, 255, 0.09)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
  },
  text: {
    primary: '#f6f8fc',
    secondary: '#aeb8cc',
    muted: '#71809a',
    inverse: '#0a1124',
  },
  // Solar gold
  solar: {
    main: '#f59e0b',
    light: '#fbbf24',
    gradient: ['#fde047', '#fbbf24', '#f59e0b'] as const,
    soft: 'rgba(245, 158, 11, 0.14)',
  },
  // Energy teal/green
  energy: {
    main: '#10b981',
    light: '#34d399',
    gradient: ['#5eead4', '#2dd4bf', '#10b981'] as const,
    soft: 'rgba(45, 212, 191, 0.14)',
  },
  // Accent violet/indigo
  accent: {
    main: '#6366f1',
    light: '#818cf8',
    gradient: ['#a78bfa', '#818cf8', '#6366f1'] as const,
    soft: 'rgba(129, 140, 248, 0.14)',
  },
  // Revenue gold-lime
  revenue: {
    main: '#eab308',
    light: '#facc15',
    gradient: ['#fde68a', '#facc15', '#eab308'] as const,
    soft: 'rgba(234, 179, 8, 0.14)',
  },
  positive: '#34d399',
  negative: '#fb7185',
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 30,
    pill: 999,
  },
  space: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 22,
    xl: 30,
  },
};

/**
 * Web-only glass blur. react-native-web forwards backdropFilter to the DOM;
 * it is silently ignored on native, where translucent fills carry the look.
 */
export const glassBlur = (radius = 22) =>
  Platform.OS === 'web'
    ? ({
        backdropFilter: `blur(${radius}px)`,
        WebkitBackdropFilter: `blur(${radius}px)`,
      } as object)
    : {};

/**
 * Soft elevated glow shadow. Uses boxShadow on web for color spread,
 * and native shadow props elsewhere.
 */
export const glow = (color = 'rgba(0,0,0,0.45)', radius = 30, y = 18) =>
  Platform.OS === 'web'
    ? ({ boxShadow: `0 ${y}px ${radius}px rgba(2, 6, 20, 0.55)` } as object)
    : {
        shadowColor: color,
        shadowOffset: { width: 0, height: y },
        shadowOpacity: 0.45,
        shadowRadius: radius,
        elevation: 12,
      };

export default premiumTheme;

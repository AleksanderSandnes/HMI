import { BREAKPOINTS, TABLET_MIN_DIM } from "../constants";

/**
 * Structural layout decisions for a given window size (mobile app). Pure logic
 * so both orientations and form factors resolve from one place; the RN side
 * feeds it useWindowDimensions() (apps/mobile useLayoutMode).
 */
export interface LayoutMode {
  /** Window is wider than tall. */
  isLandscape: boolean;
  /** Tablet-class device (min dimension >= TABLET_MIN_DIM), any orientation. */
  isTablet: boolean;
  /** Phone rotated to landscape. */
  isPhoneLandscape: boolean;
  /** Navigation renders as a left rail instead of the bottom tab bar (tablets only). */
  showRail: boolean;
  /** Settings renders as list + detail side by side. */
  splitSettings: boolean;
  /** Dashboard column count (wide layouts: tablet or landscape phone). */
  columns: 1 | 2;
}

export function layoutModeFor(width: number, height: number): LayoutMode {
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= TABLET_MIN_DIM;
  const isPhoneLandscape = isLandscape && !isTablet;
  return {
    isLandscape,
    isTablet,
    isPhoneLandscape,
    // Phones keep the bottom tab bar in both orientations; only tablets rail.
    showRail: isTablet,
    // Width-gated as well: iPad mini portrait (744dp) is too narrow for a
    // comfortable list + detail pair, so it keeps the pushed stack.
    splitSettings: isTablet && width >= BREAKPOINTS.mobile,
    columns: isTablet || isPhoneLandscape ? 2 : 1,
  };
}

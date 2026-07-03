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
  /** Settings renders as list + detail side by side. */
  splitSettings: boolean;
  /** Dashboard column count (side-by-side sections in landscape only). */
  columns: 1 | 2;
}

export function layoutModeFor(width: number, height: number): LayoutMode {
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= TABLET_MIN_DIM;
  return {
    isLandscape,
    isTablet,
    isPhoneLandscape: isLandscape && !isTablet,
    // Width-gated as well: iPad mini portrait (744dp) is too narrow for a
    // comfortable list + detail pair, so it keeps the pushed stack.
    splitSettings: isTablet && width >= BREAKPOINTS.mobile,
    // Portrait always stacks (tablets included, matching the web layout);
    // landscape puts solar | weather side by side.
    columns: isLandscape ? 2 : 1,
  };
}

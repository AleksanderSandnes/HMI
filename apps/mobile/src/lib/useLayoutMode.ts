import { layoutModeFor, type LayoutMode } from "@hmi/core";
import { useWindowDimensions } from "react-native";

/**
 * Structural layout mode for the current window (orientation + form factor).
 * All structural branching (rail vs bottom tabs, column counts, split
 * settings) goes through this hook — NativeWind `md:` prefixes are
 * width-only and cannot express orientation, so keep them to minor spacing.
 */
export function useLayoutMode(): LayoutMode {
  const { width, height } = useWindowDimensions();
  return layoutModeFor(width, height);
}

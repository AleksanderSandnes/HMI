import { Platform } from "react-native";

import type { ThemeMode } from "../../lib/theme";

// Shared styling tokens for the SVG solar + weather charts
// (mobile equivalent of apps/web/components/charts/chartTheme.ts). Mode-aware —
// callers are React components, so read the active mode via useThemeColors()
// and pass it through rather than reading a module-level constant.
const AXIS_LABEL_COLOR: Record<ThemeMode, string> = {
  dark: "#71809a", // text-muted (dark)
  light: "#7b8698", // text-muted (light)
};

const GRID_COLOR: Record<ThemeMode, string> = {
  dark: "rgba(255,255,255,0.07)",
  light: "rgba(20,26,41,0.09)",
};

export const gridColor = (mode: ThemeMode): string => GRID_COLOR[mode];

export const AXIS_FONT_FAMILY = Platform.select({
  ios: "Helvetica Neue",
  android: "sans-serif",
  default: "sans-serif",
});

export const AXIS_FONT_SIZE = 12;
export const AXIS_FONT_WEIGHT = "600";

export interface AxisTextProps {
  fill: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
}

/** Plain font props for axis `<SvgText>` labels (no Skia SkFont required). */
export const axisTextProps = (mode: ThemeMode, size = AXIS_FONT_SIZE): AxisTextProps => ({
  fill: AXIS_LABEL_COLOR[mode],
  fontFamily: AXIS_FONT_FAMILY,
  fontSize: size,
  fontWeight: AXIS_FONT_WEIGHT,
});

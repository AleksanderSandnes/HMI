import { Platform } from "react-native";

// Shared styling tokens for the SVG solar + weather charts
// (mobile equivalent of apps/web/components/charts/chartTheme.ts).
export const AXIS_LABEL_COLOR = "#71809a"; // text-muted
export const GRID_COLOR = "rgba(255,255,255,0.07)";

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
export const axisTextProps = (size = AXIS_FONT_SIZE): AxisTextProps => ({
  fill: AXIS_LABEL_COLOR,
  fontFamily: AXIS_FONT_FAMILY,
  fontSize: size,
  fontWeight: AXIS_FONT_WEIGHT,
});

import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

import { useThemeColors } from "../../lib/theme";

interface GsunStops {
  base: readonly [string, string, string];
  solar: { color: string; opacity: string };
  teal: { color: string; opacity: string };
  violet: { color: string; opacity: string };
}

// Matches the design's `.gsun` — a vertical base gradient plus three soft
// elliptical glow blobs (solar top-left, teal top-right, violet below the
// screen), same positions in both modes. Light uses deeper accent hues at
// lower opacity (a light tint would barely show on a near-white base).
const DARK_GSUN: GsunStops = {
  base: ["#0a1124", "#080d1b", "#06080f"],
  solar: { color: "#f59e0b", opacity: "0.22" },
  teal: { color: "#2dd4bf", opacity: "0.17" },
  violet: { color: "#8b5cf6", opacity: "0.16" },
};

const LIGHT_GSUN: GsunStops = {
  base: ["#f5f8fd", "#eef3fa", "#e6edf7"],
  solar: { color: "#f59e0b", opacity: "0.16" },
  teal: { color: "#0d9488", opacity: "0.13" },
  violet: { color: "#6366f1", opacity: "0.12" },
};

/**
 * Ambient app background — the web design's `gsun`: a vertical base gradient plus
 * three soft **elliptical** glow blobs (solar top-left, teal top-right, violet
 * below the screen). On the tab screens this is rendered ONCE at the (tabs) layout
 * level, spanning both the scenes and the (transparent) tab bar so the background
 * is continuous with no seam. Render as the first child of a flex-1 container.
 */
export function ScreenBackground() {
  const { mode } = useThemeColors();
  const g = mode === "dark" ? DARK_GSUN : LIGHT_GSUN;

  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id="bg-base" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={g.base[0]} />
          <Stop offset="0.55" stopColor={g.base[1]} />
          <Stop offset="1" stopColor={g.base[2]} />
        </LinearGradient>
        <RadialGradient id="bg-solar" cx="16%" cy="0%" rx="60%" ry="46%">
          <Stop offset="0" stopColor={g.solar.color} stopOpacity={g.solar.opacity} />
          <Stop offset="0.6" stopColor={g.solar.color} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="bg-teal" cx="96%" cy="8%" rx="52%" ry="42%">
          <Stop offset="0" stopColor={g.teal.color} stopOpacity={g.teal.opacity} />
          <Stop offset="0.6" stopColor={g.teal.color} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="bg-violet" cx="50%" cy="102%" rx="70%" ry="55%">
          <Stop offset="0" stopColor={g.violet.color} stopOpacity={g.violet.opacity} />
          <Stop offset="0.66" stopColor={g.violet.color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg-base)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg-solar)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg-teal)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#bg-violet)" />
    </Svg>
  );
}

export default ScreenBackground;

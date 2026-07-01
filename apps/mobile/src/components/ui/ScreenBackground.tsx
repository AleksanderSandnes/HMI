import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * Ambient app background — a faithful port of the web design's `gsun` gradient:
 * a vertical base gradient plus three soft **elliptical** glow blobs pinned to the
 * corners / below the screen (solar top-left, teal top-right, violet at 102% —
 * off-screen). Keeping the glows at the edges is what stops them domeing up into
 * the (translucent) glass cards. Render it as the first child of a flex-1
 * container, with the screen content layered on top.
 */
export function ScreenBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id="bg-base" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0a1124" />
          <Stop offset="0.55" stopColor="#080d1b" />
          <Stop offset="1" stopColor="#06080f" />
        </LinearGradient>
        <RadialGradient id="bg-solar" cx="16%" cy="0%" rx="60%" ry="46%">
          <Stop offset="0" stopColor="#f59e0b" stopOpacity="0.22" />
          <Stop offset="0.6" stopColor="#f59e0b" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="bg-teal" cx="96%" cy="8%" rx="52%" ry="42%">
          <Stop offset="0" stopColor="#2dd4bf" stopOpacity="0.17" />
          <Stop offset="0.6" stopColor="#2dd4bf" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="bg-violet" cx="50%" cy="104%" rx="65%" ry="42%">
          <Stop offset="0" stopColor="#8b5cf6" stopOpacity="0.09" />
          <Stop offset="0.6" stopColor="#8b5cf6" stopOpacity="0" />
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

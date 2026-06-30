import { StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * Ambient app background — the RN port of the web `body` gradient in
 * apps/web/app/globals.css: a vertical base gradient plus three soft radial glow
 * blobs (solar top-left, teal top-right, violet bottom). Without this the glass
 * surfaces have only flat black behind them, so their backdrop blur reads as a
 * washed-out haze. Render it as the first child of a flex-1 container, with the
 * screen content layered on top.
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
        <RadialGradient id="bg-solar" cx="18%" cy="0%" r="60%">
          <Stop offset="0" stopColor="#f59e0b" stopOpacity="0.2" />
          <Stop offset="0.6" stopColor="#f59e0b" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="bg-teal" cx="92%" cy="12%" r="55%">
          <Stop offset="0" stopColor="#2dd4bf" stopOpacity="0.16" />
          <Stop offset="0.6" stopColor="#2dd4bf" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="bg-violet" cx="50%" cy="100%" r="65%">
          <Stop offset="0" stopColor="#8b5cf6" stopOpacity="0.16" />
          <Stop offset="0.65" stopColor="#8b5cf6" stopOpacity="0" />
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

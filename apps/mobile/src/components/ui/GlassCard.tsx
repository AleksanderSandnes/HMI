import { BlurView } from "expo-blur";
import { View, StyleSheet, Platform, type ViewProps } from "react-native";

import { cn } from "../../lib/cn";
import { useThemeColors } from "../../lib/theme";

interface GlassCardProps extends ViewProps {
  /** Stronger fill + border for primary surfaces. */
  strong?: boolean;
  /** Adds an elevated glow shadow. */
  elevated?: boolean;
  /** Override the blur intensity (0–100). */
  intensity?: number;
  /** Layout/padding classes applied to the card (mirrors web GlassCard). */
  className?: string;
}

const ELEVATED = StyleSheet.create({
  shadow: {
    shadowColor: "#020614",
    shadowOpacity: 0.55,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
}).shadow;

// Card fill. iOS gets a real expo-blur frost + a translucent sheen (true frosted
// glass) — white-on-dark in dark mode, denser white-on-light in light mode (the
// design's light glass surfaces read as near-solid white). Android has NO
// backdrop blur, so a translucent fill would just let the ambient gradient bleed
// through unevenly — instead we use an OPAQUE glass-toned surface a few shades
// off the background (= the colour a frosted card resolves to), which reads as a
// raised glass panel and is perfectly uniform with zero bleed.
const FILL = StyleSheet.create({
  iosBaseDark: { backgroundColor: "rgba(255, 255, 255, 0.05)" },
  iosStrongDark: { backgroundColor: "rgba(255, 255, 255, 0.085)" },
  iosBaseLight: { backgroundColor: "rgba(255, 255, 255, 0.5)" },
  iosStrongLight: { backgroundColor: "rgba(255, 255, 255, 0.78)" },
  androidBaseDark: { backgroundColor: "#161d30" },
  androidStrongDark: { backgroundColor: "#1d2740" },
  androidBaseLight: { backgroundColor: "#f4f6fb" },
  androidStrongLight: { backgroundColor: "#ffffff" },
});

function fillStyle(isIOS: boolean, isDark: boolean, strong: boolean) {
  if (isIOS) {
    if (isDark) return strong ? FILL.iosStrongDark : FILL.iosBaseDark;
    return strong ? FILL.iosStrongLight : FILL.iosBaseLight;
  }
  if (isDark) return strong ? FILL.androidStrongDark : FILL.androidBaseDark;
  return strong ? FILL.androidStrongLight : FILL.androidBaseLight;
}

/**
 * Frosted-glass surface — the building block of every screen. A hairline border
 * over a frosted fill: real expo-blur on iOS, an opaque glass-toned slate on
 * Android (no blur available), so cards are always uniform.
 */
export function GlassCard({
  strong = false,
  elevated = false,
  intensity,
  className,
  children,
  style,
  ...rest
}: GlassCardProps) {
  const isIOS = Platform.OS === "ios";
  const { mode } = useThemeColors();
  const isDark = mode === "dark";
  const fill = fillStyle(isIOS, isDark, strong);

  return (
    <View
      style={[elevated && ELEVATED, style]}
      className={cn(
        "overflow-hidden rounded-lg border",
        strong ? "border-glass-border-strong" : "border-glass-border",
        className,
      )}
      {...rest}
    >
      {isIOS ? (
        <BlurView
          intensity={intensity ?? (strong ? 30 : 22)}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, fill]} />
      {children}
    </View>
  );
}

export default GlassCard;

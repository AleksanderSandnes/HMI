import { BlurView } from "expo-blur";
import { View, StyleSheet, Platform, type ViewProps } from "react-native";

import { cn } from "../../lib/cn";

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

// Card fill. iOS gets a real expo-blur frost + a translucent white sheen (true
// frosted glass). Android has NO backdrop blur, so a translucent fill would just
// let the ambient gradient bleed through unevenly — instead we use an OPAQUE
// glass-toned slate a few shades LIGHTER than the background (= the colour a
// frosted card resolves to), which reads as a raised glass panel and is perfectly
// uniform with zero bleed.
const FILL = StyleSheet.create({
  iosBase: { backgroundColor: "rgba(255, 255, 255, 0.05)" },
  iosStrong: { backgroundColor: "rgba(255, 255, 255, 0.085)" },
  androidBase: { backgroundColor: "#161d30" },
  androidStrong: { backgroundColor: "#1d2740" },
});

function fillStyle(isIOS: boolean, strong: boolean) {
  if (isIOS) return strong ? FILL.iosStrong : FILL.iosBase;
  return strong ? FILL.androidStrong : FILL.androidBase;
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
  const fill = fillStyle(isIOS, strong);

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
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, fill]} />
      {children}
    </View>
  );
}

export default GlassCard;

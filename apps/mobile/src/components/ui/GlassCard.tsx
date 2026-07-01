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

// Dark backing tint so the card reads as a crisp dark panel like the web glass
// surface. On iOS a light scrim sits over a real expo-blur frost; on Android we
// skip the (buggy, washed-out / white-flashing) experimental blur entirely and
// use a more opaque scrim so content stays sharp over the ambient background
// glows — matching the web's CSS backdrop-filter look without its artifacts.
const SCRIM = StyleSheet.create({
  iosBase: { backgroundColor: "rgba(12, 17, 32, 0.42)" },
  iosStrong: { backgroundColor: "rgba(15, 20, 38, 0.5)" },
  androidBase: { backgroundColor: "rgba(12, 17, 32, 0.6)" },
  androidStrong: { backgroundColor: "rgba(16, 22, 40, 0.66)" },
});

/**
 * Frosted-glass surface — the building block of every screen. A hairline border,
 * a translucent dark fill, and an optional glow. Mirrors
 * apps/web/components/ui/GlassCard.tsx (which uses CSS backdrop-filter): on iOS a
 * real expo-blur frost sits behind a light scrim; on Android a more opaque scrim
 * stands in for blur so content stays crisp without the experimental blur's
 * washed-out / white-flash artifacts.
 */
function scrimStyle(isIOS: boolean, strong: boolean) {
  if (isIOS) return strong ? SCRIM.iosStrong : SCRIM.iosBase;
  return strong ? SCRIM.androidStrong : SCRIM.androidBase;
}

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
  const scrim = scrimStyle(isIOS, strong);

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
          intensity={intensity ?? (strong ? 26 : 20)}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, scrim]} />
      {children}
    </View>
  );
}

export default GlassCard;

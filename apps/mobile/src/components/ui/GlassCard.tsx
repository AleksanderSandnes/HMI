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

// Light translucent fill (matching the web `--glass` / `--glassS` tokens) so the
// card reads as see-through frosted glass over the ambient gsun glow rather than
// a flat dark-blue panel. On iOS a real expo-blur frost sits behind it; on
// Android there is no blur, so a faint dark tint under the light fill keeps text
// legible while the gradient still bleeds through.
const FILL = StyleSheet.create({
  light: { backgroundColor: "rgba(255, 255, 255, 0.05)" },
  lightStrong: { backgroundColor: "rgba(255, 255, 255, 0.08)" },
  androidTint: { backgroundColor: "rgba(9, 13, 27, 0.34)" },
  androidTintStrong: { backgroundColor: "rgba(9, 13, 27, 0.3)" },
});

/**
 * Frosted-glass surface — the building block of every screen. A hairline border,
 * a translucent fill, and an optional glow. Mirrors
 * apps/web/components/ui/GlassCard.tsx (CSS backdrop-filter): on iOS a real
 * expo-blur frost sits behind the light fill; on Android a faint dark tint under
 * the light fill stands in for blur while staying see-through over the glow.
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
      ) : (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, strong ? FILL.androidTintStrong : FILL.androidTint]}
        />
      )}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, strong ? FILL.lightStrong : FILL.light]}
      />
      {children}
    </View>
  );
}

export default GlassCard;

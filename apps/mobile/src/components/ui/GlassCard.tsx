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

// Low-opacity WHITE fill matching the web design's `--glass` / `--glassS` tokens
// (which use NO backdrop-filter): a plain translucent white overlay + hairline
// border over the ambient gsun gradient reads as a uniform, subtly-lighter glass
// panel. On iOS a real expo-blur frost sits behind the fill; Android has no blur
// but, because the ambient glows are pinned to the screen edges (see
// ScreenBackground), the white fill stays uniform with no glow bleed.
const FILL = StyleSheet.create({
  base: { backgroundColor: "rgba(255, 255, 255, 0.05)" },
  strong: { backgroundColor: "rgba(255, 255, 255, 0.085)" },
});

/**
 * Frosted-glass surface — the building block of every screen. A hairline border
 * and a translucent white fill over the ambient background (design `.glass` /
 * `.glassS`). iOS adds a real expo-blur frost behind the fill.
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
      ) : null}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, strong ? FILL.strong : FILL.base]}
      />
      {children}
    </View>
  );
}

export default GlassCard;

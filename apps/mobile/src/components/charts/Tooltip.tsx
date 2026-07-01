import { type ReactNode } from "react";
import { View } from "react-native";

import { GlassCard } from "../ui/GlassCard";

const BUBBLE_W = 132;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Floating glass value bubble anchored to a chart x-position, clamped to stay
 * inside the chart width. Mirrors the web charts' tooltip.
 */
export function TooltipBubble({
  x,
  width,
  top = 6,
  children,
}: {
  x: number;
  width: number;
  top?: number;
  children: ReactNode;
}) {
  const left = clamp(x - BUBBLE_W / 2, 4, Math.max(4, width - BUBBLE_W - 4));
  return (
    <View pointerEvents="none" style={{ position: "absolute", left, top, width: BUBBLE_W }}>
      <GlassCard strong elevated intensity={40} className="px-3 py-2">
        {children}
      </GlassCard>
    </View>
  );
}

export default TooltipBubble;

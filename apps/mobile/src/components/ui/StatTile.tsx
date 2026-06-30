import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { View, Text } from "react-native";

import { cn } from "../../lib/cn";
import { GRADIENTS, type StatGradient } from "../../lib/gradients";

import { GlassCard } from "./GlassCard";
import { Skeleton } from "./Skeleton";
import type { IconRender } from "./types";

interface StatTileProps {
  icon: IconRender;
  gradient: StatGradient;
  label: string;
  value: string;
  unit?: string;
  sublabel?: string;
  /** Percentage change vs previous period. */
  delta?: number | null;
  loading?: boolean;
  /** Denser tile for at-a-glance grids like the Dashboard. */
  compact?: boolean;
  className?: string;
}

function DeltaPill({ delta }: { delta: number }) {
  const positive = delta >= 0;
  return (
    <View
      className={cn(
        "flex-row items-center gap-1 rounded-pill px-2.5 py-1",
        positive ? "bg-[rgba(52,211,153,0.13)]" : "bg-[rgba(251,113,133,0.13)]",
      )}
    >
      <Ionicons
        name={positive ? "arrow-up" : "arrow-down"}
        size={9}
        color={positive ? "#34d399" : "#fb7185"}
      />
      <Text className={cn("text-xs font-extrabold", positive ? "text-positive" : "text-negative")}>
        {Math.abs(delta).toFixed(0)}%
      </Text>
    </View>
  );
}

// Size presets collapse the per-property `compact ? a : b` branching into one
// lookup (keeps the component's complexity low).
const SIZES = {
  regular: {
    pad: "p-[18px]",
    headMb: "mb-3.5",
    chip: 42,
    iconSize: 17,
    label: "text-[12.5px]",
    skeleton: "h-7 w-24",
    value: "text-[26px]",
    unit: "text-sm",
    sublabel: "mt-1.5 text-xs",
  },
  compact: {
    pad: "p-3.5",
    headMb: "mb-2.5",
    chip: 30,
    iconSize: 15,
    label: "text-[10.5px]",
    skeleton: "h-6 w-20",
    value: "text-[21px]",
    unit: "text-[11px]",
    sublabel: "mt-1 text-[10.5px]",
  },
} as const;

type TileSize = (typeof SIZES)[keyof typeof SIZES];

function TileValue({ value, unit, s }: { value: string; unit?: string; s: TileSize }) {
  return (
    <View className="mt-1.5 flex-row items-baseline gap-1.5">
      <Text className={cn("font-extrabold tracking-[-0.5px] text-text-primary", s.value)}>
        {value}
      </Text>
      {unit ? (
        <Text className={cn("font-semibold text-text-secondary", s.unit)}>{unit}</Text>
      ) : null}
    </View>
  );
}

/**
 * The app's single metric tile (mirrors apps/web/components/ui/StatTile.tsx) —
 * gradient icon chip + label + value (+ optional delta / sublabel). `compact`
 * shrinks it for dense grids; `loading` renders a skeleton.
 */
export function StatTile({
  icon,
  gradient,
  label,
  value,
  unit,
  sublabel,
  delta,
  loading = false,
  compact = false,
  className,
}: StatTileProps) {
  const s = compact ? SIZES.compact : SIZES.regular;

  return (
    <GlassCard strong className={cn("min-w-0 flex-1", s.pad, className)}>
      <View className={cn("flex-row items-center justify-between", s.headMb)}>
        <LinearGradient
          colors={GRADIENTS[gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: s.chip,
            height: s.chip,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon({ color: "#0a1124", size: s.iconSize })}
        </LinearGradient>
        {delta != null && isFinite(delta) ? <DeltaPill delta={delta} /> : null}
      </View>

      <Text className={cn("font-semibold uppercase tracking-[0.3px] text-text-muted", s.label)}>
        {label}
      </Text>

      {loading ? (
        <Skeleton className={cn("mt-2", s.skeleton)} />
      ) : (
        <TileValue value={value} unit={unit} s={s} />
      )}

      {sublabel && !loading ? (
        <Text className={cn("text-text-muted", s.sublabel)}>{sublabel}</Text>
      ) : null}
    </GlassCard>
  );
}

export default StatTile;

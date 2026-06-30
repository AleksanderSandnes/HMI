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
  const hasDelta = delta !== null && delta !== undefined && isFinite(delta);
  const positive = (delta ?? 0) >= 0;
  const chip = compact ? 30 : 42;

  return (
    <GlassCard strong className={cn("min-w-0 flex-1", compact ? "p-3.5" : "p-[18px]", className)}>
      <View className={cn("flex-row items-center justify-between", compact ? "mb-2.5" : "mb-3.5")}>
        <LinearGradient
          colors={GRADIENTS[gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: chip,
            height: chip,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon({ color: "#0a1124", size: compact ? 15 : 17 })}
        </LinearGradient>

        {hasDelta ? (
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
            <Text
              className={cn("text-xs font-extrabold", positive ? "text-positive" : "text-negative")}
            >
              {Math.abs(delta as number).toFixed(0)}%
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        className={cn(
          "font-semibold uppercase tracking-[0.3px] text-text-muted",
          compact ? "text-[10.5px]" : "text-[12.5px]",
        )}
      >
        {label}
      </Text>

      {loading ? (
        <Skeleton className={cn("mt-2", compact ? "h-6 w-20" : "h-7 w-24")} />
      ) : (
        <View className="mt-1.5 flex-row items-baseline gap-1.5">
          <Text
            className={cn(
              "font-extrabold tracking-[-0.5px] text-text-primary",
              compact ? "text-[21px]" : "text-[26px]",
            )}
          >
            {value}
          </Text>
          {unit ? (
            <Text
              className={cn(
                "font-semibold text-text-secondary",
                compact ? "text-[11px]" : "text-sm",
              )}
            >
              {unit}
            </Text>
          ) : null}
        </View>
      )}

      {sublabel && !loading ? (
        <Text className={cn("text-text-muted", compact ? "mt-1 text-[10.5px]" : "mt-1.5 text-xs")}>
          {sublabel}
        </Text>
      ) : null}
    </GlassCard>
  );
}

export default StatTile;

import { LinearGradient } from "expo-linear-gradient";
import { View, Text } from "react-native";

import { GRADIENTS, type StatGradient } from "../../lib/gradients";

import { GlassCard } from "./GlassCard";
import { Skeleton } from "./Skeleton";
import type { IconRender } from "./types";

function Module({
  label,
  value,
  unit,
  loading,
}: {
  label: string;
  value: string;
  unit?: string;
  loading?: boolean;
}) {
  return (
    <View className="min-w-0 flex-1">
      <Text className="text-[11px] font-bold uppercase tracking-[0.3px] text-text-muted">
        {label}
      </Text>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-16" />
      ) : (
        <Text
          numberOfLines={1}
          className="mt-1 text-[27px] font-extrabold leading-tight tracking-[-0.5px] text-text-primary"
        >
          {value}
          {unit ? <Text className="text-[12px] font-bold text-text-muted"> {unit}</Text> : null}
        </Text>
      )}
    </View>
  );
}

/**
 * Info tile with two data modules side by side, split by a divider — e.g.
 * "Today | This week" or "Now | Weekly avg". Mirrors
 * apps/web/components/ui/DualStat.tsx; fills its grid cell height so rows align.
 */
export function DualStat({
  icon,
  gradient,
  label,
  aLabel,
  aValue,
  aUnit,
  bLabel,
  bValue,
  bUnit,
  loading,
}: {
  icon: IconRender;
  gradient: StatGradient;
  label: string;
  aLabel: string;
  aValue: string;
  aUnit?: string;
  bLabel: string;
  bValue: string;
  bUnit?: string;
  loading?: boolean;
}) {
  return (
    <GlassCard strong className="h-full min-w-0 flex-1 justify-center gap-3.5 p-4">
      <View className="flex-row items-center gap-2">
        <LinearGradient
          colors={GRADIENTS[gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon({ color: "#0a1124", size: 16 })}
        </LinearGradient>
        <Text className="text-[12px] font-bold uppercase tracking-[0.3px] text-text-muted">
          {label}
        </Text>
      </View>
      <View className="flex-row items-stretch">
        <Module label={aLabel} value={aValue} unit={aUnit} loading={loading} />
        <View className="mx-3.5 w-px self-stretch bg-glass-border" />
        <Module label={bLabel} value={bValue} unit={bUnit} loading={loading} />
      </View>
    </GlassCard>
  );
}

export default DualStat;

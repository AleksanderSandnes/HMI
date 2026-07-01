import { Ionicons } from "@expo/vector-icons";
import { formatPeak, peakUnit, show } from "@hmi/core";
import { Text, View } from "react-native";

import type { DashboardModel } from "../../lib/useDashboardData";
import { GlassCard } from "../ui/GlassCard";

import { Sparkline } from "./Sparkline";

function kwLabel(watts: number | null | undefined): string {
  if (watts == null) return "—";
  const kw = watts / 1000;
  return kw.toFixed(kw >= 10 ? 1 : 2);
}

function ProducingPill({ producing }: { producing: boolean }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className={`h-1.5 w-1.5 rounded-pill ${producing ? "bg-positive" : "bg-text-muted"}`} />
      <Text className="text-[11px] font-bold uppercase tracking-[0.3px] text-text-secondary">
        {producing ? "Producing now" : "Idle"}
      </Text>
    </View>
  );
}

/** Focus dashboard solar hero: the one big "what am I making now" answer + curve. */
export function SolarHeroCard({ model }: { model: DashboardModel }) {
  const { currentPower, peak, utilisation, capacityKw, todayGen, sparkline } = model;
  const producing = (currentPower ?? 0) > 0;

  const subline = [
    utilisation != null && capacityKw != null
      ? `${utilisation}% of ${capacityKw} kW capacity`
      : null,
    todayGen != null ? `${show(todayGen, 1)} kWh so far today` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <GlassCard strong className="min-h-0 flex-1 justify-between p-[18px]">
      <View>
        <View className="flex-row items-center justify-between">
          <ProducingPill producing={producing} />
          {peak ? (
            <View className="flex-row items-center gap-1.5 rounded-pill bg-[rgba(245,158,11,0.14)] px-2.5 py-1">
              <Ionicons name="trending-up" size={13} color="#fbbf24" />
              <Text className="text-[11px] font-extrabold text-solar-light">
                Peak {formatPeak(peak.value)} {peakUnit(peak.value, "W")}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mt-2.5 flex-row items-end gap-1.5">
          <Text className="text-[56px] font-black leading-[0.9] tracking-[-2px] text-solar-light">
            {kwLabel(currentPower)}
          </Text>
          <Text className="mb-2 text-[20px] font-extrabold text-text-secondary">kW</Text>
        </View>
        {subline ? (
          <Text className="mt-1.5 text-[12.5px] font-medium text-text-muted">{subline}</Text>
        ) : null}
      </View>

      <View className="mt-3 flex-1">
        <Sparkline values={sparkline} />
      </View>
    </GlassCard>
  );
}

export default SolarHeroCard;

import { Ionicons } from "@expo/vector-icons";
import { show } from "@hmi/core";
import { Text, View } from "react-native";

import type { DashboardModel } from "../../lib/useDashboardData";
import { WindDialFace } from "../charts/dials/WindDial";
import { GlassCard } from "../ui/GlassCard";

type IonName = keyof typeof Ionicons.glyphMap;

function BigMetric({
  icon,
  color,
  label,
  value,
  unit,
}: {
  icon: IonName;
  color: string;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <View className="items-center">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name={icon} size={14} color={color} />
        <Text className="text-[11px] font-bold text-text-secondary">{label}</Text>
      </View>
      <Text className="mt-1.5 text-[34px] font-extrabold leading-none text-text-primary">
        {value}
        <Text className="text-[15px] font-bold text-text-muted"> {unit}</Text>
      </Text>
    </View>
  );
}

function StatCol({
  icon,
  color,
  label,
  value,
  unit,
  sub,
}: {
  icon: IonName;
  color: string;
  label: string;
  value: string;
  unit?: string;
  sub: string;
}) {
  return (
    <View className="min-w-0 flex-1">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name={icon} size={13} color={color} />
        <Text className="text-[11px] font-bold text-text-secondary">{label}</Text>
      </View>
      <Text className="mt-1.5 text-[22px] font-extrabold text-text-primary">
        {value}
        {unit ? <Text className="text-[10px] font-bold text-text-muted">{unit}</Text> : null}
      </Text>
      <Text className="mt-0.5 text-[10.5px] font-bold uppercase tracking-[0.3px] text-text-muted">
        {sub}
      </Text>
    </View>
  );
}

/** Focus dashboard weather panel: wind dial + temp/precip + UV/humidity/pressure. */
export function WeatherSummaryCard({ model }: { model: DashboardModel }) {
  const { obs, m, wkAvg } = model;
  return (
    <GlassCard strong className="min-h-0 flex-1 justify-between gap-3 p-3.5">
      <View className="flex-row items-center gap-3">
        <View className="items-center">
          <WindDialFace degrees={obs?.winddir} speed={m.windSpeed} gust={m.windGust} unit="km/h" />
        </View>
        <View className="mx-1 w-px self-stretch bg-glass-border" />
        <View className="flex-1 items-center gap-5">
          <BigMetric
            icon="thermometer"
            color="#fb7185"
            label="Temperature"
            value={show(m.temp)}
            unit="°C"
          />
          <BigMetric
            icon="rainy"
            color="#38bdf8"
            label="Precipitation"
            value={show(m.precipRate, 1)}
            unit="mm/h"
          />
        </View>
      </View>

      <View className="flex-row items-stretch">
        <StatCol
          icon="sunny"
          color="#fbbf24"
          label="UV index"
          value={show(obs?.uv)}
          sub={`avg ${show(wkAvg.uv)}`}
        />
        <View className="mx-3 w-px bg-glass-border" />
        <StatCol
          icon="water"
          color="#34d399"
          label="Humidity"
          value={show(obs?.humidity)}
          unit="%"
          sub={`avg ${show(wkAvg.humidity)}%`}
        />
        <View className="mx-3 w-px bg-glass-border" />
        <StatCol
          icon="speedometer"
          color="#22d3ee"
          label="Pressure"
          value={show(m.pressure)}
          unit="hPa"
          sub={`avg ${show(wkAvg.pressure)}`}
        />
      </View>
    </GlassCard>
  );
}

export default WeatherSummaryCard;

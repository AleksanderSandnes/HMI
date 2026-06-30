import { Ionicons } from "@expo/vector-icons";
import {
  BREAKPOINTS,
  buildWeatherSeries,
  formatPeak,
  getPeakOutput,
  peakUnit,
  toISO,
  type SolarData,
} from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PageHeader } from "../../src/components/PageHeader";
import { WindDial, DualBaro } from "../../src/components/charts";
import { DualStat } from "../../src/components/ui/DualStat";
import type { IconRender } from "../../src/components/ui/types";
import { average, lastPositive, round, show } from "../../src/lib/format";
import { useCore } from "../../src/lib/useCore";

const ic =
  (name: keyof typeof Ionicons.glyphMap): IconRender =>
  // eslint-disable-next-line react/display-name -- render-prop, not a component
  (p) => <Ionicons name={name} {...p} />;

interface CurrentWeather {
  observations?: {
    humidity?: number;
    winddir?: number;
    uv?: number;
    solarRadiation?: number;
    obsTimeLocal?: string;
    metric?: {
      temp?: number;
      heatIndex?: number;
      windChill?: number;
      windSpeed?: number;
      windGust?: number;
      pressure?: number;
      precipRate?: number;
      precipTotal?: number;
    };
  }[];
}

function SectionLabel({
  icon,
  text,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  right?: ReactNode;
}) {
  return (
    <View className="mt-1 flex-row items-center gap-2.5">
      <Ionicons name={icon} size={15} color="#fbbf24" />
      <Text className="text-[11.5px] font-bold uppercase tracking-[0.6px] text-text-secondary">
        {text}
      </Text>
      <View className="h-px flex-1 bg-glass-border" />
      {right}
    </View>
  );
}

export default function Dashboard() {
  const { growatt, weather } = useCore();
  const { width } = useWindowDimensions();
  const cols = width >= BREAKPOINTS.tablet ? 4 : 2;
  const tileW = (width - 32 - 12 * (cols - 1)) / cols;

  const today = toISO(new Date());
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toISO(d);
  }, []);

  const { data: solar, isLoading: solarLoading } = useQuery<SolarData>({
    queryKey: ["dashboard-solar", today],
    queryFn: () => growatt.fetchSolarData("hourly", today),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
  const { data: solarWeek } = useQuery<SolarData>({
    queryKey: ["dashboard-solar-week", yesterday],
    queryFn: () => growatt.fetchSolarData("weekly", yesterday),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const { data: weatherData, isLoading: weatherLoading } = useQuery<CurrentWeather>({
    queryKey: ["dashboard-weather"],
    queryFn: () => weather.getCurrentWeatherData(),
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 60_000,
  });
  const { data: weekObs } = useQuery({
    queryKey: ["dashboard-weather-week", yesterday],
    queryFn: () => weather.getWeeklyHourlyWeatherData(yesterday.replaceAll("-", "")),
    staleTime: 30 * 60_000,
  });

  const wkAvg = useMemo(() => {
    const obs = weekObs?.observations ?? [];
    const avg = (key: string) => average(buildWeatherSeries(obs, key, "weekly").series[0] ?? []);
    return {
      temp: avg("temperature"),
      humidity: avg("humidity"),
      pressure: avg("pressure"),
      solar: avg("solarRadiation"),
      uv: avg("uvIndex"),
    };
  }, [weekObs]);

  const currentPower = useMemo(
    () => lastPositive(solar?.chartData?.datasets?.[0]?.data ?? []),
    [solar],
  );

  const peak = solar ? getPeakOutput(solar.chartData, "hourly") : null;
  const todayGen = solar?.metrics.todayGeneration ?? null;
  const weekGen = solarWeek?.metrics.todayGeneration ?? null;
  const lifetime = solar?.metrics.totalGeneration ?? null;
  const device = solar?.device;
  const capacityKw = device?.capacity ? round(device.capacity / 1000, 1) : null;
  const utilisation =
    device?.capacity && currentPower > 0
      ? Math.round((currentPower / device.capacity) * 100)
      : null;

  const obs = weatherData?.observations?.[0];
  const m = obs?.metric ?? {};
  const feelsLike = m.heatIndex ?? m.windChill ?? m.temp;
  const wxLoading = weatherLoading && !weatherData;

  const statusBadge =
    device?.online != null ? (
      <View
        className={`flex-row items-center gap-1.5 rounded-pill px-2.5 py-1 ${device.online ? "bg-[rgba(52,211,153,0.13)]" : "bg-[rgba(251,113,133,0.13)]"}`}
      >
        <View
          className={`h-1.5 w-1.5 rounded-pill ${device.online ? "bg-positive" : "bg-negative"}`}
        />
        <Text
          className={`text-[11px] font-bold ${device.online ? "text-positive" : "text-negative"}`}
        >
          {device.online ? "Online" : "Offline"}
        </Text>
      </View>
    ) : null;

  const solarH = 122;
  const wxH = 168;

  return (
    <SafeAreaView className="flex-1 bg-bg-base" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-3 p-4">
        <PageHeader
          title="Home Production"
          subtitle={
            [device?.plantName, device?.model].filter(Boolean).join(" · ") ||
            "Solar & weather overview"
          }
          right={statusBadge}
        />

        <SectionLabel
          icon="sunny"
          text="Solar"
          right={
            capacityKw != null ? (
              <Text className="text-[11px] font-semibold text-text-muted">
                {capacityKw} kW system
              </Text>
            ) : null
          }
        />
        <View className="flex-row flex-wrap gap-3">
          <View style={{ width: tileW, height: solarH }}>
            <DualStat
              icon={ic("flash")}
              gradient="solar"
              label="Generation"
              aLabel="Today"
              aValue={show(todayGen, 1)}
              aUnit="kWh"
              bLabel="This week"
              bValue={show(weekGen, 1)}
              bUnit="kWh"
              loading={solarLoading}
            />
          </View>
          <View style={{ width: tileW, height: solarH }}>
            <DualStat
              icon={ic("trending-up")}
              gradient="energy"
              label="Power"
              aLabel="Current"
              aValue={show(currentPower)}
              aUnit="W"
              bLabel="Peak today"
              bValue={peak ? formatPeak(peak.value) : "—"}
              bUnit={peak ? peakUnit(peak.value, "W") : "W"}
              loading={solarLoading}
            />
          </View>
          <View style={{ width: tileW, height: solarH }}>
            <DualStat
              icon={ic("speedometer")}
              gradient="revenue"
              label="Utilisation"
              aLabel="Now"
              aValue={utilisation != null ? `${utilisation}` : "—"}
              aUnit="%"
              bLabel="System"
              bValue={capacityKw != null ? `${capacityKw}` : "—"}
              bUnit="kW"
              loading={solarLoading}
            />
          </View>
          <View style={{ width: tileW, height: solarH }}>
            <DualStat
              icon={ic("bar-chart")}
              gradient="solar"
              label="Lifetime"
              aLabel="Total"
              aValue={show(lifetime, 0)}
              aUnit="kWh"
              bLabel="Today"
              bValue={show(todayGen, 1)}
              bUnit="kWh"
              loading={solarLoading}
            />
          </View>
        </View>

        <SectionLabel
          icon="rainy"
          text="Weather"
          right={
            obs?.obsTimeLocal ? (
              <Text className="text-[11px] font-semibold text-text-muted">
                updated {obs.obsTimeLocal.split(" ")[1] ?? ""}
              </Text>
            ) : null
          }
        />
        <View className="flex-row flex-wrap gap-3">
          <View style={{ width: tileW, height: wxH }}>
            <WindDial degrees={obs?.winddir} speed={m.windSpeed} gust={m.windGust} unit="km/h" />
          </View>
          <View style={{ width: tileW, height: wxH }}>
            <DualStat
              icon={ic("thermometer")}
              gradient="solar"
              label="Temperature"
              aLabel="Now"
              aValue={show(m.temp)}
              aUnit="°C"
              bLabel="Week avg"
              bValue={show(wkAvg.temp)}
              bUnit="°C"
              loading={wxLoading}
            />
          </View>
          <View style={{ width: tileW, height: wxH }}>
            <DualStat
              icon={ic("water")}
              gradient="co2"
              label="Humidity"
              aLabel="Now"
              aValue={show(obs?.humidity)}
              aUnit="%"
              bLabel="Week avg"
              bValue={show(wkAvg.humidity)}
              bUnit="%"
              loading={wxLoading}
            />
          </View>
          <View style={{ width: tileW, height: wxH }}>
            <DualBaro now={m.pressure} avg={wkAvg.pressure} unit="hPa" />
          </View>
          <View style={{ width: tileW, height: wxH }}>
            <DualStat
              icon={ic("sunny")}
              gradient="solar"
              label="Solar radiation"
              aLabel="Now"
              aValue={show(obs?.solarRadiation)}
              aUnit="W/m²"
              bLabel="Week avg"
              bValue={show(wkAvg.solar)}
              bUnit="W/m²"
              loading={wxLoading}
            />
          </View>
          <View style={{ width: tileW, height: wxH }}>
            <DualStat
              icon={ic("sunny-outline")}
              gradient="revenue"
              label="UV index"
              aLabel="Now"
              aValue={show(obs?.uv)}
              bLabel="Week avg"
              bValue={show(wkAvg.uv)}
              loading={wxLoading}
            />
          </View>
          <View style={{ width: tileW, height: wxH }}>
            <DualStat
              icon={ic("rainy")}
              gradient="energy"
              label="Precipitation"
              aLabel="Rate"
              aValue={show(m.precipRate, 1)}
              aUnit="mm/h"
              bLabel="Today"
              bValue={show(m.precipTotal, 1)}
              bUnit="mm"
              loading={wxLoading}
            />
          </View>
          <View style={{ width: tileW, height: wxH }}>
            <DualStat
              icon={ic("thermometer-outline")}
              gradient="accent"
              label="Feels like"
              aLabel="Now"
              aValue={show(feelsLike)}
              aUnit="°C"
              bLabel="Wind chill"
              bValue={show(m.windChill)}
              bUnit="°C"
              loading={wxLoading}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

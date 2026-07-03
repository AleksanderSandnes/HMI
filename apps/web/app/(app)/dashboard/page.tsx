"use client";

import {
  dashboardDates,
  dashboardQueries,
  dashboardWeekAverages,
  formatPeak,
  lastPositive,
  peakUnit,
  show,
  solarDevice,
  solarMetrics,
  weatherNow,
} from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import {
  CloudRain,
  Droplets,
  Gauge,
  type LucideIcon,
  Mountain,
  Sun,
  SunMedium,
  Thermometer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "@/components/PageHeader";
import { DualBaro } from "@/components/ui/DualBaro";
import { DualStat } from "@/components/ui/DualStat";
import { WindDial } from "@/components/ui/WindDial";
import { useCore } from "@/lib/hooks/useCore";
import { useI18n } from "@/lib/i18n";

function SectionLabel({
  icon: Icon,
  text,
  right,
}: {
  icon: LucideIcon;
  text: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={15} className="size-[0.9375rem] text-solar-light" />
      <span className="text-[0.71875rem] font-bold uppercase tracking-[0.6px] text-text-secondary">
        {text}
      </span>
      <div className="h-px flex-1 bg-glass-border" />
      {right}
    </div>
  );
}

function StatusBadge({ online }: { online: boolean | null | undefined }) {
  const { t } = useI18n();
  if (online == null) return null;
  return (
    <span
      className={`flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-[0.6875rem] font-bold ${online ? "bg-[rgba(52,211,153,0.13)] text-positive" : "bg-[rgba(251,113,133,0.13)] text-negative"}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-positive" : "bg-negative"}`} />
      {online ? t("dashboard.inverterOnline") : t("dashboard.inverterOffline")}
    </span>
  );
}

function useDashboardData() {
  const { growatt, weather } = useCore();
  const { today, yesterday } = dashboardDates();
  const q = useMemo(
    () => dashboardQueries({ growatt, weather }, today, yesterday),
    [growatt, weather, today, yesterday],
  );

  const { data: solar, isLoading: solarLoading } = useQuery(q.solar);
  const { data: solarWeek } = useQuery(q.solarWeek);
  const { data: weatherData, isLoading: weatherLoading } = useQuery(q.weatherCurrent);
  const { data: weekObs } = useQuery(q.weatherWeek);

  const wkAvg = useMemo(() => dashboardWeekAverages(weekObs), [weekObs]);

  const currentPower = useMemo(
    () => lastPositive(solar?.chartData?.datasets?.[0]?.data ?? []),
    [solar],
  );

  return {
    solarLoading,
    wxLoading: weatherLoading && !weatherData,
    currentPower,
    wkAvg,
    ...solarMetrics(solar, solarWeek),
    ...solarDevice(solar, currentPower),
    ...weatherNow(weatherData),
  };
}

type DashboardModel = ReturnType<typeof useDashboardData>;

function SolarSection({ model }: { model: DashboardModel }) {
  const { t } = useI18n();
  const { todayGen, weekGen, lifetime, currentPower, peak, utilisation, capacityKw, solarLoading } =
    model;
  return (
    <>
      <SectionLabel
        icon={Sun}
        text={t("dashboard.solar")}
        right={
          capacityKw != null ? (
            <span className="text-[0.6875rem] font-semibold text-text-muted">
              {capacityKw} {t("dashboard.kwSystem")}
            </span>
          ) : null
        }
      />
      <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-4 lg:min-h-0 lg:flex-1">
        <DualStat
          icon={Zap}
          gradient="solar"
          label={t("dashboard.generation")}
          aLabel={t("dashboard.today")}
          aValue={show(todayGen, 1)}
          aUnit="kWh"
          bLabel={t("dashboard.thisWeek")}
          bValue={show(weekGen, 1)}
          bUnit="kWh"
          loading={solarLoading}
        />
        <DualStat
          icon={TrendingUp}
          gradient="energy"
          label={t("dashboard.power")}
          aLabel={t("dashboard.current")}
          aValue={show(currentPower)}
          aUnit="W"
          bLabel={t("dashboard.peakToday")}
          bValue={peak ? formatPeak(peak.value) : "—"}
          bUnit={peak ? peakUnit(peak.value, "W") : "W"}
          loading={solarLoading}
        />
        <DualStat
          icon={Gauge}
          gradient="revenue"
          label={t("dashboard.utilisation")}
          aLabel={t("dashboard.now")}
          aValue={utilisation != null ? `${utilisation}` : "—"}
          aUnit="%"
          bLabel={t("dashboard.system")}
          bValue={capacityKw != null ? `${capacityKw}` : "—"}
          bUnit="kW"
          loading={solarLoading}
        />
        <DualStat
          icon={Mountain}
          gradient="solar"
          label={t("dashboard.lifetime")}
          aLabel={t("dashboard.total")}
          aValue={show(lifetime, 0)}
          aUnit="kWh"
          bLabel={t("dashboard.today")}
          bValue={show(todayGen, 1)}
          bUnit="kWh"
          loading={solarLoading}
        />
      </div>
    </>
  );
}

function WeatherTilesA({ model }: { model: DashboardModel }) {
  const { t } = useI18n();
  const { obs, m, wkAvg, wxLoading } = model;
  return (
    <>
      <WindDial degrees={obs?.winddir} speed={m.windSpeed} gust={m.windGust} unit="km/h" />
      <DualStat
        icon={Thermometer}
        gradient="solar"
        label={t("dashboard.temperature")}
        aLabel={t("dashboard.now")}
        aValue={show(m.temp)}
        aUnit="°C"
        bLabel={t("dashboard.weekAverage")}
        bValue={show(wkAvg.temp)}
        bUnit="°C"
        loading={wxLoading}
      />
      <DualStat
        icon={Droplets}
        gradient="co2"
        label={t("dashboard.humidity")}
        aLabel={t("dashboard.now")}
        aValue={show(obs?.humidity)}
        aUnit="%"
        bLabel={t("dashboard.weekAverage")}
        bValue={show(wkAvg.humidity)}
        bUnit="%"
        loading={wxLoading}
      />
      <DualBaro now={m.pressure} avg={wkAvg.pressure} unit="hPa" loading={wxLoading} />
    </>
  );
}

function WeatherTilesB({ model }: { model: DashboardModel }) {
  const { t } = useI18n();
  const { obs, m, feelsLike, wkAvg, wxLoading } = model;
  return (
    <>
      <DualStat
        icon={SunMedium}
        gradient="solar"
        label={t("dashboard.solarRadiation")}
        aLabel={t("dashboard.now")}
        aValue={show(obs?.solarRadiation)}
        aUnit="W/m²"
        bLabel={t("dashboard.weekAverage")}
        bValue={show(wkAvg.solar)}
        bUnit="W/m²"
        loading={wxLoading}
      />
      <DualStat
        icon={Sun}
        gradient="revenue"
        label={t("dashboard.uvIndex")}
        aLabel={t("dashboard.now")}
        aValue={show(obs?.uv)}
        bLabel={t("dashboard.weekAverage")}
        bValue={show(wkAvg.uv)}
        loading={wxLoading}
      />
      <DualStat
        icon={CloudRain}
        gradient="energy"
        label={t("dashboard.precipitation")}
        aLabel={t("dashboard.rate")}
        aValue={show(m.precipRate, 1)}
        aUnit="mm/h"
        bLabel={t("dashboard.today")}
        bValue={show(m.precipTotal, 1)}
        bUnit="mm"
        loading={wxLoading}
      />
      <DualStat
        icon={Thermometer}
        gradient="accent"
        label={t("dashboard.feelsLike")}
        aLabel={t("dashboard.now")}
        aValue={show(feelsLike)}
        aUnit="°C"
        bLabel={t("dashboard.windChill")}
        bValue={show(m.windChill)}
        bUnit="°C"
        loading={wxLoading}
      />
    </>
  );
}

function WeatherSection({ model }: { model: DashboardModel }) {
  const { t } = useI18n();
  const { obs } = model;
  return (
    <>
      <SectionLabel
        icon={CloudRain}
        text={t("dashboard.weather")}
        right={
          obs?.obsTimeLocal ? (
            <span className="text-[0.6875rem] font-semibold text-text-muted">
              {t("dashboard.updated")} {obs.obsTimeLocal.split(" ")[1] ?? ""}
            </span>
          ) : null
        }
      />
      <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-4 lg:min-h-0 lg:flex-[2]">
        <WeatherTilesA model={model} />
        <WeatherTilesB model={model} />
      </div>
    </>
  );
}

export default function DashboardPage() {
  const model = useDashboardData();
  const { t } = useI18n();
  const { device } = model;

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-3 lg:h-full 3xl:max-w-[105rem]">
      <PageHeader
        title={t("dashboard.title")}
        subtitle={
          [device?.plantName, device?.model].filter(Boolean).join(" · ") || t("dashboard.subtitle")
        }
        right={<StatusBadge online={device?.online} />}
      />
      <SolarSection model={model} />
      <WeatherSection model={model} />
    </div>
  );
}

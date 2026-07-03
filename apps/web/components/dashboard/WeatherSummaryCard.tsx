"use client";

import { show } from "@hmi/core";
import {
  CloudRain,
  Droplets,
  Gauge,
  Sun,
  SunMedium,
  Thermometer,
  type LucideIcon,
} from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import { WindDialFace } from "@/components/ui/WindDial";
import type { DashboardModel } from "@/lib/hooks/useDashboardData";
import { useI18n } from "@/lib/i18n";

function BigMetric({
  icon: Icon,
  colorClass,
  label,
  value,
  unit,
}: {
  icon: LucideIcon;
  colorClass: string;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="flex items-center gap-1.5">
        <Icon size={14} className={`size-[0.875rem] ${colorClass}`} />
        <span className="text-[0.6875rem] font-bold text-text-secondary md:text-[0.8125rem]">
          {label}
        </span>
      </span>
      <p className="mt-1 text-[1.5rem] font-extrabold leading-none text-text-primary sm:mt-1.5 sm:text-[2.125rem] md:text-[2.5rem]">
        {value}
        <span className="text-[0.9375rem] font-bold text-text-muted"> {unit}</span>
      </p>
    </div>
  );
}

function StatCol({
  icon: Icon,
  colorClass,
  label,
  value,
  unit,
  sub,
}: {
  icon: LucideIcon;
  colorClass: string;
  label: string;
  value: string;
  unit?: string;
  sub: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <span className="flex items-center gap-1.5">
        <Icon size={13} className={`size-[0.8125rem] ${colorClass}`} />
        <span className="truncate text-[0.6875rem] font-bold text-text-secondary md:text-[0.8125rem]">
          {label}
        </span>
      </span>
      <p className="mt-1 text-[1.125rem] font-extrabold text-text-primary sm:mt-1.5 sm:text-[1.375rem] md:text-[1.75rem]">
        {value}
        {unit ? <span className="text-[0.625rem] font-bold text-text-muted">{unit}</span> : null}
      </p>
      <p className="mt-0.5 truncate text-[0.65625rem] font-bold uppercase tracking-[0.3px] text-text-muted md:text-[0.71875rem]">
        {sub}
      </p>
    </div>
  );
}

const COL_DIVIDER = <div className="mx-2 w-px bg-glass-border sm:mx-3" />;

/** UV / humidity / pressure row (all sizes). */
function PrimaryStats({ model }: { model: DashboardModel }) {
  const { t } = useI18n();
  const { obs, m, wkAvg } = model;
  return (
    <div className="flex items-stretch">
      <StatCol
        icon={Sun}
        colorClass="text-solar-light"
        label={t("dashboard.uvIndex")}
        value={show(obs?.uv)}
        sub={t("dashboard.avg", { value: show(wkAvg.uv) })}
      />
      {COL_DIVIDER}
      <StatCol
        icon={Droplets}
        colorClass="text-energy-light"
        label={t("dashboard.humidity")}
        value={show(obs?.humidity)}
        unit="%"
        sub={t("dashboard.avg", { value: `${show(wkAvg.humidity)}%` })}
      />
      {COL_DIVIDER}
      <StatCol
        icon={Gauge}
        colorClass="text-[#22d3ee]"
        label={t("dashboard.pressure")}
        value={show(m.pressure)}
        unit="hPa"
        sub={t("dashboard.avg", { value: show(wkAvg.pressure) })}
      />
    </div>
  );
}

/** Extra radiation / feels-like / rain row — tablets (md..lg) have the room. */
function ExtendedStats({ model }: { model: DashboardModel }) {
  const { t } = useI18n();
  const { obs, m, feelsLike, wkAvg } = model;
  return (
    <div className="hidden items-stretch md:flex">
      <StatCol
        icon={SunMedium}
        colorClass="text-[#fbbf24]"
        label={t("dashboard.solarRadiation")}
        value={show(obs?.solarRadiation)}
        unit="W/m²"
        sub={t("dashboard.avg", { value: show(wkAvg.solar) })}
      />
      {COL_DIVIDER}
      <StatCol
        icon={Thermometer}
        colorClass="text-accent-light"
        label={t("dashboard.feelsLike")}
        value={show(feelsLike)}
        unit="°C"
        sub={`${t("dashboard.windChill")} ${show(m.windChill)}°`}
      />
      {COL_DIVIDER}
      <StatCol
        icon={CloudRain}
        colorClass="text-[#38bdf8]"
        label={t("dashboard.precipitation")}
        value={show(m.precipTotal, 1)}
        unit="mm"
        sub={`${t("dashboard.rate")} ${show(m.precipRate, 1)} mm/h`}
      />
    </div>
  );
}

/** Hero dashboard weather panel (mirror of mobile WeatherSummaryCard). */
export function WeatherSummaryCard({ model }: { model: DashboardModel }) {
  const { t } = useI18n();
  const { obs, m } = model;
  return (
    <GlassCard
      strong
      className="flex min-h-0 flex-1 flex-col justify-between gap-3 px-3.5 pb-4 pt-3 sm:pb-6 sm:pt-3.5 md:gap-5 md:px-6 md:pb-7 md:pt-5"
    >
      <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
        {/* Dial scales with the form factor: compact on small phones, roomy on tablets. */}
        <WindDialFace
          degrees={obs?.winddir}
          speed={m.windSpeed}
          gust={m.windGust}
          unit="km/h"
          sizeClassName="h-[6.25rem] w-[6.25rem] sm:h-[9.375rem] sm:w-[9.375rem] md:h-[11.25rem] md:w-[11.25rem]"
        />
        <div className="mx-0.5 w-px self-stretch bg-glass-border sm:mx-1" />
        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 sm:gap-5 md:gap-7">
          <BigMetric
            icon={Thermometer}
            colorClass="text-negative"
            label={t("dashboard.temperature")}
            value={show(m.temp)}
            unit="°C"
          />
          <BigMetric
            icon={CloudRain}
            colorClass="text-[#38bdf8]"
            label={t("dashboard.precipitation")}
            value={show(m.precipRate, 1)}
            unit="mm/h"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:gap-5">
        <PrimaryStats model={model} />
        <ExtendedStats model={model} />
      </div>
    </GlassCard>
  );
}

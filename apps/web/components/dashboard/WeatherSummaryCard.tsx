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
  sub,
}: {
  icon: LucideIcon;
  colorClass: string;
  label: string;
  value: string;
  unit: string;
  /** Secondary line (e.g. weekly average) — tablets only. */
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="flex items-center gap-1.5">
        <Icon size={14} className={`size-[0.875rem] ${colorClass}`} />
        <span className="text-[0.6875rem] font-bold text-text-secondary md:portrait:text-[0.8125rem]">
          {label}
        </span>
      </span>
      {/* Value scales with the viewport height so tall phones don't look empty. */}
      <p className="mt-1 text-[clamp(1.5rem,3.6vh,2.125rem)] font-extrabold leading-none text-text-primary sm:mt-1.5 md:portrait:text-[2.5rem]">
        {value}
        <span className="text-[0.9375rem] font-bold text-text-muted"> {unit}</span>
      </p>
      {sub ? (
        <p className="mt-1 hidden text-[0.71875rem] font-bold uppercase tracking-[0.3px] text-text-muted md:portrait:block">
          {sub}
        </p>
      ) : null}
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
        <span className="truncate text-[0.6875rem] font-bold text-text-secondary md:portrait:text-[0.8125rem]">
          {label}
        </span>
      </span>
      <p className="mt-1 text-[clamp(1.125rem,2.6vh,1.375rem)] font-extrabold text-text-primary sm:mt-1.5 md:portrait:text-[1.75rem]">
        {value}
        {unit ? <span className="text-[0.625rem] font-bold text-text-muted">{unit}</span> : null}
      </p>
      <p className="mt-0.5 truncate text-[0.65625rem] font-bold uppercase tracking-[0.3px] text-text-muted md:portrait:text-[0.71875rem]">
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

/**
 * The metric block beside the dial. Phones: temperature + precipitation
 * stacked. Tablets (md..lg): a 2×2 grid — temp, precip, radiation and
 * feels-like with roomy weekly-average sublines — so the card has no dead
 * white space.
 */
function DialSideMetrics({ model }: { model: DashboardModel }) {
  const { t } = useI18n();
  const { obs, m, feelsLike, wkAvg } = model;
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-3 sm:gap-5 md:portrait:grid md:portrait:grid-cols-2 md:portrait:content-center md:portrait:items-start md:portrait:gap-x-2 md:portrait:gap-y-8">
      <BigMetric
        icon={Thermometer}
        colorClass="text-negative"
        label={t("dashboard.temperature")}
        value={show(m.temp)}
        unit="°C"
        sub={t("dashboard.avg", { value: `${show(wkAvg.temp)}°C` })}
      />
      <BigMetric
        icon={CloudRain}
        colorClass="text-[#38bdf8]"
        label={t("dashboard.precipitation")}
        value={show(m.precipRate, 1)}
        unit="mm/h"
        sub={`${t("dashboard.today")} ${show(m.precipTotal, 1)} mm`}
      />
      <div className="hidden md:portrait:block">
        <BigMetric
          icon={SunMedium}
          colorClass="text-[#fbbf24]"
          label={t("dashboard.solarRadiation")}
          value={show(obs?.solarRadiation)}
          unit="W/m²"
          sub={t("dashboard.avg", { value: `${show(wkAvg.solar)} W/m²` })}
        />
      </div>
      <div className="hidden md:portrait:block">
        <BigMetric
          icon={Thermometer}
          colorClass="text-accent-light"
          label={t("dashboard.feelsLike")}
          value={show(feelsLike)}
          unit="°C"
          sub={`${t("dashboard.windChill")} ${show(m.windChill)}°C`}
        />
      </div>
    </div>
  );
}

/** Hero dashboard weather panel (mirror of mobile WeatherSummaryCard). */
export function WeatherSummaryCard({ model }: { model: DashboardModel }) {
  const { obs, m } = model;
  return (
    <GlassCard
      strong
      className="flex min-h-0 flex-1 flex-col gap-3 px-3.5 pb-4 pt-4 sm:pb-6 sm:pt-4 md:portrait:gap-5 md:portrait:px-6 md:portrait:pb-7 md:portrait:pt-5"
    >
      {/* flex-1 + centred: extra card height pads evenly around the dial row
          instead of leaving one band of white space above the stat rows. */}
      <div className="flex min-h-0 flex-1 items-center gap-2 sm:gap-3 md:portrait:gap-0">
        {/* At md the dial column is exactly 1/3 wide so this divider lines up
            with the first divider of the stat row below. */}
        <div className="flex justify-center md:portrait:w-1/3 md:portrait:flex-none">
          <WindDialFace
            degrees={obs?.winddir}
            speed={m.windSpeed}
            gust={m.windGust}
            unit="km/h"
            sizeClassName="h-[clamp(5.5rem,15vh,9.375rem)] w-[clamp(5.5rem,15vh,9.375rem)] md:portrait:h-[11.25rem] md:portrait:w-[11.25rem]"
          />
        </div>
        <div className="mx-0.5 w-px self-stretch bg-glass-border sm:mx-1 md:portrait:mx-0" />
        <DialSideMetrics model={model} />
      </div>

      <PrimaryStats model={model} />
    </GlassCard>
  );
}

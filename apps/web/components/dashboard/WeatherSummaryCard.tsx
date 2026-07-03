"use client";

import { show } from "@hmi/core";
import { CloudRain, Droplets, Gauge, Sun, Thermometer, type LucideIcon } from "lucide-react";

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
        <span className="text-[0.6875rem] font-bold text-text-secondary">{label}</span>
      </span>
      <p className="mt-1 text-[1.75rem] font-extrabold leading-none text-text-primary sm:mt-1.5 sm:text-[2.125rem]">
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
        <span className="text-[0.6875rem] font-bold text-text-secondary">{label}</span>
      </span>
      <p className="mt-1 text-[1.125rem] font-extrabold text-text-primary sm:mt-1.5 sm:text-[1.375rem]">
        {value}
        {unit ? <span className="text-[0.625rem] font-bold text-text-muted">{unit}</span> : null}
      </p>
      <p className="mt-0.5 text-[0.65625rem] font-bold uppercase tracking-[0.3px] text-text-muted">
        {sub}
      </p>
    </div>
  );
}

/** Hero dashboard weather panel (mirror of mobile WeatherSummaryCard). */
export function WeatherSummaryCard({ model }: { model: DashboardModel }) {
  const { t } = useI18n();
  const { obs, m, wkAvg } = model;
  return (
    <GlassCard
      strong
      className="flex min-h-0 flex-1 flex-col justify-between gap-3 px-3.5 pb-4 pt-3 sm:pb-6 sm:pt-3.5"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Smaller dial below sm so the row fits a 375px iPhone SE. */}
        <WindDialFace
          degrees={obs?.winddir}
          speed={m.windSpeed}
          gust={m.windGust}
          unit="km/h"
          sizeClassName="h-[7.25rem] w-[7.25rem] sm:h-[9.375rem] sm:w-[9.375rem]"
        />
        <div className="mx-0.5 w-px self-stretch bg-glass-border sm:mx-1" />
        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 sm:gap-5">
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

      <div className="flex items-stretch">
        <StatCol
          icon={Sun}
          colorClass="text-solar-light"
          label={t("dashboard.uvIndex")}
          value={show(obs?.uv)}
          sub={t("dashboard.avg", { value: show(wkAvg.uv) })}
        />
        <div className="mx-3 w-px bg-glass-border" />
        <StatCol
          icon={Droplets}
          colorClass="text-energy-light"
          label={t("dashboard.humidity")}
          value={show(obs?.humidity)}
          unit="%"
          sub={t("dashboard.avg", { value: `${show(wkAvg.humidity)}%` })}
        />
        <div className="mx-3 w-px bg-glass-border" />
        <StatCol
          icon={Gauge}
          colorClass="text-[#22d3ee]"
          label={t("dashboard.pressure")}
          value={show(m.pressure)}
          unit="hPa"
          sub={t("dashboard.avg", { value: show(wkAvg.pressure) })}
        />
      </div>
    </GlassCard>
  );
}

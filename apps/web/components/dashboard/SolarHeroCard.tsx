"use client";

import { formatPeak, kwLabel, peakUnit, show } from "@hmi/core";
import { TrendingUp } from "lucide-react";

import { Sparkline } from "@/components/dashboard/Sparkline";
import { GlassCard } from "@/components/ui/GlassCard";
import type { DashboardModel } from "@/lib/hooks/useDashboardData";
import { useI18n } from "@/lib/i18n";

function ProducingPill({ producing }: { producing: boolean }) {
  const { t } = useI18n();
  return (
    <span className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${producing ? "bg-positive" : "bg-text-muted"}`} />
      <span className="text-[0.6875rem] font-bold uppercase tracking-[0.3px] text-text-secondary">
        {producing ? t("dashboard.producingNow") : t("dashboard.idle")}
      </span>
    </span>
  );
}

/** Hero card (mirror of mobile SolarHeroCard): the one big "what am I making now" answer + curve. */
export function SolarHeroCard({ model }: { model: DashboardModel }) {
  const { t } = useI18n();
  const { currentPower, peak, utilisation, capacityKw, todayGen, sparkline } = model;
  const producing = (currentPower ?? 0) > 0;

  const subline = [
    utilisation != null && capacityKw != null
      ? t("dashboard.capacityLine", { utilisation, capacityKw })
      : null,
    todayGen != null ? t("dashboard.soFarToday", { kwh: show(todayGen, 1) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <GlassCard strong className="flex min-h-0 flex-1 flex-col justify-between p-[1.125rem]">
      <div>
        <div className="flex items-center justify-between">
          <ProducingPill producing={producing} />
          {peak ? (
            <span className="flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[rgba(245,158,11,0.14)] px-2.5 py-1">
              <TrendingUp size={13} className="size-[0.8125rem] text-solar-light" />
              <span className="text-[0.6875rem] font-extrabold text-solar-light">
                {t("dashboard.peakBadge", {
                  value: formatPeak(peak.value),
                  unit: peakUnit(peak.value, "W"),
                })}
              </span>
            </span>
          ) : null}
        </div>

        <div className="mt-2.5 flex items-end gap-1.5">
          <span className="text-[3.5rem] font-black leading-[0.9] tracking-[-2px] text-solar-light">
            {kwLabel(currentPower)}
          </span>
          <span className="mb-2 text-[1.25rem] font-extrabold text-text-secondary">kW</span>
        </div>
        {subline ? (
          <p className="mt-1.5 text-[0.78125rem] font-medium text-text-muted">{subline}</p>
        ) : null}
      </div>

      <div className="mt-3 min-h-0 flex-1">
        <Sparkline values={sparkline} />
      </div>
    </GlassCard>
  );
}

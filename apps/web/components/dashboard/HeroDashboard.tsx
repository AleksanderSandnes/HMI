"use client";

import { type UserProfile } from "@hmi/core";
import { useQuery } from "@tanstack/react-query";
import { CloudRain, Sun } from "lucide-react";
import { useState } from "react";

import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import { NotificationsOverlay } from "@/components/dashboard/NotificationsOverlay";
import { SectionLabel } from "@/components/dashboard/SectionLabel";
import { SolarHeroCard } from "@/components/dashboard/SolarHeroCard";
import { WeatherSummaryCard } from "@/components/dashboard/WeatherSummaryCard";
import { useCore } from "@/lib/hooks/useCore";
import type { DashboardModel } from "@/lib/hooks/useDashboardData";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useI18n } from "@/lib/i18n";

function MutedRight({ text }: { text: string | null }) {
  if (!text) return null;
  return <span className="text-[0.6875rem] font-semibold text-text-muted">{text}</span>;
}

/** Solar/weather sections, stacked like the phone app on every size below lg. */
function HeroSections({ model }: { model: DashboardModel }) {
  const { t } = useI18n();
  const { device, capacityKw, obs } = model;
  const solarRight = [device?.model, capacityKw != null ? `${capacityKw} kW` : null]
    .filter(Boolean)
    .join(" · ");
  const updated = obs?.obsTimeLocal
    ? `${t("dashboard.updated")} ${obs.obsTimeLocal.split(" ")[1] ?? ""}`
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div data-testid="hero-solar-col" className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <SectionLabel
          icon={Sun}
          text={t("dashboard.solar")}
          right={<MutedRight text={solarRight || null} />}
        />
        <SolarHeroCard model={model} />
      </div>
      {/* Natural height on small phones so the AVG sublabels never clip; the
          solar hero above absorbs the remaining space. Equal split from sm. */}
      <div
        data-testid="hero-weather-col"
        className="flex min-w-0 flex-col gap-3 sm:min-h-0 sm:flex-1"
      >
        <SectionLabel
          icon={CloudRain}
          text={t("dashboard.weather")}
          right={<MutedRight text={updated} />}
        />
        <WeatherSummaryCard model={model} />
      </div>
    </div>
  );
}

/**
 * Phone/tablet dashboard (below lg) — mirror of the mobile app's Focus
 * dashboard: topbar with bell + avatar, solar hero card, weather summary.
 * Tablet renders the two sections side by side like the app's wide layout.
 */
export function HeroDashboard({ model }: { model: DashboardModel }) {
  const { account } = useCore();
  const { items, count, clearAll, dismiss } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: () => account.getUserProfile(),
  });

  return (
    <div className="flex h-full min-h-[34rem] flex-col gap-3 lg:hidden">
      <DashboardTopbar
        username={profile?.username}
        avatarUrl={profile?.avatarUrl}
        notifCount={count}
        online={model.device?.online}
        onBellClick={() => setNotifOpen(true)}
      />

      <HeroSections model={model} />

      <NotificationsOverlay
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        items={items}
        onClear={() => void clearAll()}
        onDismiss={(id) => void dismiss(id)}
      />
    </div>
  );
}

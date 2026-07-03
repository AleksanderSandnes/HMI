"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, CloudSun, LayoutDashboard, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCore } from "@/lib/hooks/useCore";
import { useI18n } from "@/lib/i18n";
import { useNavStats } from "@/lib/nav-stats";
import { cn } from "@/lib/utils";

/** Temp · location chip, plus the Solar page's generation/peak when present. */
function NavWeatherWidget() {
  const { weather } = useCore();
  const { t } = useI18n();
  const { solarStats } = useNavStats();
  const { data } = useQuery({
    queryKey: ["weather-current"],
    queryFn: () => weather.getCurrentWeatherData(),
    staleTime: 60_000,
  });
  const obs = data?.observations?.[0];
  const temp = obs?.metric?.temp;
  const place = obs?.neighborhood;

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5">
        <Sun size={13} className="size-[0.8125rem] text-solar-light" />
        <span className="whitespace-nowrap text-[0.8125rem] font-bold text-text-secondary">
          {temp != null ? `${Math.round(temp)}° · ${place || "Sandnes"}` : "—"}
        </span>
      </span>
      {solarStats ? (
        <span className="flex items-center gap-3">
          <span className="h-5 w-px bg-glass-border" />
          <NavStat label={t("nav.gen")} value={solarStats.generation} unit={solarStats.genUnit} />
          <span className="h-5 w-px bg-glass-border" />
          <NavStat label={t("nav.peak")} value={solarStats.peak} unit={solarStats.peakUnit} />
        </span>
      ) : null}
    </div>
  );
}

function NavStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <span className="flex items-baseline gap-1 whitespace-nowrap">
      <span className="text-[0.625rem] font-bold uppercase tracking-[0.3px] text-text-muted">
        {label}
      </span>
      <span className="text-[0.8125rem] font-extrabold text-text-primary">
        {value}
        <span className="ml-0.5 text-[0.5625rem] font-bold text-text-muted">{unit}</span>
      </span>
    </span>
  );
}

// Full desktop nav (lg+ top bar). Below lg, notifications live behind the
// dashboard bell (mirroring the mobile app), so tabs/rail use NAV_TABS.
const NAV = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/solar", labelKey: "nav.solar", icon: Sun },
  { href: "/weather", labelKey: "nav.weather", icon: CloudSun },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

const NAV_TABS = NAV.filter(({ href }) => href !== "/notifications");

/** Vertical glass rail for tablet widths (mirror of mobile GlassNavRail). */
function NavRail({ pathname }: { pathname: string }) {
  const { t } = useI18n();
  return (
    <nav
      data-testid="nav-rail"
      className="hidden shrink-0 flex-col justify-center py-2.5 pl-2 pr-1 md:flex lg:hidden"
    >
      <div className="flex flex-col items-stretch gap-1 rounded-[24px] border border-glass-border bg-glass-fill px-1.5 py-2">
        {NAV_TABS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex w-16 flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[0.625rem] font-bold transition",
                active
                  ? "border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.15)] text-solar-light"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              <Icon size={20} className="size-[1.25rem]" />
              {t(labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Responsive app navigation: bottom tab bar on phones, left rail on tablets,
 * horizontal top bar on desktop (parity with the RN tab bar / GlassNavRail).
 */
export function AppNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <>
      {/* Desktop top bar (lg+). Inner content is constrained to the same
          max-width + padding as the page content so the brand aligns with the
          page title (left) and the nav links align with the content's right
          edge. Sign out lives at the bottom of the Settings list, not here. */}
      <header className="sticky top-0 z-30 hidden border-b border-glass-border bg-[var(--color-panel-bg)] px-8 backdrop-blur-xl lg:block">
        <div className="mx-auto flex w-full max-w-[92.5rem] items-center justify-between py-2.5 3xl:max-w-[100rem]">
          <div className="flex items-center gap-3.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5"
              aria-label={t("a11y.hmiHome")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.png"
                alt=""
                className="h-8 w-8 rounded-[8px] shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
              />
              <span className="text-lg font-extrabold tracking-tight text-text-primary">HMI</span>
            </Link>
            <NavWeatherWidget />
          </div>

          <nav className="flex items-center gap-1">
            {NAV.map(({ href, labelKey, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={t(labelKey)}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-md)] px-3.5 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-solar-soft text-solar-light"
                      : "text-text-secondary hover:bg-glass-fill hover:text-text-primary",
                  )}
                >
                  <Icon size={17} className="size-[1.0625rem]" />
                  {t(labelKey)}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Tablet left rail (md..lg) */}
      <NavRail pathname={pathname} />

      {/* Mobile bottom tab bar — 4 tabs like the app (bell replaces Notifications) */}
      <nav className="glass fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-glass-border px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
        {NAV_TABS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[var(--radius-md)] px-2 py-1.5 text-[0.625rem] font-semibold transition",
                active ? "text-solar-light" : "text-text-muted",
              )}
            >
              <Icon size={20} className="size-[1.25rem]" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

"use client";

import { HeroDashboard } from "@/components/dashboard/HeroDashboard";
import { TileDashboard } from "@/components/dashboard/TileDashboard";
import { useDashboardData } from "@/lib/hooks/useDashboardData";

/**
 * Dashboard: below lg it mirrors the mobile app (hero + weather summary),
 * at lg+ it keeps the desktop stat-tile grids. Both trees render (CSS decides
 * visibility) and share one data model — react-query dedupes the fetches.
 * HeroDashboard must stay first: tests wait on the first visible h1.
 */
export default function DashboardPage() {
  const model = useDashboardData();
  return (
    <>
      <HeroDashboard model={model} />
      <TileDashboard model={model} />
    </>
  );
}

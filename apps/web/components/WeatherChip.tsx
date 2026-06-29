"use client";

import { useQuery } from "@tanstack/react-query";
import { Sun } from "lucide-react";
import { useCore } from "@/lib/hooks/useCore";
import { GlassCard } from "@/components/ui/GlassCard";

/** Current-conditions pill (temp · place) shown in dashboard headers. */
export function WeatherChip() {
  const { weather } = useCore();
  const { data } = useQuery({
    queryKey: ["weather-current"],
    queryFn: () => weather.getCurrentWeatherData(),
    staleTime: 60_000,
  });

  const obs = data?.observations?.[0];
  const temp = obs?.metric?.temp;
  const place = obs?.neighborhood;

  return (
    <GlassCard className="flex items-center gap-2 rounded-[var(--radius-pill)] px-3.5 py-2">
      <Sun size={13} className="text-solar-light" />
      <span className="text-[13px] font-bold text-text-secondary">
        {temp != null ? `${Math.round(temp)}° · ${place || "Sandnes"}` : "Loading…"}
      </span>
    </GlassCard>
  );
}

export default WeatherChip;

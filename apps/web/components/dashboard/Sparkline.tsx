"use client";

import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";

/**
 * Hero-card power curve (web port of mobile dashboard/Sparkline): a smooth
 * monotone area with a green→transparent fill and a green→indigo stroke.
 * Fills whatever box it's given.
 */
export function Sparkline({ values }: { values: number[] }) {
  const id = useId();
  // Two points minimum so the line renders even before data arrives.
  const series = values.length >= 2 ? values : [0, 0];
  const rows = series.map((v, i) => ({ i, v }));
  const max = Math.max(...series, 1);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={rows} margin={{ top: 8, right: 1, bottom: 1, left: 1 }}>
        <defs>
          <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
            <stop offset="60%" stopColor="#10b981" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${id}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <YAxis hide domain={[0, max * 1.1]} />
        <Area
          type="monotone"
          dataKey="v"
          stroke={`url(#${id}-line)`}
          strokeWidth={4}
          fill={`url(#${id}-area)`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

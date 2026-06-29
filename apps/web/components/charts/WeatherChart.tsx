"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";
import { formatMetric as fmt } from "@hmi/core";
import { AXIS_TICK, CURSOR, GRID_STROKE } from "./chartTheme";

export interface LineSeries {
  data: number[];
  color: string;
  label: string;
}

interface WeatherChartProps {
  labels: string[];
  series: LineSeries[];
  unit?: string;
  loading?: boolean;
  height?: number;
  emptyText?: string;
  /** Explicit x-axis tick values (e.g. one per day for the weekly view). */
  ticks?: string[];
  /**
   * Tailwind height class (e.g. "h-[clamp(240px,46vh,520px)]") for a chart that
   * scales with the viewport. Overrides the numeric `height` when set.
   */
  heightClass?: string;
}

/**
 * Multi-series weather chart (Recharts port of the mobile weather line chart).
 * Smooth (monotone) areas + lines, shared crosshair tooltip listing every series.
 */
export function WeatherChart({
  labels,
  series,
  unit = "",
  loading = false,
  height = 340,
  emptyText = "No data for this period",
  ticks,
  heightClass,
}: WeatherChartProps) {
  const clean = (series || []).filter((s) => s.data && s.data.length > 0);
  const n = clean[0]?.data.length ?? 0;
  const all = clean.flatMap((s) => s.data);

  const sizer = (node: React.ReactNode) =>
    heightClass ? (
      <div className={heightClass}>{node}</div>
    ) : (
      <div style={{ height }}>{node}</div>
    );

  if (loading) {
    return sizer(
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 size={32} className="animate-spin text-solar-light" />
      </div>
    );
  }

  if (!n || all.length === 0) {
    return sizer(
      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-text-muted">
        {emptyText}
      </div>
    );
  }

  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  let yMin = rawMin;
  let yMax = rawMax;
  if (yMin === yMax) {
    yMax = yMin + 1;
    yMin = yMin - 1;
  }
  const span = yMax - yMin;
  const padTop = span * 0.14;
  yMax += padTop;
  yMin = rawMin >= 0 ? 0 : yMin - padTop;
  const range = yMax - yMin || 1;

  const rows = labels.map((label, i) => {
    const row: Record<string, number | string> = { label };
    clean.forEach((s, si) => {
      row[`s${si}`] = s.data[i] ?? 0;
    });
    return row;
  });

  const chart = (
    <ResponsiveContainer width="100%" height={heightClass ? "100%" : height}>
      <AreaChart data={rows} margin={{ top: 22, right: 18, bottom: 6, left: 0 }}>
        <defs>
          {clean.map((s, si) => (
            <linearGradient key={si} id={`wx-${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.32} />
              <stop offset="70%" stopColor={s.color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          {...(ticks && ticks.length
            ? // Weekly: render exactly the day-boundary labels, one per day,
              // so none get thinned out by width-based tick selection.
              { ticks, interval: 0 }
            : // Hourly: let recharts thin ticks to fit the available width.
              { interval: "preserveStartEnd" as const, minTickGap: 32 })}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={54}
          tickCount={5}
          domain={[yMin, yMax]}
          tickFormatter={(v: number) => fmt(v, range)}
        />
        <Tooltip
          cursor={CURSOR}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="min-w-[120px] rounded-xl border border-glass-border-strong bg-[rgba(10,17,36,0.94)] px-3 py-2.5">
                <p className="mb-1.5 text-[11px] font-bold text-text-muted">
                  {label}
                </p>
                {payload.map((p, i) => (
                  <div key={i} className="mt-0.5 flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: clean[Number(p.dataKey?.toString().slice(1))]?.color }}
                    />
                    <span className="flex-1 text-[11.5px] font-semibold text-text-secondary">
                      {clean[Number(p.dataKey?.toString().slice(1))]?.label}
                    </span>
                    <span className="text-[12.5px] font-extrabold text-text-primary">
                      {fmt(Number(p.value), range)}
                      {unit ? ` ${unit}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        {/* Render last series first so the primary series sits on top. */}
        {clean
          .map((s, si) => ({ s, si }))
          .reverse()
          .map(({ s, si }) => (
            <Area
              key={si}
              type="monotone"
              dataKey={`s${si}`}
              stroke={s.color}
              strokeWidth={2.6}
              fill={`url(#wx-${si})`}
              dot={n <= 32 ? { r: 2.6, fill: s.color, stroke: "#0a1124", strokeWidth: 1.4 } : false}
              activeDot={{ r: 5, fill: s.color, stroke: "#0a1124", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
      </AreaChart>
    </ResponsiveContainer>
  );

  return heightClass ? <div className={heightClass}>{chart}</div> : chart;
}

export default WeatherChart;

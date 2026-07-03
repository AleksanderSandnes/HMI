"use client";

import {
  BREAKPOINTS,
  formatMetric as fmt,
  WEEKDAY_ABBR,
  weekdayName,
  type Locale,
} from "@hmi/core";
import { Loader2 } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Frame } from "./chartFrame";
import { axisTick, CURSOR, GRID_STROKE } from "./chartTheme";

import { weatherYDomain } from "@/lib/chart";
import { useRemScale } from "@/lib/hooks/useRemScale";
import { useViewportWidth } from "@/lib/hooks/useViewportWidth";
import { useI18n } from "@/lib/i18n";

export interface LineSeries {
  data: number[];
  color: string;
  label: string;
}

/** Daily min/max/avg triplets for the phone weekly "daily range" view. */
export interface WeatherBand {
  min: number[];
  max: number[];
  avg: number[];
}

/** Expand a weekday abbreviation (weekly view) to its localized full name. */
function expandLabel(label: string, locale: Locale): string {
  const idx = (WEEKDAY_ABBR as readonly string[]).indexOf(label);
  return idx >= 0 ? weekdayName(locale, idx) : label;
}

// Recharts discovers graphical items / Tooltip / defs by inspecting its direct children's
// component type, recursing into arrays but NOT into Fragments or custom components. So these
// are builder functions returning real recharts elements (or arrays), not wrapper components —
// otherwise the series never render and hover does nothing.
function buildDefs(clean: LineSeries[]) {
  return (
    <defs>
      {clean.map((s, si) => (
        <linearGradient key={si} id={`wx-${si}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={s.color} stopOpacity={0.32} />
          <stop offset="70%" stopColor={s.color} stopOpacity={0.08} />
          <stop offset="100%" stopColor={s.color} stopOpacity={0} />
        </linearGradient>
      ))}
    </defs>
  );
}

function buildTooltip(clean: LineSeries[], range: number, unit: string) {
  return (
    <Tooltip
      cursor={CURSOR}
      content={({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
          <div className="min-w-[7.5rem] rounded-xl border border-glass-border-strong bg-[var(--color-panel-bg)] px-3 py-2.5">
            <p className="mb-1.5 text-[0.6875rem] font-bold text-text-muted">{label}</p>
            {payload.map((p, i) => {
              const s = clean[Number(p.dataKey?.toString().slice(1))];
              return (
                <div key={i} className="mt-0.5 flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: s?.color }}
                  />
                  <span className="flex-1 text-[0.71875rem] font-semibold text-text-secondary">
                    {s?.label}
                  </span>
                  <span className="text-[0.78125rem] font-extrabold text-text-primary">
                    {fmt(Number(p.value), range)}
                    {unit ? ` ${unit}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        );
      }}
    />
  );
}

function buildAreas(clean: LineSeries[], n: number) {
  // Render last series first so the primary series sits on top. Returns an array (not a
  // Fragment) so Recharts' findAllByType recurses into it and discovers the Areas.
  return clean
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
    ));
}

export function readClean(series: LineSeries[]) {
  const clean = (series || []).filter((s) => s.data && s.data.length > 0);
  return { clean, n: clean[0]?.data.length ?? 0, all: clean.flatMap((s) => s.data) };
}

export function xTickProps(ticks?: string[]) {
  return ticks && ticks.length
    ? { ticks, interval: 0 as const }
    : { interval: "preserveStartEnd" as const, minTickGap: 32 };
}

export function buildRows(
  labels: string[],
  clean: LineSeries[],
): Record<string, number | string>[] {
  return labels.map((label, i) => {
    const row: Record<string, number | string> = { label };
    clean.forEach((s, si) => {
      row[`s${si}`] = s.data[i] ?? 0;
    });
    return row;
  });
}

interface BandRow {
  label: string;
  range: [number, number];
  avg: number;
}

function buildBandRows(labels: string[], band: WeatherBand): BandRow[] {
  return labels.map((label, i) => ({
    label,
    range: [band.min[i] ?? 0, band.max[i] ?? 0],
    avg: band.avg[i] ?? 0,
  }));
}

function buildBandTooltip(bandColor: string, range: number, unit: string, locale: Locale) {
  const rows = (r: BandRow) => [
    { color: "#fb7185", label: "High", value: r.range[1] },
    { color: bandColor, label: "Avg", value: r.avg },
    { color: "#60a5fa", label: "Low", value: r.range[0] },
  ];
  return (
    <Tooltip
      cursor={CURSOR}
      content={({ active, payload, label }) => {
        const row = payload?.[0]?.payload as BandRow | undefined;
        if (!active || !row) return null;
        return (
          <div className="min-w-[7.5rem] rounded-xl border border-glass-border-strong bg-[var(--color-panel-bg)] px-3 py-2.5">
            <p className="mb-1.5 text-[0.6875rem] font-bold text-text-muted">
              {expandLabel(String(label ?? ""), locale)}
            </p>
            {rows(row).map((r) => (
              <div key={r.label} className="mt-0.5 flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: r.color }}
                />
                <span className="flex-1 text-[0.71875rem] font-semibold text-text-secondary">
                  {r.label}
                </span>
                <span className="text-[0.78125rem] font-extrabold text-text-primary">
                  {fmt(r.value, range)}
                  {unit ? ` ${unit}` : ""}
                </span>
              </div>
            ))}
          </div>
        );
      }}
    />
  );
}

function BandChart({
  labels,
  band,
  bandColor,
  unit,
  height,
  heightClass,
}: {
  labels: string[];
  band: WeatherBand;
  bandColor: string;
  unit: string;
  height: number;
  heightClass?: string;
}) {
  const { locale } = useI18n();
  const scale = useRemScale();
  const { yAxisWidth, margin } = useChartGeometry(scale);
  const { min: yMin, max: yMax, range } = weatherYDomain([...band.min, ...band.max]);
  return (
    <Frame heightClass={heightClass} height={height}>
      <ResponsiveContainer width="100%" height={heightClass ? "100%" : height}>
        <AreaChart data={buildBandRows(labels, band)} margin={margin}>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis
            dataKey="label"
            tick={axisTick(scale)}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            tick={axisTick(scale)}
            tickLine={false}
            axisLine={false}
            width={yAxisWidth}
            tickCount={5}
            domain={[yMin, yMax]}
            tickFormatter={(v: number) => fmt(v, range)}
          />
          {buildBandTooltip(bandColor, range, unit, locale)}
          <Area
            dataKey="range"
            stroke="none"
            fill={bandColor}
            fillOpacity={0.16}
            activeDot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="avg"
            stroke={bandColor}
            strokeWidth={2.6}
            fill="none"
            dot={{ r: 2.6, fill: bandColor, stroke: "#0a1124", strokeWidth: 1.4 }}
            activeDot={{ r: 5, fill: bandColor, stroke: "#0a1124", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Frame>
  );
}

function StateView({
  loading,
  emptyText,
  heightClass,
  height,
}: {
  loading: boolean;
  emptyText: string;
  heightClass?: string;
  height: number;
}) {
  return (
    <Frame heightClass={heightClass} height={height}>
      {loading ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 size={32} className="size-[2rem] animate-spin text-solar-light" />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-text-muted">
          {emptyText}
        </div>
      )}
    </Frame>
  );
}

interface WeatherChartProps {
  labels: string[];
  /** Line series; ignored when `band` is provided. */
  series?: LineSeries[];
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
  /** Daily min/max/avg band (phone weekly view); overrides `series` when set. */
  band?: WeatherBand;
  bandColor?: string;
}

function chartHasData(band: WeatherBand | undefined, n: number, total: number): boolean {
  return band ? band.avg.length > 0 : n > 0 && total > 0;
}

/**
 * Axis/margin geometry: phones get the mobile app's tight values (34px y-axis,
 * 8px right) so the plot area uses the narrow width; larger screens keep the
 * roomier rem-scaled desktop geometry.
 */
function useChartGeometry(scale: number) {
  const phone = useViewportWidth() < BREAKPOINTS.mobile;
  return {
    yAxisWidth: phone ? 34 : Math.round(54 * scale),
    margin: {
      top: Math.round(22 * scale),
      right: phone ? 8 : Math.round(18 * scale),
      bottom: Math.round(6 * scale),
      left: 0,
    },
  };
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
  emptyText,
  ticks,
  heightClass,
  band,
  bandColor = "#fbbf24",
}: WeatherChartProps) {
  const { t } = useI18n();
  const { clean, n, all } = readClean(series ?? []);

  if (loading || !chartHasData(band, n, all.length)) {
    return (
      <StateView
        loading={loading}
        emptyText={emptyText ?? t("chart.noDataPeriod")}
        heightClass={heightClass}
        height={height}
      />
    );
  }

  if (band) {
    return (
      <BandChart
        labels={labels}
        band={band}
        bandColor={bandColor}
        unit={unit}
        height={height}
        heightClass={heightClass}
      />
    );
  }

  return (
    <SeriesChart
      labels={labels}
      clean={clean}
      n={n}
      all={all}
      unit={unit}
      ticks={ticks}
      height={height}
      heightClass={heightClass}
    />
  );
}

function SeriesChart({
  labels,
  clean,
  n,
  all,
  unit,
  ticks,
  height,
  heightClass,
}: {
  labels: string[];
  clean: LineSeries[];
  n: number;
  all: number[];
  unit: string;
  ticks?: string[];
  height: number;
  heightClass?: string;
}) {
  const scale = useRemScale();
  const { yAxisWidth, margin } = useChartGeometry(scale);
  const { min: yMin, max: yMax, range } = weatherYDomain(all);
  const tickProps = xTickProps(ticks);

  return (
    <Frame heightClass={heightClass} height={height}>
      <ResponsiveContainer width="100%" height={heightClass ? "100%" : height}>
        <AreaChart data={buildRows(labels, clean)} margin={margin}>
          {buildDefs(clean)}
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis
            dataKey="label"
            tick={axisTick(scale)}
            tickLine={false}
            axisLine={false}
            {...tickProps}
          />
          <YAxis
            tick={axisTick(scale)}
            tickLine={false}
            axisLine={false}
            width={yAxisWidth}
            tickCount={5}
            domain={[yMin, yMax]}
            tickFormatter={(v: number) => fmt(v, range)}
          />
          {buildTooltip(clean, range, unit)}
          {buildAreas(clean, n)}
        </AreaChart>
      </ResponsiveContainer>
    </Frame>
  );
}

export default WeatherChart;

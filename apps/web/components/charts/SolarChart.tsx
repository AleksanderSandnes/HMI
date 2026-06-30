"use client";

import { formatNum, type SimpleChartData } from "@hmi/core";
import { Loader2 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Frame } from "./chartFrame";
import { AXIS_TICK, CURSOR, GRID_STROKE } from "./chartTheme";

import { barGapPercent } from "@/lib/chart";

interface SolarChartProps {
  data: SimpleChartData;
  timespan: string;
  loading?: boolean;
  height?: number;
  /** Hide grid + axes for a clean sparkline (e.g. the Dashboard mini chart). */
  showAxes?: boolean;
  /** Tailwind height class for a viewport-scaling chart; overrides `height`. */
  heightClass?: string;
}

interface Point {
  label: string;
  value: number;
}

// Recharts locates the Tooltip by inspecting its direct children's component type
// (like the axes in buildAxes). Returning the <Tooltip> from a builder — rather than
// wrapping it in a custom component — keeps it discoverable, so hover/cursor work.
function buildTooltip(isArea: boolean, unit: string) {
  return (
    <Tooltip
      cursor={isArea ? CURSOR : false}
      content={({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const p = payload[0];
        return (
          <div className="rounded-xl border border-glass-border-strong bg-[rgba(10,17,36,0.92)] px-3 py-2 text-center">
            <p className="text-[15px] font-extrabold text-text-primary">
              {formatNum(Number(p.value))} {unit}
            </p>
            <p className="mt-px text-[11px] font-semibold text-text-muted">{p.payload.label}</p>
          </div>
        );
      }}
    />
  );
}

// Recharts identifies axis children by component type via React.Children, which
// does NOT look inside a Fragment — but it does flatten arrays. So return an array
// (not a <>fragment</>) or the axes silently never render.
function buildAxes(yMax: number) {
  return [
    <CartesianGrid key="grid" vertical={false} stroke={GRID_STROKE} strokeWidth={1} />,
    <XAxis
      key="x"
      dataKey="label"
      tick={AXIS_TICK}
      tickLine={false}
      axisLine={false}
      interval="preserveStartEnd"
      minTickGap={28}
    />,
    <YAxis
      key="y"
      tick={AXIS_TICK}
      tickLine={false}
      axisLine={false}
      width={46}
      tickCount={5}
      domain={[0, yMax]}
      tickFormatter={(v: number) => formatNum(v)}
    />,
  ];
}

const MARGIN = { top: 22, right: 16, bottom: 6, left: 0 };

function readSolar(data: SimpleChartData): { values: number[]; labels: string[] } {
  return { values: data?.datasets?.[0]?.data ?? [], labels: data?.labels ?? [] };
}

const hasNoData = (values: number[]): boolean => !values.length || values.every((v) => v === 0);

function solarModel(values: number[], labels: string[]) {
  const chartData: Point[] = values.map((value, i) => ({ label: labels[i] ?? "", value }));
  const max = Math.max(...values);
  const peakIndex = values.indexOf(max);
  return {
    chartData,
    max,
    yMax: max > 0 ? max * 1.15 : 1,
    peakIndex,
    peakLabel: labels[peakIndex] ?? "",
  };
}

function StateView({
  loading,
  heightClass,
  height,
}: {
  loading: boolean;
  heightClass?: string;
  height: number;
}) {
  return (
    <Frame heightClass={heightClass} height={height}>
      {loading ? (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 size={32} className="animate-spin text-solar-light" />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-text-muted">
          No production data for this period
        </div>
      )}
    </Frame>
  );
}

function AreaView({
  chartData,
  axes,
  tooltip,
  peakLabel,
  max,
  width,
  height,
}: {
  chartData: Point[];
  axes: React.ReactNode;
  tooltip: React.ReactNode;
  peakLabel: string;
  max: number;
  // Injected by ResponsiveContainer via cloneElement — must reach the chart.
  width?: number;
  height?: number;
}) {
  return (
    <AreaChart width={width} height={height} data={chartData} margin={MARGIN}>
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity={0.55} />
          <stop offset="55%" stopColor="#10b981" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      {axes}
      {tooltip}
      <Area
        type="monotone"
        dataKey="value"
        stroke="#10b981"
        strokeWidth={7}
        strokeOpacity={0.18}
        fill="none"
        dot={false}
        isAnimationActive={false}
        legendType="none"
      />
      <Area
        type="monotone"
        dataKey="value"
        stroke="url(#lineStroke)"
        strokeWidth={3}
        fill="url(#areaFill)"
        dot={false}
        activeDot={{ r: 5, fill: "#34d399", stroke: "#0a1124", strokeWidth: 2 }}
      />
      <ReferenceDot x={peakLabel} y={max} r={9} fill="#f59e0b" fillOpacity={0.18} stroke="none" />
      <ReferenceDot x={peakLabel} y={max} r={4.5} fill="#fbbf24" stroke="#0a1124" strokeWidth={2} />
    </AreaChart>
  );
}

function BarView({
  chartData,
  axes,
  tooltip,
  gapPct,
  peakIndex,
  width,
  height,
}: {
  chartData: Point[];
  axes: React.ReactNode;
  tooltip: React.ReactNode;
  gapPct: number;
  peakIndex: number;
  // Injected by ResponsiveContainer via cloneElement — must reach the chart.
  width?: number;
  height?: number;
}) {
  return (
    <BarChart
      width={width}
      height={height}
      data={chartData}
      margin={MARGIN}
      barCategoryGap={`${gapPct}%`}
    >
      <defs>
        <linearGradient id="barPeak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="barNormal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.65} />
        </linearGradient>
      </defs>
      {axes}
      {tooltip}
      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={72} isAnimationActive={false}>
        {chartData.map((entry, i) => (
          <Cell key={i} fill={i === peakIndex ? "url(#barPeak)" : "url(#barNormal)"} />
        ))}
      </Bar>
    </BarChart>
  );
}

/**
 * Solar production chart (Recharts port of mobile ui/SolarChart.tsx).
 * Hourly → gradient area + smooth (monotone) line + peak dot.
 * Weekly/monthly/yearly → rounded gradient bars (peak bar highlighted).
 */
export function SolarChart({
  data,
  timespan,
  loading = false,
  height = 320,
  showAxes = true,
  heightClass,
}: SolarChartProps) {
  const { values, labels } = readSolar(data);
  const isArea = timespan === "hourly";

  if (loading || hasNoData(values)) {
    return <StateView loading={loading} heightClass={heightClass} height={height} />;
  }

  const { chartData, max, yMax, peakIndex, peakLabel } = solarModel(values, labels);
  const axes = showAxes ? buildAxes(yMax) : null;
  const tooltip = buildTooltip(isArea, isArea ? "W" : "kWh");

  return (
    <Frame heightClass={heightClass} height={height}>
      <ResponsiveContainer width="100%" height={heightClass ? "100%" : height}>
        {isArea ? (
          <AreaView
            chartData={chartData}
            axes={axes}
            tooltip={tooltip}
            peakLabel={peakLabel}
            max={max}
          />
        ) : (
          <BarView
            chartData={chartData}
            axes={axes}
            tooltip={tooltip}
            gapPct={barGapPercent(values.length)}
            peakIndex={peakIndex}
          />
        )}
      </ResponsiveContainer>
    </Frame>
  );
}

export default SolarChart;

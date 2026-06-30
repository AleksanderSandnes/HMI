import { formatMetric, weatherYDomain } from "@hmi/core";
import { Circle, LinearGradient, vec } from "@shopify/react-native-skia";
import { useMemo, type ReactNode } from "react";
import { View } from "react-native";
import { CartesianChart, Line, Area, AreaRange, useChartPressState } from "victory-native";
import type { ChartBounds, PointsArray } from "victory-native";

import { ChartMessage } from "./ChartMessage";
import { AXIS_LABEL_COLOR, GRID_COLOR, axisFont } from "./chartTheme";

const FONT = axisFont(12);

export interface LineSeries {
  data: number[];
  color: string;
  label: string;
}

export interface WeatherBand {
  min: number[];
  max: number[];
  avg: number[];
}

interface WeatherChartProps {
  labels: string[];
  /** Multi-series mode (tablet/hourly): one smooth area+line per series. */
  series?: LineSeries[];
  /** Daily-band mode (phone weekly): min–max band + average line. */
  band?: WeatherBand;
  /** Accent color for the band (defaults to solar). */
  bandColor?: string;
  unit?: string;
  loading?: boolean;
  height?: number;
  emptyText?: string;
}

type ChartPoints = Record<string, PointsArray>;

interface WeatherModel {
  isBand: boolean;
  clean: LineSeries[];
  yMin: number;
  yMax: number;
  range: number;
  yKeys: string[];
  rows: Record<string, number>[];
  hasData: boolean;
  firstColor: string;
}

function buildRows(
  labels: string[],
  clean: LineSeries[],
  band: WeatherBand | undefined,
  isBand: boolean,
): Record<string, number>[] {
  if (isBand && band) {
    return labels.map((_, i) => ({
      x: i,
      min: band.min[i] ?? 0,
      max: band.max[i] ?? 0,
      avg: band.avg[i] ?? 0,
    }));
  }
  return labels.map((_, i) => {
    const row: Record<string, number> = { x: i };
    clean.forEach((s, si) => (row[`s${si}`] = s.data[i] ?? 0));
    return row;
  });
}

function buildModel(
  labels: string[],
  series: LineSeries[] | undefined,
  band?: WeatherBand,
): WeatherModel {
  const isBand = !!band && band.avg.length > 0;
  const clean = (series || []).filter((s) => s.data && s.data.length > 0);
  const allValues = isBand && band ? [...band.min, ...band.max] : clean.flatMap((s) => s.data);
  const { min: yMin, max: yMax, range } = weatherYDomain(allValues);
  const yKeys = isBand ? ["min", "max", "avg"] : clean.map((_, i) => `s${i}`);
  const rows = buildRows(labels, clean, band, isBand);
  const hasData = isBand || (clean.length > 0 && rows.length > 0);
  const firstColor = clean[0]?.color ?? "#fbbf24";
  return { isBand, clean, yMin, yMax, range, yKeys, rows, hasData, firstColor };
}

function BandLayers({
  points,
  color,
  cursor,
}: {
  points: ChartPoints;
  color: string;
  cursor: ReactNode;
}) {
  return (
    <>
      <AreaRange
        upperPoints={points.max}
        lowerPoints={points.min}
        curveType="natural"
        color={color}
        opacity={0.16}
      />
      <Line points={points.avg} color={color} strokeWidth={2.6} curveType="natural" />
      {cursor}
    </>
  );
}

function SeriesLayers({
  points,
  chartBounds,
  series,
  cursor,
}: {
  points: ChartPoints;
  chartBounds: ChartBounds;
  series: LineSeries[];
  cursor: ReactNode;
}) {
  // Render last series first so the primary series sits on top.
  const ordered = series.map((s, si) => ({ s, si })).reverse();
  return (
    <>
      {ordered.map(({ s, si }) => (
        <Area key={`a${si}`} points={points[`s${si}`]} y0={chartBounds.bottom} curveType="natural">
          <LinearGradient
            start={vec(0, chartBounds.top)}
            end={vec(0, chartBounds.bottom)}
            colors={[`${s.color}52`, `${s.color}14`, `${s.color}00`]}
          />
        </Area>
      ))}
      {ordered.map(({ s, si }) => (
        <Line
          key={`l${si}`}
          points={points[`s${si}`]}
          color={s.color}
          strokeWidth={2.6}
          curveType="natural"
        />
      ))}
      {cursor}
    </>
  );
}

/**
 * Multi-series weather chart (Victory Native XL / Skia port of the web
 * WeatherChart). `series` → smooth areas + lines with a shared press crosshair;
 * `band` → a min–max area band + average line (phone weekly view).
 */
export function WeatherChart({
  labels,
  series,
  band,
  bandColor = "#fbbf24",
  loading = false,
  height = 320,
  emptyText = "No data for this period",
}: WeatherChartProps) {
  const { isBand, clean, yMin, yMax, range, yKeys, rows, hasData, firstColor } = useMemo(
    () => buildModel(labels, series, band),
    [labels, series, band],
  );

  // Press state keyed on the avg (band) or first series for the crosshair.
  const pressKey = isBand ? "avg" : "s0";
  const { state, isActive } = useChartPressState({ x: 0, y: { [pressKey]: 0 } });
  const cursorColor = isBand ? bandColor : firstColor;

  if (loading) return <ChartMessage height={height} />;
  if (!hasData) return <ChartMessage height={height} text={emptyText} />;

  return (
    <View style={{ height }}>
      <CartesianChart
        data={rows}
        xKey="x"
        yKeys={yKeys as string[]}
        domain={{ y: [yMin, yMax] }}
        domainPadding={{ left: 10, right: 10, top: 22 }}
        chartPressState={state}
        axisOptions={{
          font: FONT,
          lineColor: GRID_COLOR,
          labelColor: AXIS_LABEL_COLOR,
          tickCount: { x: Math.min(7, labels.length), y: 5 },
          formatXLabel: (i) => labels[Math.round(Number(i))] ?? "",
          formatYLabel: (v) => formatMetric(Number(v), range),
        }}
      >
        {({ points, chartBounds }) => {
          const cursor =
            isActive && state.y[pressKey] ? (
              <Circle
                cx={state.x.position}
                cy={state.y[pressKey].position}
                r={5}
                color={cursorColor}
              />
            ) : null;
          return isBand ? (
            <BandLayers points={points} color={bandColor} cursor={cursor} />
          ) : (
            <SeriesLayers
              points={points}
              chartBounds={chartBounds}
              series={clean}
              cursor={cursor}
            />
          );
        }}
      </CartesianChart>
    </View>
  );
}

export default WeatherChart;

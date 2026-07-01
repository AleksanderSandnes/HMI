import { formatMetric, weatherYDomain } from "@hmi/core";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Svg, { Circle, Defs, Line, Path } from "react-native-svg";

import { ChartMessage } from "./ChartMessage";
import { TooltipBubble } from "./Tooltip";
import { Axes } from "./svg/Axes";
import { useCrosshair } from "./svg/crosshair";
import { GradientDef } from "./svg/gradient";
import { areaPath, areaRangePath, linePath, type Pt } from "./svg/paths";
import { buildGeometry, type ChartGeometry } from "./svg/scales";

const MARGINS = { top: 8, right: 8, bottom: 24, left: 34 };
const DOMAIN_PADDING = { left: 3, right: 3, top: 22 };

const WEEKDAY_FULL: Record<string, string> = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

/** Expand a weekday abbreviation (weekly view) to its full name for the tooltip. */
function expandLabel(label: string): string {
  return WEEKDAY_FULL[label] ?? label;
}

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
  emptyText?: string;
}

interface WeatherModel {
  isBand: boolean;
  clean: LineSeries[];
  band?: WeatherBand;
  yMin: number;
  yMax: number;
  range: number;
  count: number;
  hasData: boolean;
  firstColor: string;
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
  const hasData = isBand || clean.length > 0;
  const firstColor = clean[0]?.color ?? "#fbbf24";
  return { isBand, clean, band, yMin, yMax, range, count: labels.length, hasData, firstColor };
}

function toPoints(geo: ChartGeometry, data: number[]): Pt[] {
  return Array.from({ length: geo.count }, (_, i) => ({ x: geo.x(i), y: geo.y(data[i] ?? 0) }));
}

/** Whether to render the canvas or an empty/loading message, once measured. */
function chartView(loading: boolean, hasData: boolean, size: { w: number; h: number }) {
  const ready = size.w > 0 && size.h > 0;
  return { showCanvas: ready && !loading && hasData, showEmpty: ready && !loading && !hasData };
}

function SeriesDefs({ series }: { series: LineSeries[] }) {
  return (
    <Defs>
      {series.map((s, si) => (
        <GradientDef
          key={si}
          id={`wx-${si}`}
          stops={[
            { offset: 0, color: s.color, opacity: 0.32 },
            { offset: 0.5, color: s.color, opacity: 0.08 },
            { offset: 1, color: s.color, opacity: 0 },
          ]}
        />
      ))}
    </Defs>
  );
}

function SeriesLayers({ geo, series }: { geo: ChartGeometry; series: LineSeries[] }) {
  // Render last series first so the primary series sits on top.
  const ordered = series.map((s, si) => ({ s, si })).reverse();
  return (
    <>
      {ordered.map(({ s, si }) => (
        <Path
          key={`a${si}`}
          d={areaPath(toPoints(geo, s.data), geo.bounds.bottom)}
          fill={`url(#wx-${si})`}
        />
      ))}
      {ordered.map(({ s, si }) => (
        <Path
          key={`l${si}`}
          d={linePath(toPoints(geo, s.data))}
          fill="none"
          stroke={s.color}
          strokeWidth={2.6}
        />
      ))}
    </>
  );
}

function BandLayers({
  geo,
  band,
  color,
}: {
  geo: ChartGeometry;
  band: WeatherBand;
  color: string;
}) {
  return (
    <>
      <Path
        d={areaRangePath(toPoints(geo, band.max), toPoints(geo, band.min))}
        fill={color}
        fillOpacity={0.16}
      />
      <Path d={linePath(toPoints(geo, band.avg))} fill="none" stroke={color} strokeWidth={2.6} />
    </>
  );
}

interface TooltipRow {
  color: string;
  label: string;
  value: number;
}

/** Series rows to list in the crosshair bubble at a given index. */
function tooltipRows(model: WeatherModel, index: number, bandColor: string): TooltipRow[] {
  if (model.isBand && model.band) {
    const b = model.band;
    return [
      { color: "#fb7185", label: "High", value: b.max[index] ?? 0 },
      { color: bandColor, label: "Avg", value: b.avg[index] ?? 0 },
      { color: "#60a5fa", label: "Low", value: b.min[index] ?? 0 },
    ];
  }
  return model.clean.map((s) => ({ color: s.color, label: s.label, value: s.data[index] ?? 0 }));
}

function CrosshairBubble({
  rows,
  header,
  unit,
  range,
  x,
  width,
}: {
  rows: TooltipRow[];
  header: string;
  unit: string;
  range: number;
  x: number;
  width: number;
}) {
  return (
    <TooltipBubble x={x} width={width}>
      <Text className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.3px] text-text-muted">
        {header}
      </Text>
      {rows.map((r) => (
        <View key={r.label} className="mt-0.5 flex-row items-center gap-1.5">
          <View className="h-1.5 w-1.5 rounded-pill" style={{ backgroundColor: r.color }} />
          <Text className="flex-1 text-[11px] font-medium text-text-secondary">{r.label}</Text>
          <Text className="text-[11.5px] font-extrabold text-text-primary">
            {formatMetric(r.value, range)}
            {unit ? ` ${unit}` : ""}
          </Text>
        </View>
      ))}
    </TooltipBubble>
  );
}

function CrosshairMarkers({
  geo,
  index,
  rows,
}: {
  geo: ChartGeometry;
  index: number;
  rows: TooltipRow[];
}) {
  return (
    <>
      <Line
        x1={geo.x(index)}
        y1={geo.bounds.top}
        x2={geo.x(index)}
        y2={geo.bounds.bottom}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth={1}
      />
      {rows.map((r) => (
        <Circle
          key={r.label}
          cx={geo.x(index)}
          cy={geo.y(r.value)}
          r={4.5}
          fill={r.color}
          stroke="#0a1124"
          strokeWidth={1.5}
        />
      ))}
    </>
  );
}

function WeatherCanvas({
  width,
  height,
  model,
  labels,
  bandColor,
  unit,
}: {
  width: number;
  height: number;
  model: WeatherModel;
  labels: string[];
  bandColor: string;
  unit: string;
}) {
  const geo = useMemo(
    () =>
      buildGeometry({
        width,
        height,
        margins: MARGINS,
        count: labels.length,
        yDomain: [model.yMin, model.yMax],
        domainPadding: DOMAIN_PADDING,
      }),
    [width, height, model, labels.length],
  );
  const { index, gesture } = useCrosshair(geo);
  const rows = index != null ? tooltipRows(model, index, bandColor) : [];

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height }}>
        <Svg width={width} height={height}>
          {!model.isBand ? <SeriesDefs series={model.clean} /> : null}
          <Axes
            geo={geo}
            xCount={Math.min(5, labels.length)}
            yCount={5}
            xAt={geo.x}
            formatX={(i) => labels[i] ?? ""}
            formatY={(v) => formatMetric(v, model.range)}
          />
          {model.isBand && model.band ? (
            <BandLayers geo={geo} band={model.band} color={bandColor} />
          ) : (
            <SeriesLayers geo={geo} series={model.clean} />
          )}
          {index != null ? <CrosshairMarkers geo={geo} index={index} rows={rows} /> : null}
        </Svg>
        {index != null ? (
          <CrosshairBubble
            rows={rows}
            header={expandLabel(labels[index] ?? "")}
            unit={unit}
            range={model.range}
            x={geo.x(index)}
            width={width}
          />
        ) : null}
      </View>
    </GestureDetector>
  );
}

/**
 * Multi-series weather chart (react-native-svg port of the web WeatherChart).
 * `series` → smooth areas + lines with a shared press crosshair; `band` → a
 * min–max area band + average line (phone weekly view).
 */
export function WeatherChart({
  labels,
  series,
  band,
  bandColor = "#fbbf24",
  unit = "",
  loading = false,
  emptyText = "No data for this period",
}: WeatherChartProps) {
  const model = useMemo(() => buildModel(labels, series, band), [labels, series, band]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { showCanvas, showEmpty } = chartView(loading, model.hasData, size);

  return (
    <View
      className="w-full flex-1"
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {showCanvas ? (
        <WeatherCanvas
          width={size.w}
          height={size.h}
          model={model}
          labels={labels}
          bandColor={bandColor}
          unit={unit}
        />
      ) : (
        <ChartMessage text={showEmpty ? emptyText : undefined} />
      )}
    </View>
  );
}

export default WeatherChart;

import { barGapPercent, formatNum, formatPeak, peakUnit, type SimpleChartData } from "@hmi/core";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Svg, { Circle, Defs, Line, Path, Rect } from "react-native-svg";

import { ChartMessage } from "./ChartMessage";
import { TooltipBubble } from "./Tooltip";
import { Axes } from "./svg/Axes";
import { useCrosshair } from "./svg/crosshair";
import { GradientDef } from "./svg/gradient";
import { areaPath, linePath, type Pt } from "./svg/paths";
import { buildGeometry, type ChartGeometry } from "./svg/scales";

const MARGINS = { top: 8, right: 14, bottom: 24, left: 40 };
const AREA_PADDING = { left: 8, right: 8, top: 22 };
const BAR_PADDING = { left: 16, right: 16, top: 22 };
const MAX_BAR = 72;

const WEEKDAY_FULL: Record<string, string> = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};
const MONTH_FULL: Record<string, string> = {
  Jan: "January",
  Feb: "February",
  Mar: "March",
  Apr: "April",
  May: "May",
  Jun: "June",
  Jul: "July",
  Aug: "August",
  Sep: "September",
  Oct: "October",
  Nov: "November",
  Dec: "December",
};

/** Expand the crosshair header to a friendly label per timespan (design tooltips). */
function tooltipHeader(timespan: string, label: string, date?: string): string {
  if (timespan === "weekly") return WEEKDAY_FULL[label] ?? label;
  if (timespan === "yearly") return MONTH_FULL[label] ?? label;
  if (timespan === "monthly" && date) {
    const month = new Date(date).toLocaleDateString("en-US", { month: "long" });
    return `${month} ${label}`;
  }
  return label;
}

/** Hourly reads in kW; aggregated totals scale kWh→MWh. */
function tooltipValue(timespan: string, v: number): string {
  const unit = timespan === "hourly" ? "W" : "kWh";
  return `${formatPeak(v)} ${peakUnit(v, unit)}`;
}

/** Y-axis label: hourly is scaled W→kW to match the tooltip; aggregated stays kWh. */
function axisLabel(timespan: string, v: number): string {
  if (timespan !== "hourly") return formatNum(v);
  if (v === 0) return "0";
  const kw = v / 1000;
  return kw >= 10 ? `${Math.round(kw)}` : `${kw.toFixed(1)}`;
}

interface SolarChartProps {
  data: SimpleChartData;
  timespan: string;
  /** Selected ISO date — used to prefix the month name on the monthly tooltip. */
  date?: string;
  loading?: boolean;
}

interface SolarModel {
  values: number[];
  labels: string[];
  isArea: boolean;
  yMax: number;
  peakIndex: number;
  innerPadding: number;
}

function toPoints(geo: ChartGeometry, data: number[]): Pt[] {
  return data.map((v, i) => ({ x: geo.x(i), y: geo.y(v) }));
}

function SolarArea({ geo, model }: { geo: ChartGeometry; model: SolarModel }) {
  const points = toPoints(geo, model.values);
  const peak = points[model.peakIndex];
  return (
    <>
      <Defs>
        <GradientDef
          id="solar-area"
          stops={[
            { offset: 0, color: "#34d399", opacity: 0.55 },
            { offset: 0.55, color: "#10b981", opacity: 0.1 },
            { offset: 1, color: "#10b981", opacity: 0 },
          ]}
        />
        <GradientDef
          id="solar-line"
          horizontal
          stops={[
            { offset: 0, color: "#34d399" },
            { offset: 1, color: "#818cf8" },
          ]}
        />
      </Defs>
      <Path d={areaPath(points, geo.bounds.bottom)} fill="url(#solar-area)" />
      <Path d={linePath(points)} fill="none" stroke="url(#solar-line)" strokeWidth={3} />
      {peak ? (
        <>
          <Circle cx={peak.x} cy={peak.y} r={9} fill="rgba(245,158,11,0.18)" />
          <Circle cx={peak.x} cy={peak.y} r={4.5} fill="#fbbf24" />
        </>
      ) : null}
    </>
  );
}

/** Pixel x of each bar's centre — also where the x-axis labels are anchored. */
function barCenter(geo: ChartGeometry, padX: number, i: number): number {
  const innerLeft = geo.bounds.left + padX;
  const band = (geo.bounds.right - padX - innerLeft) / geo.count;
  return innerLeft + band * (i + 0.5);
}

function SolarBars({ geo, model }: { geo: ChartGeometry; model: SolarModel }) {
  const padX = BAR_PADDING.left;
  const band = (geo.bounds.right - padX - (geo.bounds.left + padX)) / geo.count;
  const barWidth = Math.min(MAX_BAR, band * (1 - model.innerPadding));
  return (
    <>
      <Defs>
        <GradientDef
          id="bar-normal"
          stops={[
            { offset: 0, color: "#818cf8", opacity: 0.95 },
            { offset: 1, color: "#6366f1", opacity: 0.65 },
          ]}
        />
        <GradientDef
          id="bar-peak"
          stops={[
            { offset: 0, color: "#fbbf24" },
            { offset: 1, color: "#f59e0b" },
          ]}
        />
      </Defs>
      {model.values.map((v, i) => {
        const y = geo.y(v);
        return (
          <Rect
            key={i}
            x={barCenter(geo, padX, i) - barWidth / 2}
            y={y}
            width={barWidth}
            height={Math.max(0, geo.bounds.bottom - y)}
            rx={6}
            fill={i === model.peakIndex ? "url(#bar-peak)" : "url(#bar-normal)"}
          />
        );
      })}
    </>
  );
}

function readModel(data: SimpleChartData, timespan: string): SolarModel {
  const values = data?.datasets?.[0]?.data ?? [];
  const labels = data?.labels ?? [];
  const max = Math.max(...values);
  return {
    values,
    labels,
    isArea: timespan === "hourly",
    yMax: max > 0 ? max * 1.15 : 1,
    peakIndex: values.indexOf(max),
    innerPadding: barGapPercent(values.length) / 100,
  };
}

function SolarCanvas({
  width,
  height,
  model,
  timespan,
  date,
}: {
  width: number;
  height: number;
  model: SolarModel;
  timespan: string;
  date?: string;
}) {
  const geo = useMemo(
    () =>
      buildGeometry({
        width,
        height,
        margins: MARGINS,
        count: model.values.length,
        yDomain: [0, model.yMax],
        domainPadding: model.isArea ? AREA_PADDING : BAR_PADDING,
      }),
    [width, height, model],
  );
  const xAt = (i: number) => (model.isArea ? geo.x(i) : barCenter(geo, BAR_PADDING.left, i));
  const { index, gesture } = useCrosshair(geo);
  const value = index != null ? model.values[index] : null;

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height }}>
        <Svg width={width} height={height}>
          <Axes
            geo={geo}
            xCount={Math.min(6, model.values.length)}
            yCount={5}
            xAt={xAt}
            formatX={(i) => model.labels[i] ?? ""}
            formatY={(v) => axisLabel(timespan, v)}
          />
          {model.isArea ? (
            <SolarArea geo={geo} model={model} />
          ) : (
            <SolarBars geo={geo} model={model} />
          )}
          {index != null && value != null ? (
            <>
              <Line
                x1={xAt(index)}
                y1={geo.bounds.top}
                x2={xAt(index)}
                y2={geo.bounds.bottom}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth={1}
              />
              <Circle
                cx={xAt(index)}
                cy={geo.y(value)}
                r={4.5}
                fill="#fbbf24"
                stroke="#0a1124"
                strokeWidth={1.5}
              />
            </>
          ) : null}
        </Svg>
        {index != null && value != null ? (
          <TooltipBubble x={xAt(index)} width={width}>
            <Text className="text-[10.5px] font-bold uppercase tracking-[0.3px] text-text-muted">
              {tooltipHeader(timespan, model.labels[index] ?? "", date)}
            </Text>
            <Text className="mt-0.5 text-[14px] font-extrabold text-text-primary">
              {tooltipValue(timespan, value)}
            </Text>
          </TooltipBubble>
        ) : null}
      </View>
    </GestureDetector>
  );
}

/**
 * Solar production chart (react-native-svg port of the web SolarChart).
 * Hourly → gradient area + horizontal gradient line + peak dot. Aggregated →
 * rounded gradient bars with the peak bar highlighted.
 */
export function SolarChart({ data, timespan, date, loading = false }: SolarChartProps) {
  const model = useMemo(() => readModel(data, timespan), [data, timespan]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const empty = !model.values.length || model.values.every((v) => v === 0);
  const showCanvas = !loading && !empty && size.w > 0 && size.h > 0;

  return (
    <View
      className="w-full flex-1"
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {showCanvas ? (
        <SolarCanvas width={size.w} height={size.h} model={model} timespan={timespan} date={date} />
      ) : (
        <ChartMessage text={!loading && empty ? "No production data for this period" : undefined} />
      )}
    </View>
  );
}

export default SolarChart;

import { barGapPercent, formatNum, type SimpleChartData } from "@hmi/core";
import { useMemo, useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, Path, Rect } from "react-native-svg";

import { ChartMessage } from "./ChartMessage";
import { Axes } from "./svg/Axes";
import { GradientDef } from "./svg/gradient";
import { areaPath, linePath, type Pt } from "./svg/paths";
import { buildGeometry, type ChartGeometry } from "./svg/scales";

const MARGINS = { top: 8, right: 14, bottom: 24, left: 40 };
const AREA_PADDING = { left: 8, right: 8, top: 22 };
const BAR_PADDING = { left: 16, right: 16, top: 22 };
const MAX_BAR = 72;

interface SolarChartProps {
  data: SimpleChartData;
  timespan: string;
  loading?: boolean;
  height?: number;
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
            { offset: 0, color: "rgba(52,211,153,0.55)" },
            { offset: 0.55, color: "rgba(16,185,129,0.10)" },
            { offset: 1, color: "rgba(16,185,129,0)" },
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
            { offset: 0, color: "rgba(129,140,248,0.95)" },
            { offset: 1, color: "rgba(99,102,241,0.65)" },
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
}: {
  width: number;
  height: number;
  model: SolarModel;
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

  return (
    <Svg width={width} height={height}>
      <Axes
        geo={geo}
        xCount={Math.min(6, model.values.length)}
        yCount={5}
        xAt={xAt}
        formatX={(i) => model.labels[i] ?? ""}
        formatY={(v) => formatNum(v)}
      />
      {model.isArea ? <SolarArea geo={geo} model={model} /> : <SolarBars geo={geo} model={model} />}
    </Svg>
  );
}

/**
 * Solar production chart (react-native-svg port of the web SolarChart).
 * Hourly → gradient area + horizontal gradient line + peak dot. Aggregated →
 * rounded gradient bars with the peak bar highlighted.
 */
export function SolarChart({ data, timespan, loading = false, height = 300 }: SolarChartProps) {
  const model = useMemo(() => readModel(data, timespan), [data, timespan]);
  const [width, setWidth] = useState(0);

  if (loading) return <ChartMessage height={height} />;
  if (!model.values.length || model.values.every((v) => v === 0)) {
    return <ChartMessage height={height} text="No production data for this period" />;
  }

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? <SolarCanvas width={width} height={height} model={model} /> : null}
    </View>
  );
}

export default SolarChart;

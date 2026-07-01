import { formatMetric, weatherYDomain } from "@hmi/core";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import Svg, { Circle, Defs, Path } from "react-native-svg";

import { ChartMessage } from "./ChartMessage";
import { Axes } from "./svg/Axes";
import { GradientDef } from "./svg/gradient";
import { areaPath, areaRangePath, linePath, type Pt } from "./svg/paths";
import { buildGeometry, type ChartGeometry } from "./svg/scales";

const MARGINS = { top: 8, right: 14, bottom: 24, left: 44 };
const DOMAIN_PADDING = { left: 10, right: 10, top: 22 };

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

function useCrosshair(geo: ChartGeometry) {
  const [index, setIndex] = useState<number | null>(null);
  const gesture = useMemo(() => {
    const select = (px: number) => {
      const i = Math.round(geo.invertX(px));
      setIndex(Math.max(0, Math.min(geo.count - 1, i)));
    };
    return Gesture.Pan()
      .minDistance(0)
      .onBegin((e) => runOnJS(select)(e.x))
      .onUpdate((e) => runOnJS(select)(e.x))
      .onFinalize(() => runOnJS(setIndex)(null));
  }, [geo]);
  return { index, gesture };
}

function cursorValue(model: WeatherModel, index: number): number {
  return model.isBand ? (model.band?.avg[index] ?? 0) : (model.clean[0]?.data[index] ?? 0);
}

function WeatherCanvas({
  width,
  height,
  model,
  labels,
  bandColor,
}: {
  width: number;
  height: number;
  model: WeatherModel;
  labels: string[];
  bandColor: string;
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
  const color = model.isBand ? bandColor : model.firstColor;

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height }}>
        <Svg width={width} height={height}>
          {!model.isBand ? <SeriesDefs series={model.clean} /> : null}
          <Axes
            geo={geo}
            xCount={Math.min(7, labels.length)}
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
          {index != null ? (
            <Circle cx={geo.x(index)} cy={geo.y(cursorValue(model, index))} r={5} fill={color} />
          ) : null}
        </Svg>
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
  loading = false,
  height = 320,
  emptyText = "No data for this period",
}: WeatherChartProps) {
  const model = useMemo(() => buildModel(labels, series, band), [labels, series, band]);
  const [width, setWidth] = useState(0);

  if (loading) return <ChartMessage height={height} />;
  if (!model.hasData) return <ChartMessage height={height} text={emptyText} />;

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <WeatherCanvas
          width={width}
          height={height}
          model={model}
          labels={labels}
          bandColor={bandColor}
        />
      ) : null}
    </View>
  );
}

export default WeatherChart;

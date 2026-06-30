import { formatNum, barGapPercent, type SimpleChartData } from "@hmi/core";
import { Circle, LinearGradient, vec } from "@shopify/react-native-skia";
import { View } from "react-native";
import { CartesianChart, Line, Area, Bar } from "victory-native";
import type { ChartBounds, PointsArray } from "victory-native";

import { ChartMessage } from "./ChartMessage";
import { AXIS_LABEL_COLOR, GRID_COLOR, axisFont } from "./chartTheme";

const FONT = axisFont(12);

interface SolarChartProps {
  data: SimpleChartData;
  timespan: string;
  loading?: boolean;
  height?: number;
}

interface BranchProps {
  points: PointsArray;
  chartBounds: ChartBounds;
  peakIndex: number;
}

function SolarArea({ points, chartBounds, peakIndex }: BranchProps) {
  const peak = points[peakIndex];
  return (
    <>
      <Area points={points} y0={chartBounds.bottom} curveType="natural">
        <LinearGradient
          start={vec(0, chartBounds.top)}
          end={vec(0, chartBounds.bottom)}
          colors={["rgba(52,211,153,0.55)", "rgba(16,185,129,0.10)", "rgba(16,185,129,0)"]}
        />
      </Area>
      <Line points={points} strokeWidth={3} curveType="natural">
        <LinearGradient
          start={vec(chartBounds.left, 0)}
          end={vec(chartBounds.right, 0)}
          colors={["#34d399", "#818cf8"]}
        />
      </Line>
      {peak?.y != null ? (
        <>
          <Circle cx={peak.x} cy={peak.y} r={9} color="rgba(245,158,11,0.18)" />
          <Circle cx={peak.x} cy={peak.y} r={4.5} color="#fbbf24" />
        </>
      ) : null}
    </>
  );
}

function SolarBars({
  points,
  chartBounds,
  peakIndex,
  innerPadding,
}: BranchProps & { innerPadding: number }) {
  // Base bars (accent) + a second layer where only the peak keeps its height
  // (others flattened to the axis) → the peak bar gets the solar gradient.
  const peakPoints = points.map((p, i) => (i === peakIndex ? p : { ...p, y: chartBounds.bottom }));
  const rounded = { topLeft: 6, topRight: 6 };
  return (
    <>
      <Bar
        points={points}
        chartBounds={chartBounds}
        innerPadding={innerPadding}
        roundedCorners={rounded}
      >
        <LinearGradient
          start={vec(0, chartBounds.top)}
          end={vec(0, chartBounds.bottom)}
          colors={["rgba(129,140,248,0.95)", "rgba(99,102,241,0.65)"]}
        />
      </Bar>
      <Bar
        points={peakPoints}
        chartBounds={chartBounds}
        innerPadding={innerPadding}
        roundedCorners={rounded}
      >
        <LinearGradient
          start={vec(0, chartBounds.top)}
          end={vec(0, chartBounds.bottom)}
          colors={["#fbbf24", "#f59e0b"]}
        />
      </Bar>
    </>
  );
}

function readSolar(data: SimpleChartData): { values: number[]; labels: string[] } {
  return { values: data?.datasets?.[0]?.data ?? [], labels: data?.labels ?? [] };
}

/**
 * Solar production chart (Victory Native XL / Skia port of the web SolarChart).
 * Hourly → gradient area + line + peak dot. Weekly/monthly/yearly/total →
 * rounded gradient bars with the peak bar highlighted.
 */
export function SolarChart({ data, timespan, loading = false, height = 300 }: SolarChartProps) {
  const { values, labels } = readSolar(data);
  const isArea = timespan === "hourly";

  if (loading) return <ChartMessage height={height} />;
  if (!values.length || values.every((v) => v === 0)) {
    return <ChartMessage height={height} text="No production data for this period" />;
  }

  const rows = values.map((value, i) => ({ x: i, value }));
  const max = Math.max(...values);
  const yMax = max > 0 ? max * 1.15 : 1;
  const peakIndex = values.indexOf(max);
  const innerPadding = barGapPercent(values.length) / 100;

  return (
    <View style={{ height }}>
      <CartesianChart
        data={rows}
        xKey="x"
        yKeys={["value"]}
        domain={{ y: [0, yMax] }}
        domainPadding={isArea ? { left: 8, right: 8, top: 22 } : { left: 16, right: 16, top: 22 }}
        axisOptions={{
          font: FONT,
          lineColor: GRID_COLOR,
          labelColor: AXIS_LABEL_COLOR,
          tickCount: { x: Math.min(6, values.length), y: 5 },
          formatXLabel: (i) => labels[Math.round(Number(i))] ?? "",
          formatYLabel: (v) => formatNum(Number(v)),
        }}
      >
        {({ points, chartBounds }) =>
          isArea ? (
            <SolarArea points={points.value} chartBounds={chartBounds} peakIndex={peakIndex} />
          ) : (
            <SolarBars
              points={points.value}
              chartBounds={chartBounds}
              peakIndex={peakIndex}
              innerPadding={innerPadding}
            />
          )
        }
      </CartesianChart>
    </View>
  );
}

export default SolarChart;

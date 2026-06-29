import { ActivityIndicator, Text, View } from 'react-native';
import { CartesianChart, Line, Area, Bar } from 'victory-native';
import { Circle, LinearGradient, vec } from '@shopify/react-native-skia';
import { formatNum, barGapPercent, type SimpleChartData } from '@hmi/core';
import { AXIS_LABEL_COLOR, GRID_COLOR, axisFont } from './chartTheme';

const FONT = axisFont(12);

interface SolarChartProps {
  data: SimpleChartData;
  timespan: string;
  loading?: boolean;
  height?: number;
}

/**
 * Solar production chart (Victory Native XL / Skia port of the web SolarChart).
 * Hourly → gradient area + line + peak dot. Weekly/monthly/yearly/total →
 * rounded gradient bars with the peak bar highlighted (a second Bar layer whose
 * non-peak points are flattened to the axis, mirroring web's per-bar Cell color).
 */
export function SolarChart({
  data,
  timespan,
  loading = false,
  height = 300,
}: SolarChartProps) {
  const values = data?.datasets?.[0]?.data ?? [];
  const labels = data?.labels ?? [];
  const isArea = timespan === 'hourly';

  if (loading) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <ActivityIndicator color="#fbbf24" />
      </View>
    );
  }

  if (!values.length || values.every((v) => v === 0)) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <Text className="text-sm font-semibold text-text-muted">
          No production data for this period
        </Text>
      </View>
    );
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
        yKeys={['value']}
        domain={{ y: [0, yMax] }}
        domainPadding={
          isArea ? { left: 8, right: 8, top: 22 } : { left: 16, right: 16, top: 22 }
        }
        axisOptions={{
          font: FONT,
          lineColor: GRID_COLOR,
          labelColor: AXIS_LABEL_COLOR,
          tickCount: { x: Math.min(6, values.length), y: 5 },
          formatXLabel: (i) => labels[Math.round(Number(i))] ?? '',
          formatYLabel: (v) => formatNum(Number(v)),
        }}
      >
        {({ points, chartBounds }) => {
          if (isArea) {
            const peak = points.value[peakIndex];
            return (
              <>
                <Area
                  points={points.value}
                  y0={chartBounds.bottom}
                  curveType="natural"
                >
                  <LinearGradient
                    start={vec(0, chartBounds.top)}
                    end={vec(0, chartBounds.bottom)}
                    colors={[
                      'rgba(52,211,153,0.55)',
                      'rgba(16,185,129,0.10)',
                      'rgba(16,185,129,0)',
                    ]}
                  />
                </Area>
                <Line points={points.value} strokeWidth={3} curveType="natural">
                  <LinearGradient
                    start={vec(chartBounds.left, 0)}
                    end={vec(chartBounds.right, 0)}
                    colors={['#34d399', '#818cf8']}
                  />
                </Line>
                {peak?.y != null ? (
                  <>
                    <Circle
                      cx={peak.x}
                      cy={peak.y}
                      r={9}
                      color="rgba(245,158,11,0.18)"
                    />
                    <Circle cx={peak.x} cy={peak.y} r={4.5} color="#fbbf24" />
                  </>
                ) : null}
              </>
            );
          }

          // Bars: base (accent gradient) + peak overlay (solar gradient).
          const peakPoints = points.value.map((p, i) =>
            i === peakIndex ? p : { ...p, y: chartBounds.bottom },
          );
          return (
            <>
              <Bar
                points={points.value}
                chartBounds={chartBounds}
                innerPadding={innerPadding}
                roundedCorners={{ topLeft: 6, topRight: 6 }}
              >
                <LinearGradient
                  start={vec(0, chartBounds.top)}
                  end={vec(0, chartBounds.bottom)}
                  colors={['rgba(129,140,248,0.95)', 'rgba(99,102,241,0.65)']}
                />
              </Bar>
              <Bar
                points={peakPoints}
                chartBounds={chartBounds}
                innerPadding={innerPadding}
                roundedCorners={{ topLeft: 6, topRight: 6 }}
              >
                <LinearGradient
                  start={vec(0, chartBounds.top)}
                  end={vec(0, chartBounds.bottom)}
                  colors={['#fbbf24', '#f59e0b']}
                />
              </Bar>
            </>
          );
        }}
      </CartesianChart>
    </View>
  );
}

export default SolarChart;

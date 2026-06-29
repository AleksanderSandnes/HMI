import { useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import {
  CartesianChart,
  Line,
  Area,
  AreaRange,
  useChartPressState,
} from 'victory-native';
import { Circle, LinearGradient, vec } from '@shopify/react-native-skia';
import { formatMetric, weatherYDomain } from '@hmi/core';
import { AXIS_LABEL_COLOR, GRID_COLOR, axisFont } from './chartTheme';

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

/**
 * Multi-series weather chart (Victory Native XL / Skia port of the web
 * WeatherChart). `series` → smooth areas + lines with a shared press crosshair;
 * `band` → a min–max area band + average line (phone weekly view). Y-domain math
 * is shared with web via @hmi/core weatherYDomain.
 */
export function WeatherChart({
  labels,
  series,
  band,
  bandColor = '#fbbf24',
  unit = '',
  loading = false,
  height = 320,
  emptyText = 'No data for this period',
}: WeatherChartProps) {
  const isBand = !!band && band.avg.length > 0;
  const clean = useMemo(
    () => (series || []).filter((s) => s.data && s.data.length > 0),
    [series],
  );

  const allValues = isBand
    ? [...band!.min, ...band!.max]
    : clean.flatMap((s) => s.data);
  const { min: yMin, max: yMax, range } = weatherYDomain(allValues);

  const yKeys = isBand
    ? (['min', 'max', 'avg'] as const)
    : clean.map((_, i) => `s${i}` as const);

  const rows = useMemo<Record<string, number>[]>(() => {
    if (isBand) {
      return labels.map((_, i) => ({
        x: i,
        min: band!.min[i] ?? 0,
        max: band!.max[i] ?? 0,
        avg: band!.avg[i] ?? 0,
      }));
    }
    return labels.map((_, i) => {
      const row: Record<string, number> = { x: i };
      clean.forEach((s, si) => {
        row[`s${si}`] = s.data[i] ?? 0;
      });
      return row;
    });
  }, [isBand, labels, band, clean]);

  // Press state keyed on the avg (band) or first series for the crosshair.
  const pressKey = isBand ? 'avg' : 's0';
  const { state, isActive } = useChartPressState({ x: 0, y: { [pressKey]: 0 } });

  const hasData = isBand ? band!.avg.length > 0 : clean.length > 0 && rows.length > 0;

  if (loading) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <ActivityIndicator color="#fbbf24" />
      </View>
    );
  }

  if (!hasData) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <Text className="text-sm font-semibold text-text-muted">
          {emptyText}
        </Text>
      </View>
    );
  }

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
          formatXLabel: (i) => labels[Math.round(Number(i))] ?? '',
          formatYLabel: (v) => formatMetric(Number(v), range),
        }}
      >
        {({ points, chartBounds }) => {
          if (isBand) {
            return (
              <>
                <AreaRange
                  upperPoints={points.max}
                  lowerPoints={points.min}
                  curveType="natural"
                  color={bandColor}
                  opacity={0.16}
                />
                <Line
                  points={points.avg}
                  color={bandColor}
                  strokeWidth={2.6}
                  curveType="natural"
                />
                {isActive && state.y[pressKey] ? (
                  <Circle
                    cx={state.x.position}
                    cy={state.y[pressKey].position}
                    r={5}
                    color={bandColor}
                  />
                ) : null}
              </>
            );
          }

          // Render last series first so the primary series sits on top.
          return (
            <>
              {clean
                .map((s, si) => ({ s, si }))
                .reverse()
                .map(({ s, si }) => (
                  <Area
                    key={si}
                    points={points[`s${si}`]}
                    y0={chartBounds.bottom}
                    curveType="natural"
                  >
                    <LinearGradient
                      start={vec(0, chartBounds.top)}
                      end={vec(0, chartBounds.bottom)}
                      colors={[`${s.color}52`, `${s.color}14`, `${s.color}00`]}
                    />
                  </Area>
                ))}
              {clean
                .map((s, si) => ({ s, si }))
                .reverse()
                .map(({ s, si }) => (
                  <Line
                    key={si}
                    points={points[`s${si}`]}
                    color={s.color}
                    strokeWidth={2.6}
                    curveType="natural"
                  />
                ))}
              {isActive && state.y[pressKey] ? (
                <Circle
                  cx={state.x.position}
                  cy={state.y[pressKey].position}
                  r={5}
                  color={clean[0]?.color ?? '#fbbf24'}
                />
              ) : null}
            </>
          );
        }}
      </CartesianChart>
    </View>
  );
}

export default WeatherChart;

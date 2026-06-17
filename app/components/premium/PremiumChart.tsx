import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Line,
  Circle,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { premiumTheme } from '../../theme/premiumTheme';

/**
 * Match the app's UI font. react-native-svg <Text> otherwise falls back to the
 * browser/native default, which is why the chart looked different.
 */
const CHART_FONT = Platform.select({
  web: "'Inter', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif",
  default: undefined,
});

export interface ChartData {
  labels: string[];
  datasets: { data: number[] }[];
}

interface PremiumChartProps {
  data: ChartData;
  timespan: string; // 'hourly' | 'weekly' | 'monthly' | 'yearly'
  loading?: boolean;
  height?: number;
}

interface Pt {
  x: number;
  y: number;
}

const PAD = { top: 22, right: 16, bottom: 30, left: 46 };

function formatNum(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  if (v >= 100) return `${Math.round(v)}`;
  return `${Math.round(v)}`;
}

function smoothPath(points: Pt[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

function roundedBarPath(
  x: number,
  y: number,
  w: number,
  baseY: number,
  radius: number
): string {
  const h = baseY - y;
  const r = Math.max(0, Math.min(radius, w / 2, h));
  if (h <= 0.5) {
    // Draw a thin rounded cap so zero-ish values still read as a bar.
    return `M ${x} ${baseY} L ${x + w} ${baseY}`;
  }
  return (
    `M ${x} ${baseY}` +
    ` L ${x} ${y + r}` +
    ` Q ${x} ${y} ${x + r} ${y}` +
    ` L ${x + w - r} ${y}` +
    ` Q ${x + w} ${y} ${x + w} ${y + r}` +
    ` L ${x + w} ${baseY} Z`
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', flex: 1, minHeight: 220 },
  center: { alignItems: 'center', justifyContent: 'center' },
  empty: { color: premiumTheme.text.muted, fontSize: 14, fontWeight: '600' },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(10, 17, 36, 0.92)',
    borderWidth: 1,
    borderColor: premiumTheme.glass.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tooltipValue: {
    color: premiumTheme.text.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  tooltipLabel: {
    color: premiumTheme.text.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
});

export default function PremiumChart({
  data,
  timespan,
  loading = false,
  height = 320,
}: PremiumChartProps) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(e.nativeEvent.layout.width);

  const values = data?.datasets?.[0]?.data ?? [];
  const labels = data?.labels ?? [];
  const isArea = timespan === 'hourly';
  const unit = isArea ? 'W' : 'kWh';
  const accent = isArea ? premiumTheme.energy : premiumTheme.solar;

  if (loading) {
    return (
      <View style={[styles.wrap, styles.center, { height }]}>
        <ActivityIndicator color={premiumTheme.solar.light} size="large" />
      </View>
    );
  }

  if (!values.length || values.every((v) => v === 0)) {
    return (
      <View style={[styles.wrap, styles.center, { height }]} onLayout={onLayout}>
        <Text style={styles.empty}>No production data for this period</Text>
      </View>
    );
  }

  if (width === 0) {
    return <View style={[styles.wrap, { height }]} onLayout={onLayout} />;
  }

  const innerW = Math.max(10, width - PAD.left - PAD.right);
  const innerH = Math.max(10, height - PAD.top - PAD.bottom);
  const baseY = PAD.top + innerH;
  const n = values.length;
  const max = Math.max(...values);
  const yMax = max > 0 ? max * 1.15 : 1;

  const peakIndex = values.indexOf(max);

  // Gridlines
  const gridCount = 4;
  const grids = Array.from({ length: gridCount + 1 }, (_, i) => {
    const frac = i / gridCount;
    return { y: PAD.top + innerH * frac, value: yMax * (1 - frac) };
  });

  // X label thinning
  const maxLabels = Math.max(4, Math.floor(innerW / 58));
  const labelStep = Math.max(1, Math.ceil(n / maxLabels));

  const xFor = (i: number) =>
    n === 1 ? PAD.left + innerW / 2 : PAD.left + (i / (n - 1)) * innerW;
  const yFor = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

  // Tooltip geometry
  let tipLeft = 0;
  let tipTop = 0;
  if (active !== null) {
    const cx = isArea
      ? xFor(active)
      : PAD.left + (innerW / n) * (active + 0.5);
    tipLeft = Math.min(Math.max(cx - 52, 4), width - 108);
    tipTop = Math.max(yFor(values[active]) - 64, 2);
  }

  return (
    <View style={[styles.wrap, { height }]} onLayout={onLayout}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={accent.light} stopOpacity={0.55} />
            <Stop offset="0.55" stopColor={accent.main} stopOpacity={0.18} />
            <Stop offset="1" stopColor={accent.main} stopOpacity={0} />
          </SvgGradient>
          <SvgGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={premiumTheme.energy.light} />
            <Stop offset="1" stopColor={premiumTheme.accent.light} />
          </SvgGradient>
          <SvgGradient id="barPeak" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={premiumTheme.solar.light} />
            <Stop offset="1" stopColor={premiumTheme.solar.main} />
          </SvgGradient>
          <SvgGradient id="barNormal" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={premiumTheme.accent.light} stopOpacity={0.95} />
            <Stop offset="1" stopColor={premiumTheme.accent.main} stopOpacity={0.65} />
          </SvgGradient>
        </Defs>

        {/* Gridlines + Y labels */}
        {grids.map((g, i) => (
          <G key={`grid-${i}`}>
            <Line
              x1={PAD.left}
              y1={g.y}
              x2={PAD.left + innerW}
              y2={g.y}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
            />
            <SvgText
              x={PAD.left - 10}
              y={g.y + 4}
              fill={premiumTheme.text.muted}
              fontSize={12}
              fontWeight="600"
              fontFamily={CHART_FONT}
              textAnchor="end"
            >
              {formatNum(g.value)}
            </SvgText>
          </G>
        ))}

        {/* X labels */}
        {labels.map((label, i) =>
          i % labelStep === 0 || i === n - 1 ? (
            <SvgText
              key={`xl-${i}`}
              x={
                isArea ? xFor(i) : PAD.left + (innerW / n) * (i + 0.5)
              }
              y={height - 10}
              fill={premiumTheme.text.muted}
              fontSize={12}
              fontWeight="600"
              fontFamily={CHART_FONT}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          ) : null
        )}

        {isArea ? (
          <AreaSeries
            values={values}
            xFor={xFor}
            yFor={yFor}
            baseY={baseY}
            peakIndex={peakIndex}
            active={active}
          />
        ) : (
          <BarSeries
            values={values}
            innerW={innerW}
            baseY={baseY}
            yFor={yFor}
            peakIndex={peakIndex}
            active={active}
          />
        )}
      </Svg>

      {/* Interaction overlay: hover on web, tap on native */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onHoverOut={() => setActive(null)}
      >
        {values.map((_, i) => {
          const slotW = isArea ? innerW / Math.max(1, n - 1) : innerW / n;
          const zoneX = isArea
            ? xFor(i) - slotW / 2
            : PAD.left + (innerW / n) * i;
          return (
            <Pressable
              key={`touch-${i}`}
              onHoverIn={() => setActive(i)}
              onPressIn={() => setActive(i)}
              style={{
                position: 'absolute',
                left: Math.max(PAD.left, zoneX),
                top: PAD.top,
                width: slotW,
                height: innerH,
              }}
            />
          );
        })}
      </Pressable>

      {active !== null && (
        <View
          style={[styles.tooltip, { left: tipLeft, top: tipTop }]}
          pointerEvents="none"
        >
          <Text style={styles.tooltipValue}>
            {formatNum(values[active])} {unit}
          </Text>
          <Text style={styles.tooltipLabel}>{labels[active]}</Text>
        </View>
      )}
    </View>
  );
}

function AreaSeries({
  values,
  xFor,
  yFor,
  baseY,
  peakIndex,
  active,
}: {
  values: number[];
  xFor: (i: number) => number;
  yFor: (v: number) => number;
  baseY: number;
  peakIndex: number;
  active: number | null;
}) {
  const points: Pt[] = values.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;
  const px = xFor(peakIndex);
  const py = yFor(values[peakIndex]);

  return (
    <G>
      <Path d={area} fill="url(#areaFill)" />
      {/* Glow underlay */}
      <Path
        d={line}
        fill="none"
        stroke={premiumTheme.energy.main}
        strokeWidth={7}
        strokeOpacity={0.18}
        strokeLinecap="round"
      />
      <Path
        d={line}
        fill="none"
        stroke="url(#lineStroke)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Peak marker */}
      <Circle cx={px} cy={py} r={9} fill={premiumTheme.solar.main} opacity={0.18} />
      <Circle cx={px} cy={py} r={4.5} fill={premiumTheme.solar.light} stroke="#0a1124" strokeWidth={2} />
      {/* Active marker */}
      {active !== null && active !== peakIndex && (
        <Circle
          cx={xFor(active)}
          cy={yFor(values[active])}
          r={5}
          fill={premiumTheme.energy.light}
          stroke="#0a1124"
          strokeWidth={2}
        />
      )}
    </G>
  );
}

function BarSeries({
  values,
  innerW,
  baseY,
  yFor,
  peakIndex,
  active,
}: {
  values: number[];
  innerW: number;
  baseY: number;
  yFor: (v: number) => number;
  peakIndex: number;
  active: number | null;
}) {
  const n = values.length;
  const slot = innerW / n;
  const gapRatio = n > 24 ? 0.34 : n > 12 ? 0.42 : 0.5;
  const barW = slot * (1 - gapRatio);
  const offset = (slot - barW) / 2;

  return (
    <G>
      {values.map((v, i) => {
        const x = PAD.left + slot * i + offset;
        const y = yFor(v);
        const isPeak = i === peakIndex && v > 0;
        const isActive = i === active;
        const fill = isPeak ? 'url(#barPeak)' : 'url(#barNormal)';
        return (
          <Path
            key={`bar-${i}`}
            d={roundedBarPath(x, y, barW, baseY, 6)}
            fill={fill}
            opacity={isActive || active === null || isPeak ? 1 : 0.55}
          />
        );
      })}
    </G>
  );
}

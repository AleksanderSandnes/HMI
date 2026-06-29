import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
  ActivityIndicator,
  PanResponder,
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
import { theme } from '../../theme/theme';

const CHART_FONT = Platform.select({
  web: "'Inter', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif",
  default: undefined,
});

export interface LineSeries {
  data: number[];
  color: string;
  label: string;
}

interface WeatherChartProps {
  labels: string[];
  series: LineSeries[];
  unit?: string;
  loading?: boolean;
  height?: number;
  emptyText?: string;
}

interface Pt {
  x: number;
  y: number;
}

const PAD = { top: 22, right: 18, bottom: 30, left: 54 };

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

function fmt(v: number, range: number): string {
  if (Math.abs(v) >= 1000) {
    return range >= 100 ? `${Math.round(v)}` : `${(v / 1000).toFixed(1)}k`;
  }
  if (range >= 20) return `${Math.round(v)}`;
  if (range >= 2) return `${Math.round(v * 10) / 10}`;
  return `${Math.round(v * 100) / 100}`;
}

const styles = StyleSheet.create({
  wrap: { width: '100%', flex: 1, minHeight: 220 },
  center: { alignItems: 'center', justifyContent: 'center' },
  empty: { color: theme.text.muted, fontSize: 14, fontWeight: '600' },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(10, 17, 36, 0.94)',
    borderWidth: 1,
    borderColor: theme.glass.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 120,
  },
  tooltipLabel: {
    color: theme.text.muted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 3,
  },
  tooltipDot: { width: 8, height: 8, borderRadius: 4 },
  tooltipName: {
    color: theme.text.secondary,
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  tooltipValue: {
    color: theme.text.primary,
    fontSize: 12.5,
    fontWeight: '800',
  },
});

export default function WeatherChart({
  labels,
  series,
  unit = '',
  loading = false,
  height = 340,
  emptyText = 'No data for this period',
}: WeatherChartProps) {
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  // Native scrub: the PanResponder is created once (before any early return)
  // and delegates to a ref holding the latest hit-testing closure.
  const scrubRef = useRef<(x: number) => void>(() => {});
  const panRef = useRef<ReturnType<typeof PanResponder.create> | null>(null);
  if (!panRef.current) {
    panRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: (_e, g) =>
        Math.abs(g.dy) >= Math.abs(g.dx),
      onPanResponderGrant: (e) => scrubRef.current(e.nativeEvent.locationX),
      onPanResponderMove: (e) => scrubRef.current(e.nativeEvent.locationX),
    });
  }
  const panResponder = panRef.current;

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(e.nativeEvent.layout.width);

  const cleanSeries = (series || []).filter((s) => s.data && s.data.length > 0);
  const n = cleanSeries[0]?.data.length ?? 0;
  const allValues = cleanSeries.flatMap((s) => s.data);

  if (loading) {
    return (
      <View style={[styles.wrap, styles.center, { height }]} onLayout={onLayout}>
        <ActivityIndicator color={theme.solar.light} size="large" />
      </View>
    );
  }

  if (!n || allValues.length === 0) {
    return (
      <View style={[styles.wrap, styles.center, { height }]} onLayout={onLayout}>
        <Text style={styles.empty}>{emptyText}</Text>
      </View>
    );
  }

  if (width === 0) {
    return <View style={[styles.wrap, { height }]} onLayout={onLayout} />;
  }

  const innerW = Math.max(10, width - PAD.left - PAD.right);
  const innerH = Math.max(10, height - PAD.top - PAD.bottom);

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  let yMin = rawMin;
  let yMax = rawMax;
  if (yMin === yMax) {
    yMax = yMin + 1;
    yMin = yMin - 1;
  }
  const span = yMax - yMin;
  const pad = span * 0.14;
  yMax += pad;
  // Anchor the baseline at 0 for non-negative metrics; otherwise pad below.
  yMin = rawMin >= 0 ? 0 : yMin - pad;

  const range = yMax - yMin || 1;
  const baseY = PAD.top + innerH;

  const xFor = (i: number) =>
    n === 1 ? PAD.left + innerW / 2 : PAD.left + (i / (n - 1)) * innerW;
  const yFor = (v: number) =>
    PAD.top + innerH - ((v - yMin) / range) * innerH;

  // Map a horizontal touch position to the nearest data index (native taps).
  const indexFromX = (x: number) => {
    const i = Math.round(((x - PAD.left) / innerW) * (n - 1));
    return Math.max(0, Math.min(n - 1, i));
  };

  // Keep the scrub closure current for the PanResponder created above.
  scrubRef.current = (x: number) => setActive(indexFromX(x));

  // Gridlines
  const gridCount = 4;
  const grids = Array.from({ length: gridCount + 1 }, (_, i) => {
    const frac = i / gridCount;
    return { y: PAD.top + innerH * frac, value: yMax - range * frac };
  });

  // X label thinning
  const maxLabels = Math.max(4, Math.floor(innerW / 64));
  const labelStep = Math.max(1, Math.ceil(n / maxLabels));
  const showDots = n <= 32;

  // Tooltip geometry
  let tipLeft = 0;
  let tipTop = 0;
  if (active !== null) {
    const cx = xFor(active);
    tipLeft = Math.min(Math.max(cx - 60, 4), width - 132);
    const topVal = Math.min(...cleanSeries.map((s) => yFor(s.data[active] ?? 0)));
    tipTop = Math.max(topVal - 18 - cleanSeries.length * 18, 2);
  }

  return (
    <View
      style={[styles.wrap, { height }]}
      onLayout={onLayout}
      {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
    >
      <Svg width={width} height={height}>
        <Defs>
          {cleanSeries.map((s, si) => (
            <SvgGradient
              key={`grad-${si}`}
              id={`lcFill-${si}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <Stop offset="0" stopColor={s.color} stopOpacity={0.32} />
              <Stop offset="0.7" stopColor={s.color} stopOpacity={0.08} />
              <Stop offset="1" stopColor={s.color} stopOpacity={0} />
            </SvgGradient>
          ))}
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
              fill={theme.text.muted}
              fontSize={11.5}
              fontWeight="600"
              fontFamily={CHART_FONT}
              textAnchor="end"
            >
              {fmt(g.value, range)}
            </SvgText>
          </G>
        ))}

        {/* X labels */}
        {labels.map((label, i) =>
          i % labelStep === 0 || i === n - 1 ? (
            <SvgText
              key={`xl-${i}`}
              x={xFor(i)}
              y={height - 10}
              fill={theme.text.muted}
              fontSize={11.5}
              fontWeight="600"
              fontFamily={CHART_FONT}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          ) : null
        )}

        {/* Series (render back-to-front so first series sits on top) */}
        {cleanSeries
          .map((s, si) => ({ s, si }))
          .reverse()
          .map(({ s, si }) => {
            const points: Pt[] = s.data.map((v, i) => ({
              x: xFor(i),
              y: yFor(v),
            }));
            const line = smoothPath(points);
            const area = `${line} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;
            return (
              <G key={`series-${si}`}>
                <Path d={area} fill={`url(#lcFill-${si})`} />
                <Path
                  d={line}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={6}
                  strokeOpacity={0.16}
                  strokeLinecap="round"
                />
                <Path
                  d={line}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {showDots &&
                  points.map((p, i) => (
                    <Circle
                      key={`d-${si}-${i}`}
                      cx={p.x}
                      cy={p.y}
                      r={2.6}
                      fill={s.color}
                      stroke="#0a1124"
                      strokeWidth={1.4}
                    />
                  ))}
              </G>
            );
          })}

        {/* Active markers */}
        {active !== null && (
          <G>
            <Line
              x1={xFor(active)}
              y1={PAD.top}
              x2={xFor(active)}
              y2={baseY}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={1}
            />
            {cleanSeries.map((s, si) => (
              <Circle
                key={`am-${si}`}
                cx={xFor(active)}
                cy={yFor(s.data[active] ?? 0)}
                r={5}
                fill={s.color}
                stroke="#0a1124"
                strokeWidth={2}
              />
            ))}
          </G>
        )}
      </Svg>

      {/* Interaction overlay (web only). Hover zones drive the tooltip. On
          native this is omitted and the chart is non-interactive (see the
          wrapper's pointerEvents) so the parent ScrollView can scroll. */}
      {Platform.OS === 'web' && (
        <Pressable style={StyleSheet.absoluteFill} onHoverOut={() => setActive(null)}>
          {Array.from({ length: n }).map((_, i) => {
            const slotW = innerW / Math.max(1, n - 1);
            const zoneX = xFor(i) - slotW / 2;
            return (
              <Pressable
                key={`touch-${i}`}
                onHoverIn={() => setActive(i)}
                onPressIn={() => setActive(i)}
                style={{
                  position: 'absolute',
                  left: Math.max(PAD.left - slotW / 2, zoneX),
                  top: PAD.top,
                  width: slotW,
                  height: innerH,
                }}
              />
            );
          })}
        </Pressable>
      )}

      {/* Native touch handling is provided by the wrapper's PanResponder
          (scrub to move the tooltip); no per-point overlay is needed. */}

      {active !== null && (
        <View style={[styles.tooltip, { left: tipLeft, top: tipTop }]} pointerEvents="none">
          <Text style={styles.tooltipLabel}>{labels[active]}</Text>
          {cleanSeries.map((s, si) => (
            <View key={`tr-${si}`} style={styles.tooltipRow}>
              <View style={[styles.tooltipDot, { backgroundColor: s.color }]} />
              <Text style={styles.tooltipName} numberOfLines={1}>
                {s.label}
              </Text>
              <Text style={styles.tooltipValue}>
                {fmt(s.data[active] ?? 0, range)}
                {unit ? ` ${unit}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

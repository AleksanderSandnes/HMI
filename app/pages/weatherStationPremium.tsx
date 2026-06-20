import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

import GlassCard from '../components/premium/GlassCard';
import StatTile from '../components/premium/StatTile';
import SegmentedControl from '../components/premium/SegmentedControl';
import PremiumDateSelector from '../components/premium/PremiumDateSelector';
import PremiumLineChart, {
  LineSeries,
} from '../components/premium/PremiumLineChart';
import { premiumTheme, type GradientColors } from '../theme/premiumTheme';

import useCurrentWeatherData from '../hooks/useCurrentWeatherData';
import { useDatePicker } from '../hooks/useDatePicker';
import useHistoricalWeatherData from '../hooks/useHistoricalWeatherData';

/* ---------- configuration ---------- */

type IconName = React.ComponentProps<typeof FontAwesome5>['name'];

interface DataTypeMeta {
  key: string;
  label: string;
  icon: IconName;
  unit: string;
  title: string;
  accent: string;
  gradient: GradientColors;
  series: { label: string; color: string }[];
}

const DATA_TYPES: DataTypeMeta[] = [
  {
    key: 'temperature',
    label: 'Temp',
    icon: 'temperature-high',
    unit: '°C',
    title: 'Temperature',
    accent: '#fb7185',
    gradient: ['#fda4af', '#fb7185', '#f43f5e'],
    series: [
      { label: 'Temperature', color: '#fb7185' },
      { label: 'Dew point', color: '#34d399' },
    ],
  },
  {
    key: 'windSpeed',
    label: 'Wind',
    icon: 'wind',
    unit: 'km/h',
    title: 'Wind',
    accent: '#60a5fa',
    gradient: ['#93c5fd', '#60a5fa', '#3b82f6'],
    series: [
      { label: 'Wind speed', color: '#60a5fa' },
      { label: 'Wind gust', color: '#fbbf24' },
    ],
  },
  {
    key: 'precip',
    label: 'Rain',
    icon: 'cloud-rain',
    unit: 'mm',
    title: 'Precipitation',
    accent: '#38bdf8',
    gradient: ['#7dd3fc', '#38bdf8', '#0ea5e9'],
    series: [
      { label: 'Accum. total', color: '#38bdf8' },
      { label: 'Rate', color: '#34d399' },
    ],
  },
  {
    key: 'pressure',
    label: 'Press',
    icon: 'tachometer-alt',
    unit: 'hPa',
    title: 'Pressure',
    accent: '#a78bfa',
    gradient: ['#c4b5fd', '#a78bfa', '#8b5cf6'],
    series: [{ label: 'Pressure', color: '#a78bfa' }],
  },
  {
    key: 'solarRadiation',
    label: 'Solar',
    icon: 'sun',
    unit: 'W/m²',
    title: 'Solar radiation',
    accent: '#fbbf24',
    gradient: ['#fde047', '#fbbf24', '#f59e0b'],
    series: [{ label: 'Solar radiation', color: '#fbbf24' }],
  },
  {
    key: 'uvIndex',
    label: 'UV',
    icon: 'radiation',
    unit: 'UV',
    title: 'UV index',
    accent: '#c084fc',
    gradient: ['#e9d5ff', '#c084fc', '#a855f7'],
    series: [{ label: 'UV index', color: '#c084fc' }],
  },
];

const TIME_OPTIONS = [
  { full: 'Hourly', short: 'Hourly', value: 'hourly' },
  { full: 'Weekly', short: 'Weekly', value: 'weekly' },
];

function num(v: number | null | undefined, digits = 1): string {
  if (v == null || isNaN(v as number)) return '—';
  const r = Math.round((v as number) * 10 ** digits) / 10 ** digits;
  return `${r}`;
}

/**
 * Apparent ("feels like") temperature in °C.
 * Uses wind chill when cold & breezy, heat index when hot & humid,
 * otherwise the actual temperature.
 */
function computeFeelsLike(
  t: number | null | undefined,
  rh: number | null | undefined,
  windKmh: number | null | undefined
): number | null {
  if (t == null || isNaN(t)) return null;
  const T = t;
  if (T <= 10 && windKmh != null && windKmh > 4.8) {
    const v = Math.pow(windKmh, 0.16);
    return 13.12 + 0.6215 * T - 11.37 * v + 0.3965 * T * v;
  }
  if (T >= 27 && rh != null) {
    const Tf = (T * 9) / 5 + 32;
    const R = rh;
    const hi =
      -42.379 +
      2.04901523 * Tf +
      10.14333127 * R -
      0.22475541 * Tf * R -
      0.00683783 * Tf * Tf -
      0.05481717 * R * R +
      0.00122874 * Tf * Tf * R +
      0.00085282 * Tf * R * R -
      0.00000199 * Tf * Tf * R * R;
    return ((hi - 32) * 5) / 9;
  }
  return T;
}

interface SeriesStats {
  high: number;
  low: number;
  avg: number;
  highLabel: string;
  lowLabel: string;
}

/* ---------- page ---------- */

export default function WeatherStationPremium(): React.ReactElement {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 1024;
  const isDesktop = width > 1024;
  const isWide = width >= 1600;
  const contentMaxWidth = width >= 2200 ? 1920 : width >= 1600 ? 1680 : 1480;

  // On desktop the whole dashboard should fit within the viewport without
  // scrolling. Size the chart from the available height, leaving room for the
  // header, KPI tiles, chart chrome and the summary strip.
  const desktopChartHeight = Math.max(
    280,
    Math.min(isWide ? 480 : 430, height - 560)
  );
  const chartHeight = isMobile
    ? 400
    : isTablet
    ? 340
    : desktopChartHeight;

  const {
    neighborhood,
    countryName,
    currentTemp,
    currentWindSpeed,
    currentWindGust,
    currentHumidity,
  } = useCurrentWeatherData();

  const { pickerDate, formattedPickerDate, onConfirm } = useDatePicker();

  const [timespan, setTimespan] = useState('hourly');

  const { weatherData, dataType, setDataType } = useHistoricalWeatherData(
    formattedPickerDate,
    timespan
  );

  const handleDateChange = useCallback(
    (iso: string) => {
      onConfirm({ date: new Date(iso) });
    },
    [onConfirm]
  );

  const meta =
    DATA_TYPES.find((d) => d.key === dataType) ?? DATA_TYPES[0];

  const series: LineSeries[] = useMemo(() => {
    const ds = weatherData?.datasets ?? [];
    return ds.map((d, i) => ({
      data: d.data ?? [],
      color: meta.series[i]?.color ?? meta.accent,
      label: meta.series[i]?.label ?? `Series ${i + 1}`,
    }));
  }, [weatherData, meta]);

  const labels = weatherData?.labels ?? [];
  const selectedISO = pickerDate.toISOString().split('T')[0];

  const feelsLike = computeFeelsLike(
    currentTemp,
    currentHumidity,
    currentWindSpeed
  );

  const stats: SeriesStats | null = useMemo(() => {
    const primary = series[0]?.data ?? [];
    const valid = primary
      .map((v, i) => ({ v, i }))
      .filter((p) => p.v != null && !isNaN(p.v));
    if (valid.length === 0) return null;
    let hi = valid[0];
    let lo = valid[0];
    let sum = 0;
    for (const p of valid) {
      if (p.v > hi.v) hi = p;
      if (p.v < lo.v) lo = p;
      sum += p.v;
    }
    return {
      high: hi.v,
      low: lo.v,
      avg: sum / valid.length,
      highLabel: labels[hi.i] ?? '',
      lowLabel: labels[lo.i] ?? '',
    };
  }, [series, labels]);

  const statsUnit = meta.unit === 'UV' ? '' : meta.unit;
  const dateLabel = pickerDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  /* ---------- content blocks ---------- */

  const LocationChip = (
    <GlassCard style={styles.chip}>
      <View style={styles.chipIcon}>
        <FontAwesome5 name="cloud-sun" size={13} color={premiumTheme.solar.light} solid />
      </View>
      <Text style={styles.chipText}>
        {neighborhood ? `${neighborhood}, ${countryName || ''}`.replace(/, $/, '') : 'Loading…'}
      </Text>
    </GlassCard>
  );

  const tiles = [
    <StatTile
      key="temp"
      icon="temperature-high"
      gradient={['#fda4af', '#fb7185', '#f43f5e']}
      label="Temperature"
      value={num(currentTemp)}
      unit="°C"
      sublabel={feelsLike != null ? `Feels like ${num(feelsLike)}°C` : 'Now'}
    />,
    <StatTile
      key="wind"
      icon="wind"
      gradient={['#93c5fd', '#60a5fa', '#3b82f6']}
      label="Wind speed"
      value={num(currentWindSpeed)}
      unit="km/h"
      sublabel="Sustained"
    />,
    <StatTile
      key="gust"
      icon="flag"
      gradient={['#fdba74', '#fb923c', '#f97316']}
      label="Wind gust"
      value={num(currentWindGust)}
      unit="km/h"
      sublabel="Peak"
    />,
    <StatTile
      key="humidity"
      icon="tint"
      gradient={premiumTheme.energy.gradient}
      label="Humidity"
      value={num(currentHumidity, 0)}
      unit="%"
      sublabel="Relative"
    />,
  ];

  const TileGrid = (
    <View style={styles.tileGrid}>
      {tiles.map((tile, i) => (
        <View key={i} style={styles.tileGridItem}>
          {tile}
        </View>
      ))}
    </View>
  );

  const Legend = (
    <View style={styles.legendRow}>
      {meta.series.map((s) => (
        <View key={s.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: s.color }]} />
          <Text style={styles.legendText}>{s.label}</Text>
        </View>
      ))}
    </View>
  );

  const ChartCard = (
    <GlassCard strong elevated style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.chartTitle}>Weather Analytics</Text>
          <Text style={styles.chartSub}>
            {meta.title} · {timespan === 'hourly' ? 'Hourly' : 'Weekly'} · {dateLabel}
          </Text>
          {Legend}
        </View>
        {!isMobile && (
          <View style={styles.datePill}>
            <FontAwesome5
              name="calendar-day"
              size={12}
              color={premiumTheme.text.secondary}
              solid
            />
            <Text style={styles.datePillText}>{dateLabel}</Text>
          </View>
        )}
      </View>
      {stats && (
        <View style={[styles.summaryStrip, isMobile && styles.summaryStripMobile]}>
          <SummaryCell
            label="High"
            value={`${num(stats.high)}${statsUnit ? ' ' + statsUnit : ''}`}
            sub={stats.highLabel}
            color={meta.accent}
            compact={isMobile}
          />
          <View style={styles.summaryDivider} />
          <SummaryCell
            label="Average"
            value={`${num(stats.avg)}${statsUnit ? ' ' + statsUnit : ''}`}
            color={premiumTheme.text.primary}
            compact={isMobile}
          />
          <View style={styles.summaryDivider} />
          <SummaryCell
            label="Low"
            value={`${num(stats.low)}${statsUnit ? ' ' + statsUnit : ''}`}
            sub={stats.lowLabel}
            color={premiumTheme.text.secondary}
            compact={isMobile}
          />
        </View>
      )}
      <PremiumLineChart
        labels={labels}
        series={series}
        unit={meta.unit === 'UV' ? '' : meta.unit}
        height={chartHeight}
        emptyText="No data for this period"
      />
    </GlassCard>
  );

  const DataTypeGrid = (
    <GlassCard strong style={styles.controlsCard}>
      <Text style={styles.controlsLabel}>Data type</Text>
      <View style={styles.typeGrid}>
        {DATA_TYPES.map((t) => {
          const activeType = t.key === dataType;
          return (
            <Pressable
              key={t.key}
              style={[styles.typeBtn, activeType && styles.typeBtnActive]}
              onPress={() => setDataType(t.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: activeType }}
            >
              {activeType ? (
                <LinearGradient
                  colors={t.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.typeIcon}
                >
                  <FontAwesome5 name={t.icon} size={15} color="#0a1124" solid />
                </LinearGradient>
              ) : (
                <View style={[styles.typeIcon, styles.typeIconIdle]}>
                  <FontAwesome5
                    name={t.icon}
                    size={15}
                    color={premiumTheme.text.secondary}
                    solid
                  />
                </View>
              )}
              <Text
                style={[styles.typeLabel, activeType && { color: t.accent }]}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );

  const Controls = (
    <View style={{ gap: premiumTheme.space.md }}>
      <PremiumDateSelector
        selectedDate={selectedISO}
        onDateSelect={handleDateChange}
      />
      <GlassCard strong style={styles.controlsCard}>
        <Text style={styles.controlsLabel}>Time range</Text>
        <SegmentedControl
          value={timespan}
          onChange={setTimespan}
          options={TIME_OPTIONS}
        />
      </GlassCard>
      {DataTypeGrid}
    </View>
  );

  const Header = (
    <View style={[styles.header, isMobile && styles.headerMobile]}>
      <View style={isMobile ? { alignItems: 'center' } : undefined}>
        <Text style={[styles.title, isWide && styles.titleWide]}>Weather Station</Text>
        <Text style={[styles.subtitle, isWide && styles.subtitleWide]}>
          Real-time weather monitoring and analytics
        </Text>
      </View>
      <View style={[styles.chipRow, isMobile && { marginTop: 14 }]}>
        {LocationChip}
      </View>
    </View>
  );

  /* ---------- layout ---------- */

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={premiumTheme.bg.gradient} style={StyleSheet.absoluteFill} />
      <Blob color={premiumTheme.bg.glowEnergy} top={-120} right={-100} size={360} />
      <Blob color={premiumTheme.bg.glowViolet} bottom={-140} left={-120} size={380} />
      <Blob color={premiumTheme.bg.glowSolar} top={220} left={width * 0.4} size={300} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: (Platform.OS === 'web' ? 28 : 14) + insets.top,
            paddingBottom: 36 + insets.bottom,
            paddingLeft:
              (isMobile ? 16 : isTablet ? 24 : isWide ? 48 : 32) + insets.left,
            paddingRight:
              (isMobile ? 16 : isTablet ? 24 : isWide ? 48 : 32) + insets.right,
            maxWidth: contentMaxWidth + insets.left + insets.right,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {Header}

        {isDesktop && (
          <>
            <View style={styles.tileRow}>{tiles}</View>
            <View style={styles.mainRow}>
              <View style={{ flex: 2.6 }}>{ChartCard}</View>
              <View style={{ flex: 1, minWidth: 320 }}>{Controls}</View>
            </View>
          </>
        )}

        {isTablet && (
          <>
            {TileGrid}
            {Controls}
            {ChartCard}
          </>
        )}

        {isMobile && (
          <>
            {Controls}
            {ChartCard}
            {TileGrid}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryCell({
  label,
  value,
  sub,
  color,
  compact,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  compact?: boolean;
}) {
  return (
    <View style={styles.summaryCell}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[styles.summaryValue, compact && styles.summaryValueCompact, { color }]}
        numberOfLines={1}
      >
        {value}
      </Text>
      {sub ? (
        <Text style={styles.summarySub} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

function Blob({
  color,
  size,
  top,
  bottom,
  left,
  right,
}: {
  color: string;
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          bottom,
          left,
          right,
          opacity: 0.9,
        },
        Platform.OS === 'web'
          ? ({ filter: `blur(90px)` } as object)
          : { opacity: 0.35 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: premiumTheme.bg.base },
  scroll: {
    gap: premiumTheme.space.lg,
    width: '100%',
    alignSelf: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerMobile: { flexDirection: 'column', alignItems: 'center' },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: premiumTheme.text.primary,
    letterSpacing: -0.8,
  },
  titleWide: { fontSize: 38, letterSpacing: -1 },
  subtitle: {
    fontSize: 14.5,
    color: premiumTheme.text.muted,
    marginTop: 4,
    fontWeight: '500',
  },
  subtitleWide: { fontSize: 16.5, marginTop: 6 },

  chipRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: premiumTheme.radius.pill,
  },
  chipIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: Platform.OS === 'web' ? 1.5 : 0 }],
  },
  chipText: {
    color: premiumTheme.text.secondary,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
  },

  tileRow: { flexDirection: 'row', gap: premiumTheme.space.md },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: premiumTheme.space.md,
  },
  tileGridItem: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: 150,
    flexDirection: 'row',
  },

  mainRow: {
    flexDirection: 'row',
    gap: premiumTheme.space.lg,
    alignItems: 'flex-start',
  },

  chartCard: { padding: 22 },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: premiumTheme.text.primary,
  },
  chartSub: {
    fontSize: 13,
    color: premiumTheme.text.muted,
    marginTop: 3,
    fontWeight: '500',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: premiumTheme.text.secondary,
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: premiumTheme.glass.fillSubtle,
    borderWidth: 1,
    borderColor: premiumTheme.glass.border,
    borderRadius: premiumTheme.radius.md,
    paddingVertical: 11,
    paddingHorizontal: 6,
    marginTop: 14,
    marginBottom: 2,
  },
  summaryStripMobile: {
    paddingVertical: 8,
    marginTop: 10,
  },
  summaryCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 6,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: premiumTheme.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  summaryValueCompact: { fontSize: 16 },
  summarySub: {
    fontSize: 11,
    color: premiumTheme.text.muted,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: premiumTheme.glass.border,
    marginVertical: 4,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: premiumTheme.radius.pill,
    backgroundColor: premiumTheme.glass.fillStrong,
    borderWidth: 1,
    borderColor: premiumTheme.glass.border,
  },
  datePillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: premiumTheme.text.secondary,
  },

  controlsCard: { padding: 18 },
  controlsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: premiumTheme.text.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeBtn: {
    flexGrow: 1,
    flexBasis: '28%',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: premiumTheme.radius.md,
    backgroundColor: premiumTheme.glass.fill,
    borderWidth: 1,
    borderColor: premiumTheme.glass.border,
    gap: 9,
  },
  typeBtnActive: {
    backgroundColor: premiumTheme.glass.fillStrong,
    borderColor: premiumTheme.glass.borderStrong,
  },
  typeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconIdle: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: premiumTheme.glass.border,
  },
  typeLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: premiumTheme.text.secondary,
  },
});

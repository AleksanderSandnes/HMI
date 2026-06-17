import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

import GlassCard from '../components/premium/GlassCard';
import StatTile from '../components/premium/StatTile';
import SegmentedControl from '../components/premium/SegmentedControl';
import PremiumDateSelector from '../components/premium/PremiumDateSelector';
import PremiumChart from '../components/premium/PremiumChart';

import { fetchSolarData as fetchSolarDataFromService } from '../services/dataService';
import useCurrentWeatherData from '../hooks/useCurrentWeatherData';
import { premiumTheme } from '../theme/premiumTheme';

const CO2_PER_KWH = 0.4; // kg CO₂ avoided per kWh of solar (grid average)

type ChartData = {
  labels: string[];
  datasets: { data: number[] }[];
};

const toISO = (d: Date) => d.toISOString().split('T')[0];

function previousPeriodDate(timespan: string, dateStr: string): string {
  const d = new Date(dateStr);
  switch (timespan) {
    case 'hourly':
      d.setDate(d.getDate() - 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() - 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() - 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() - 1);
      break;
  }
  return toISO(d);
}

function periodLabel(timespan: string): string {
  return timespan === 'hourly'
    ? 'Today'
    : timespan === 'weekly'
      ? 'This week'
      : timespan === 'monthly'
        ? 'This month'
        : 'This year';
}

function comparisonLabel(timespan: string): string {
  return timespan === 'hourly'
    ? 'vs yesterday'
    : timespan === 'weekly'
      ? 'vs last week'
      : timespan === 'monthly'
        ? 'vs last month'
        : 'vs last year';
}

function chartSubtitle(timespan: string, dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleString('en-US', { month: 'long' });
  if (timespan === 'hourly')
    return `Power output · ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  if (timespan === 'weekly') return `7-day output from ${month} ${d.getDate()}`;
  if (timespan === 'monthly') return `Daily output · ${month} ${d.getFullYear()}`;
  return `Monthly output · ${d.getFullYear()}`;
}

function formatCO2(kg: number): { value: string; unit: string } {
  if (kg >= 1000) return { value: (kg / 1000).toFixed(2), unit: 't' };
  return { value: kg.toFixed(kg < 10 ? 1 : 0), unit: 'kg' };
}

function formatPeak(v: number): string {
  if (v >= 1000) return (v / 1000).toFixed(1);
  return v.toFixed(v < 10 ? 1 : 0);
}

const DAY_NAMES: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

const MONTH_NAMES: Record<string, string> = {
  Jan: 'January',
  Feb: 'February',
  Mar: 'March',
  Apr: 'April',
  May: 'May',
  Jun: 'June',
  Jul: 'July',
  Aug: 'August',
  Sep: 'September',
  Oct: 'October',
  Nov: 'November',
  Dec: 'December',
};

/** Human-friendly "when" for the peak-output tile. */
function peakSublabel(timespan: string, label: string): string {
  if (!label) return 'No data';
  if (timespan === 'hourly') return `at ${label}`;
  if (timespan === 'weekly') return `on ${DAY_NAMES[label] ?? label}`;
  if (timespan === 'monthly') return `on day ${label}`;
  return `in ${MONTH_NAMES[label] ?? label}`;
}

export default function GrowattPremium(): React.ReactElement {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const [data, setData] = useState<ChartData>({ labels: [], datasets: [] });
  const [timespan, setTimespan] = useState('hourly');
  const [pickerDate, setPickerDate] = useState(toISO(yesterday));
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    todayGeneration: 0,
    totalGeneration: 0,
    todayRevenue: 0,
    totalRevenue: 0,
  });
  const [genDelta, setGenDelta] = useState<number | null>(null);
  const [revDelta, setRevDelta] = useState<number | null>(null);

  const { currentTemp, neighborhood } = useCurrentWeatherData();

  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 1024;
  const isDesktop = width > 1024;
  // Large desktop / QHD (up to 2560×1440): widen the content and scale key
  // dimensions so the layout fills the screen instead of leaving huge gutters.
  const isWide = width >= 1600;
  const contentMaxWidth = width >= 2200 ? 1920 : width >= 1600 ? 1680 : 1480;

  const fetchMain = async () => {
    setIsLoading(true);
    try {
      const res = await fetchSolarDataFromService(timespan, pickerDate, isMobile);
      setData(res.chartData);
      setMetrics(res.metrics);
    } catch (e) {
      setData({ labels: [], datasets: [{ data: [] }] });
      setMetrics({
        todayGeneration: 0,
        totalGeneration: 0,
        todayRevenue: 0,
        totalRevenue: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComparison = async () => {
    try {
      const prevDate = previousPeriodDate(timespan, pickerDate);
      const res = await fetchSolarDataFromService(timespan, prevDate, isMobile);
      const prevGen = res.metrics.todayGeneration;
      const prevRev = res.metrics.todayRevenue;
      setGenDelta(
        prevGen > 0
          ? ((metrics.todayGeneration - prevGen) / prevGen) * 100
          : null
      );
      setRevDelta(
        prevRev > 0 ? ((metrics.todayRevenue - prevRev) / prevRev) * 100 : null
      );
    } catch (e) {
      setGenDelta(null);
      setRevDelta(null);
    }
  };

  useEffect(() => {
    fetchMain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerDate, timespan]);

  useEffect(() => {
    if (metrics.todayGeneration > 0 || metrics.todayRevenue > 0) {
      fetchComparison();
    } else {
      setGenDelta(null);
      setRevDelta(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics.todayGeneration, metrics.todayRevenue, timespan]);

  const peak = useMemo(() => {
    const vals = data?.datasets?.[0]?.data ?? [];
    if (!vals.length) return null;
    const max = Math.max(...vals);
    if (max <= 0) return null;
    const idx = vals.indexOf(max);
    return {
      value: max,
      label: data.labels[idx] ?? '',
      unit: timespan === 'hourly' ? 'W' : 'kWh',
    };
  }, [data, timespan]);

  const co2 = formatCO2(metrics.todayGeneration * CO2_PER_KWH);
  const pLabel = periodLabel(timespan);

  /* ---------- shared content blocks ---------- */

  const WeatherChip = (
    <GlassCard style={styles.chip}>
      <View style={styles.chipIcon}>
        <FontAwesome5 name="sun" size={13} color={premiumTheme.solar.light} solid />
      </View>
      <Text style={styles.chipText}>
        {currentTemp != null
          ? `${Math.round(currentTemp)}° · ${neighborhood || 'Sandnes'}`
          : 'Loading…'}
      </Text>
    </GlassCard>
  );

  const tiles = [
    <StatTile
      key="gen"
      icon="bolt"
      gradient={premiumTheme.energy.gradient}
      label="Generation"
      value={metrics.todayGeneration.toFixed(1)}
      unit="kWh"
      sublabel={genDelta != null ? comparisonLabel(timespan) : pLabel}
      delta={genDelta}
      loading={isLoading}
    />,
    <StatTile
      key="rev"
      icon="coins"
      gradient={premiumTheme.revenue.gradient}
      label="Revenue"
      value={metrics.todayRevenue.toFixed(0)}
      unit="kr"
      sublabel={revDelta != null ? comparisonLabel(timespan) : pLabel}
      delta={revDelta}
      loading={isLoading}
    />,
    <StatTile
      key="co2"
      icon="leaf"
      gradient={['#86efac', '#4ade80', '#16a34a']}
      label="CO₂ avoided"
      value={co2.value}
      unit={co2.unit}
      sublabel="vs grid electricity"
      loading={isLoading}
    />,
    <StatTile
      key="peak"
      icon="mountain"
      gradient={premiumTheme.solar.gradient}
      label="Peak output"
      value={peak ? formatPeak(peak.value) : '—'}
      unit={peak?.unit}
      sublabel={peak ? peakSublabel(timespan, peak.label) : 'No data'}
      loading={isLoading}
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

  const ChartCard = (
    <GlassCard strong elevated style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.chartTitle}>Power Generation</Text>
          <Text style={styles.chartSub}>{chartSubtitle(timespan, pickerDate)}</Text>
        </View>
        {!isMobile && (
          <View style={styles.datePill}>
            <FontAwesome5
              name="calendar-day"
              size={12}
              color={premiumTheme.text.secondary}
              solid
            />
            <Text style={styles.datePillText}>
              {new Date(pickerDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        )}
      </View>
      <PremiumChart
        data={data}
        timespan={timespan}
        loading={isLoading}
        height={isMobile ? 280 : isTablet ? 340 : isWide ? 440 : 380}
      />
    </GlassCard>
  );

  const Controls = (
    <View style={{ gap: premiumTheme.space.md }}>
      <GlassCard strong style={styles.controlsCard}>
        <Text style={styles.controlsLabel}>Time range</Text>
        <SegmentedControl value={timespan} onChange={setTimespan} />
      </GlassCard>
      <PremiumDateSelector
        selectedDate={pickerDate}
        onDateSelect={setPickerDate}
        disabled={isLoading}
      />
    </View>
  );

  const Header = (
    <View style={[styles.header, isMobile && styles.headerMobile]}>
      <View style={isMobile ? { alignItems: 'center' } : undefined}>
        <Text style={[styles.title, isWide && styles.titleWide]}>Solar Production</Text>
        <Text style={[styles.subtitle, isWide && styles.subtitleWide]}>
          Real-time photovoltaic intelligence
        </Text>
      </View>
      <View style={[styles.chipRow, isMobile && { marginTop: 14 }]}>
        {WeatherChip}
      </View>
    </View>
  );

  /* ---------- layout ---------- */

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={premiumTheme.bg.gradient}
        style={StyleSheet.absoluteFill}
      />
      <Blob color={premiumTheme.bg.glowSolar} top={-120} right={-100} size={360} />
      <Blob color={premiumTheme.bg.glowEnergy} bottom={-140} left={-120} size={380} />
      <Blob color={premiumTheme.bg.glowViolet} top={220} left={width * 0.4} size={300} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: isMobile ? 16 : isTablet ? 24 : isWide ? 48 : 32,
            maxWidth: contentMaxWidth,
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
              <View style={{ flex: 1, minWidth: 300 }}>{Controls}</View>
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
    paddingTop: Platform.OS === 'web' ? 28 : 54,
    paddingBottom: 36,
    gap: premiumTheme.space.lg,
    maxWidth: 1480,
    width: '100%',
    alignSelf: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerMobile: {
    flexDirection: 'column',
    alignItems: 'center',
  },
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
  dot: { width: 8, height: 8, borderRadius: 4 },

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
    marginBottom: 18,
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
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: premiumTheme.radius.pill,
    backgroundColor: premiumTheme.glass.fill,
    borderWidth: 1,
    borderColor: premiumTheme.glass.border,
  },
  datePillText: {
    color: premiumTheme.text.secondary,
    fontSize: 13,
    fontWeight: '700',
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
});

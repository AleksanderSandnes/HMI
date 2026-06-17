import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSelector } from 'react-redux';
import PowerProductionChart, {
  ChartData,
} from '../components/charts/powerProductionChart';
import CombinedMetricsCard from '../components/cards/combinedMetricsCard';
import ModernDateSelector from '../components/selects/modernDateSelector';
import TimespanSelector from '../components/selects/timespanSelector';
import { fetchSolarData as fetchSolarDataFromService } from '../services/dataService';
import { selectDataMode } from '../(redux)/settingsSlice';
import { solarTheme } from '../theme/solarTheme';
import useCurrentWeatherData from '../hooks/useCurrentWeatherData';

const web = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: solarTheme.background.main,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: solarTheme.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: solarTheme.text.secondary,
    marginTop: 4,
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: solarTheme.background.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gap: 8,
  },
  weatherText: {
    color: solarTheme.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start', // This makes content align to the top
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
    height: '100%', // Key: Constrain to available height
  },
  chartContainer: {
    flex: 2.5,
    minHeight: 0, // Allow shrinking
    backgroundColor: solarTheme.background.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden', // Key: Prevent overflow
    height: '100%', // Key: Constrain to available height
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartWrapper: {
    flex: 1,
    minHeight: 500, // Like Weather Station - allows more downward expansion
    maxHeight: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: solarTheme.text.primary,
  },
  chartSubtitle: {
    fontSize: 14,
    color: solarTheme.text.secondary,
    marginTop: 4,
  },
  sidePanel: {
    flex: 1.2,
    gap: 24,
  },
  metricCard: {
    backgroundColor: solarTheme.background.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: solarTheme.text.primary,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: solarTheme.text.secondary,
    textAlign: 'center',
  },
  metricUnit: {
    fontSize: 14,
    color: solarTheme.text.tertiary,
    marginTop: 2,
  },
  controlsCard: {
    backgroundColor: solarTheme.background.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: solarTheme.text.primary,
    marginBottom: 16,
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickDateButton: {
    backgroundColor: solarTheme.background.cardLight,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 211, 204, 0.3)',
  },
  quickDateButtonActive: {
    backgroundColor: solarTheme.secondary.accent,
    borderColor: solarTheme.secondary.accent,
  },
  quickDateButtonText: {
    color: solarTheme.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  quickDateButtonTextActive: {
    color: solarTheme.text.primary,
    fontWeight: '600',
  },
  dateDisplay: {
    backgroundColor: solarTheme.background.cardLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 211, 204, 0.3)',
  },
  dateText: {
    color: solarTheme.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  controlButton: {
    backgroundColor: solarTheme.secondary.accent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  controlButtonText: {
    color: solarTheme.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  dataSourceIndicator: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 211, 204, 0.3)',
  },
  dataSourceText: {
    color: solarTheme.text.accent,
    fontSize: 12,
    fontWeight: '500',
  },
});

const mobile = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: solarTheme.background.main,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: solarTheme.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: solarTheme.text.secondary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 15,
  },
  metricCard: {
    flex: 1,
    backgroundColor: solarTheme.background.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: solarTheme.text.primary,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: solarTheme.text.secondary,
    textAlign: 'center',
  },
  metricUnit: {
    fontSize: 12,
    color: solarTheme.text.tertiary,
  },
  chartCard: {
    backgroundColor: solarTheme.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: solarTheme.text.primary,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 12,
    color: solarTheme.text.secondary,
  },
  controlsCard: {
    backgroundColor: solarTheme.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: solarTheme.text.primary,
    marginBottom: 12,
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  quickDateButton: {
    backgroundColor: solarTheme.background.cardLight,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(79, 211, 204, 0.3)',
  },
  quickDateButtonActive: {
    backgroundColor: solarTheme.secondary.accent,
    borderColor: solarTheme.secondary.accent,
  },
  quickDateButtonText: {
    color: solarTheme.text.secondary,
    fontSize: 11,
    fontWeight: '500',
  },
  quickDateButtonTextActive: {
    color: solarTheme.text.primary,
    fontWeight: '600',
  },
  dateDisplay: {
    backgroundColor: solarTheme.background.cardLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 211, 204, 0.3)',
  },
  dateText: {
    color: solarTheme.text.primary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  controlButton: {
    backgroundColor: solarTheme.secondary.accent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  controlButtonText: {
    color: solarTheme.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  dataSourceIndicator: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 211, 204, 0.3)',
    alignSelf: 'center',
  },
  dataSourceText: {
    color: solarTheme.text.accent,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  weatherInfo: {
    backgroundColor: solarTheme.background.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignSelf: 'center',
  },
  weatherText: {
    color: solarTheme.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

function Growatt(): React.ReactElement {
  const today = new Date();
  // Use yesterday as default since today might not have data yet
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const [data, setData] = useState<ChartData>({ labels: [], datasets: [] });
  const [timespan, setTimespan] = useState('hourly');
  const [pickerDate, setPickerDate] = useState(
    yesterday.toISOString().split('T')[0]
  );

  // Debug wrapper for setPickerDate
  const handleDateChange = (newDate: string) => {
    console.log(`[Growatt] Date changed from ${pickerDate} to ${newDate}`);
    setPickerDate(newDate);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'production' | 'development'>(
    'production'
  );
  const [metrics, setMetrics] = useState({
    todayGeneration: 0,
    totalGeneration: 0,
    todayRevenue: 0,
    totalRevenue: 0,
  });

  // Get current data mode from Redux
  const currentDataMode = useSelector(selectDataMode);

  // Get current weather data
  const { currentTemp, neighborhood } = useCurrentWeatherData();

  const windowWidth = useWindowDimensions();
  const isMobile = windowWidth.width <= 768;
  const fetchSolarData = async () => {
    console.log(
      `[Growatt] Starting fetchSolarData - timespan: ${timespan}, date: ${pickerDate}`
    );
    console.log(`[Growatt] Current data mode from Redux: ${currentDataMode}`);
    setIsLoading(true);
    setMetricsLoading(true);
    try {
      console.log(`[Growatt] Fetching ${timespan} data for ${pickerDate}`);

      const response = await fetchSolarDataFromService(
        timespan,
        pickerDate,
        isMobile
      );

      console.log(`[Growatt] Data fetched from ${response.source}`, {
        chartLabels: response.chartData.labels.length,
        chartData: response.chartData.datasets[0].data.length,
        metrics: response.metrics,
      });
      setDataSource(response.source);

      setData(response.chartData);
      setMetrics({
        todayGeneration: response.metrics.todayGeneration,
        totalGeneration: response.metrics.totalGeneration,
        todayRevenue: response.metrics.todayRevenue,
        totalRevenue: response.metrics.totalRevenue,
      });
    } catch (error) {
      console.error('[Growatt] Error fetching solar data:', error);

      // Keep the current data source setting (don't change it)
      // Show empty data to indicate error state
      setData({
        labels: [],
        datasets: [
          {
            data: [],
            color: () => '#ef4444',
            strokeWidth: 2,
          },
        ],
      });

      setMetrics({
        todayGeneration: 0,
        totalGeneration: 0,
        todayRevenue: 0,
        totalRevenue: 0,
      });
    } finally {
      setIsLoading(false);
      setMetricsLoading(false);
    }
  };

  const dataMode = useSelector(selectDataMode);

  useEffect(() => {
    console.log(
      `[Growatt] useEffect triggered - timespan: ${timespan}, pickerDate: ${pickerDate}`
    );
    if (
      timespan === 'hourly' ||
      timespan === 'weekly' ||
      timespan === 'monthly' ||
      timespan === 'yearly'
    ) {
      fetchSolarData();
    }
  }, [pickerDate, timespan]);

  // Separate useEffect to handle data mode changes from settings
  useEffect(() => {
    console.log(`[Growatt] Data mode changed to: ${currentDataMode}`);
    console.log(`[Growatt] Previous dataSource state: ${dataSource}`);
    // Force data refresh when data mode changes
    if (currentDataMode) {
      fetchSolarData();
    }
  }, [currentDataMode]);

  // Fetch data when the data mode changes
  useEffect(() => {
    console.log(
      `[Growatt] Data mode changed to ${dataMode}, refetching data...`
    );
    fetchSolarData();
  }, [dataMode]);

  if (isMobile) {
    return (
      <View style={mobile.container}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={mobile.header}>
          <Text style={mobile.title}>Solar Power Generation</Text>
          <Text style={mobile.subtitle}>
            {new Date(pickerDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <View style={mobile.dataSourceIndicator}>
            <Text style={mobile.dataSourceText}>
              Data:{' '}
              {currentDataMode === 'production'
                ? '🟢 Production'
                : currentDataMode === 'development'
                  ? '🟡 Development'
                  : '🔴 Error'}
            </Text>
          </View>
          <View style={mobile.weatherInfo}>
            <Text style={mobile.weatherText}>
              {currentTemp
                ? `${Math.round(currentTemp)}°C • ${neighborhood || 'Loading...'}`
                : 'Loading weather...'}
            </Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={mobile.scrollContent}>
            {/* Combined Metrics Card */}
            <CombinedMetricsCard
              powerGeneration={{
                today: metrics.todayGeneration,
                total: metrics.totalGeneration,
              }}
              revenue={{
                today: metrics.todayRevenue,
                total: metrics.totalRevenue,
              }}
              isLoading={metricsLoading}
              isMobile={true}
              timespan={timespan}
            />

            {/* Chart */}
            <View style={mobile.chartCard}>
              <View style={mobile.chartHeader}>
                <Text style={mobile.chartTitle}>Power Generation (W)</Text>
                <Text style={mobile.chartSubtitle}>
                  {timespan === 'hourly' &&
                    `Real-time output for ${new Date(pickerDate).toLocaleDateString()}`}
                  {timespan === 'weekly' &&
                    `Daily aggregated output for the last 7 days`}
                  {timespan === 'monthly' &&
                    `Monthly aggregated output for ${new Date(pickerDate).getFullYear()}`}
                  {timespan === 'yearly' &&
                    `Yearly aggregated output for the last 5 years`}
                </Text>
              </View>
              <PowerProductionChart
                data={data}
                loading={isLoading}
                timespan={timespan}
                key={JSON.stringify(data)}
              />
            </View>

            {/* Modern Date Selector */}
            <ModernDateSelector
              selectedDate={pickerDate}
              onDateSelect={handleDateChange}
              disabled={isLoading}
            />

            {/* Time Range Selector */}
            <View style={mobile.controlsCard}>
              <Text style={mobile.controlsTitle}>Time Range</Text>
              <TimespanSelector timespan={timespan} setTimespan={setTimespan} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Desktop version
  return (
    <View style={web.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={web.header}>
        <View>
          <Text style={web.title}>Solar Power Dashboard</Text>
          <Text style={web.subtitle}>
            Real-time photovoltaic monitoring and analytics
          </Text>
          <View style={web.dataSourceIndicator}>
            <Text style={web.dataSourceText}>
              Data Source:{' '}
              {currentDataMode === 'production'
                ? '🟢 Production API'
                : currentDataMode === 'development'
                  ? '🟡 Development API'
                  : '🔴 Error Data'}
            </Text>
          </View>
        </View>
        <View style={web.weatherInfo}>
          <Text style={web.weatherText}>
            {currentTemp ? `${Math.round(currentTemp)}°C` : '--°C'}
          </Text>
          <Text style={web.weatherText}>{neighborhood || 'Loading...'}</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={web.mainContent}>
        {/* Chart Section */}
        <View style={web.chartContainer}>
          <View style={web.chartHeader}>
            <View>
              <Text style={web.chartTitle}>Power Generation</Text>
              <Text style={web.chartSubtitle}>
                {timespan === 'hourly' &&
                  `Real-time output for ${new Date(pickerDate).toLocaleDateString()}`}
                {timespan === 'weekly' &&
                  `Daily aggregated output for the last 7 days`}
                {timespan === 'monthly' &&
                  `Monthly aggregated output for ${new Date(pickerDate).getFullYear()}`}
                {timespan === 'yearly' &&
                  `Yearly aggregated output for the last 5 years`}
              </Text>
            </View>
            <View style={web.dateDisplay}>
              <Text style={web.dateText}>
                {new Date(pickerDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <View style={web.chartWrapper}>
            <PowerProductionChart
              data={data}
              loading={isLoading}
              timespan={timespan}
              key={JSON.stringify(data)}
            />
          </View>
        </View>

        {/* Side Panel */}
        <View style={web.sidePanel}>
          {/* Combined Metrics Card */}
          <CombinedMetricsCard
            powerGeneration={{
              today: metrics.todayGeneration,
              total: metrics.totalGeneration,
            }}
            revenue={{
              today: metrics.todayRevenue,
              total: metrics.totalRevenue,
            }}
            isLoading={metricsLoading}
            isMobile={false}
            timespan={timespan}
          />

          {/* Modern Date Selector */}
          <ModernDateSelector
            selectedDate={pickerDate}
            onDateSelect={handleDateChange}
            disabled={isLoading}
          />

          {/* Time Range Selector */}
          <View style={web.controlsCard}>
            <Text style={web.controlsTitle}>Time Range</Text>
            <TimespanSelector timespan={timespan} setTimespan={setTimespan} />
          </View>
        </View>
      </View>
    </View>
  );
}

export default Growatt;

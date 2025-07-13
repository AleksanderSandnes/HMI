import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSelector } from 'react-redux';
import WeatherChart from '../components/charts/weatherChart';
import ModernDateSelector from '../components/selects/modernDateSelector';
import useCurrentWeatherData from '../hooks/useCurrentWeatherData';
import { useDatePicker } from '../hooks/useDatePicker';
import useHistoricalWeatherData from '../hooks/useHistoricalWeatherData';
import { solarTheme } from '../theme/solarTheme';

const web = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: solarTheme.background.main,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  locationText: {
    color: solarTheme.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  weatherMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  weatherMetric: {
    alignItems: 'center',
  },
  weatherMetricValue: {
    color: solarTheme.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  weatherMetricLabel: {
    color: solarTheme.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  weatherIcon: {
    fontSize: 32,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12, // Reduced from 20 to move chart left
    paddingTop: 8, // Added top padding to move chart down
    paddingBottom: 20,
    gap: 20,
  },
  chartContainer: {
    flex: 3, // Reduced from 3.2 to give more space to sidebar
    backgroundColor: solarTheme.background.card,
    borderRadius: 16,
    padding: 20, // Reduced from 24 to give more space for chart
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden', // Ensure chart doesn't overflow container
  },
  chartWrapper: {
    flex: 1,
    minHeight: 450, // Increased from 400 for larger chart
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    flex: 1, // Increased from 0.9 to give more space for controls
    gap: 24,
    minWidth: 300, // Ensure minimum width for proper button layout
  },
  metricCard: {
    backgroundColor: solarTheme.background.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
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
  metricsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  controlsCard: {
    backgroundColor: solarTheme.background.card,
    borderRadius: 16,
    padding: 16, // Reduced from 20 to give more space for buttons
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    flexDirection: 'column',
    alignItems: 'stretch',
    minHeight: 'auto',
    height: 'auto',
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  controlsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: solarTheme.text.primary,
    marginBottom: 16,
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12, // Reduced from 20 to bring sections closer
    justifyContent: 'space-between',
  },
  quickDateButton: {
    backgroundColor: solarTheme.background.cardLight,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 211, 204, 0.3)',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDateButtonActive: {
    backgroundColor: solarTheme.secondary.accent,
    borderColor: solarTheme.secondary.accent,
  },
  quickDateButtonText: {
    color: solarTheme.text.secondary,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
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
  centeredDateText: {
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  compactWeatherMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
  },
  compactWeatherMetric: {
    alignItems: 'center',
    minWidth: '45%',
  },
  dataTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    // Removed marginHorizontal to prevent overflow
  },
  dataTypeButton: {
    backgroundColor: solarTheme.background.cardLight,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(79, 211, 204, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32%', // 3 per row, with 2% left for spacing
    marginBottom: 12,
    marginRight: '2%', // Except for every third button
    minHeight: 65,
  },
  dataTypeButtonActive: {
    backgroundColor: solarTheme.secondary.accent,
    borderColor: solarTheme.secondary.accent,
  },
  dataTypeIcon: {
    fontSize: 18,
    marginBottom: 6,
  },
  dataTypeButtonText: {
    color: solarTheme.text.secondary,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  dataTypeButtonTextActive: {
    color: solarTheme.text.primary,
    fontWeight: '600',
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
    paddingBottom: 30, // Increased from 20 to add more space
    alignItems: 'center',
    backgroundColor: solarTheme.background.main, // Ensure it has background
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
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  chartContainer: {
    backgroundColor: solarTheme.background.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 20,
    overflow: 'hidden', // Ensure chart doesn't overflow container
  },
  chartWrapper: {
    flex: 1,
    minHeight: 250, // Slightly smaller minimum height for mobile
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: solarTheme.text.primary,
  },
  chartSubtitle: {
    fontSize: 14,
    color: solarTheme.text.secondary,
    marginTop: 4,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: solarTheme.text.primary,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: solarTheme.text.secondary,
    textAlign: 'center',
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
    marginBottom: 16,
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  quickDateButton: {
    backgroundColor: solarTheme.background.cardLight,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 211, 204, 0.3)',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickDateButtonActive: {
    backgroundColor: solarTheme.secondary.accent,
    borderColor: solarTheme.secondary.accent,
  },
  quickDateButtonText: {
    color: solarTheme.text.secondary,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
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
  centeredDateText: {
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
    marginTop: 8,
  },
  controlButtonText: {
    color: solarTheme.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Desktop-only styles for mobile fallback
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20, // Add space below
    gap: 16,
  },
  locationText: {
    color: solarTheme.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  weatherMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  weatherMetric: {
    alignItems: 'center',
  },
  weatherMetricValue: {
    color: solarTheme.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  weatherMetricLabel: {
    color: solarTheme.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  weatherIcon: {
    fontSize: 32,
  },
  weatherText: {
    color: solarTheme.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sidePanel: {
    gap: 24,
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
  compactWeatherMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
  },
  compactWeatherMetric: {
    alignItems: 'center',
    minWidth: '45%',
  },
  dataTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginHorizontal: 0,
  },
  dataTypeButton: {
    backgroundColor: solarTheme.background.cardLight,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(79, 211, 204, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    width: '31%', // 3 per row with spacing
    minHeight: 60,
    marginBottom: 6,
    marginHorizontal: 2,
  },
  dataTypeButtonActive: {
    backgroundColor: solarTheme.secondary.accent,
    borderColor: solarTheme.secondary.accent,
  },
  dataTypeIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  dataTypeButtonText: {
    color: solarTheme.text.secondary,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  dataTypeButtonTextActive: {
    color: solarTheme.text.primary,
    fontWeight: '600',
  },
});

export default function WeatherStation() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = isMobile ? mobile : web;

  // Get current data mode from Redux
  const dataMode = useSelector(
    (state: any) => state.settings?.dataMode || 'production'
  );

  const {
    neighborhood,
    countryName,
    currentPrecipRate,
    currentTemp,
    currentWindSpeed,
    currentWindGust,
    currentHumidity,
    weatherText,
  } = useCurrentWeatherData();

  const {
    pickerDate,
    formattedPickerDate,
    open,
    onDismiss,
    onConfirm,
    openDatePicker,
  } = useDatePicker();

  const [timespan, setTimespan] = useState('daily');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { weatherData, dataType, setDataType } = useHistoricalWeatherData(
    formattedPickerDate,
    timespan
  );

  // Log current data mode for debugging
  useEffect(() => {
    console.log(`[WeatherStation] Current data mode: ${dataMode}`);
  }, [dataMode]);

  // Refresh data when data mode changes
  useEffect(() => {
    console.log(
      `[WeatherStation] Data mode changed to: ${dataMode}, refreshing data...`
    );
    setRefreshKey((prev) => prev + 1);
  }, [dataMode]);

  // Debug wrapper for setPickerDate (matching Growatt implementation)
  const handleDateChange = (newDate: string) => {
    console.log(
      `[WeatherStation] Date changed from ${pickerDate} to ${newDate} (mode: ${dataMode})`
    );
    onConfirm({ date: new Date(newDate) });
  };

  const getDataTypeLabel = () => {
    const labels: { [key: string]: string } = {
      temperature: 'Temperature',
      windSpeed: 'Wind Speed',
      windDirection: 'Wind Direction',
      precip: 'Precipitation',
      pressure: 'Pressure',
      solarRadiation: 'Solar Radiation',
      uvIndex: 'UV Index',
    };
    return labels[dataType] || 'Temperature';
  };

  const getDataModeDisplay = () => {
    const modeConfig = {
      production: { label: '🟢 Production API', color: '#10b981' },
      development: { label: '🟡 Development API', color: '#f59e0b' },
      mock: { label: '🟠 Mock Data', color: '#f97316' },
    };
    return (
      modeConfig[dataMode as keyof typeof modeConfig] || modeConfig.production
    );
  };

  const getWeatherIcon = () => {
    if (!weatherText) return '🌤️';

    const weather = weatherText.toLowerCase();
    if (
      weather.includes('rain') ||
      weather.includes('drizzle') ||
      weather.includes('shower')
    ) {
      return '🌧️';
    } else if (weather.includes('snow')) {
      return '❄️';
    } else if (weather.includes('cloud') || weather.includes('overcast')) {
      return '☁️';
    } else if (weather.includes('sun') || weather.includes('clear')) {
      return '☀️';
    } else if (weather.includes('thunder') || weather.includes('storm')) {
      return '⛈️';
    } else if (weather.includes('fog') || weather.includes('mist')) {
      return '🌫️';
    } else if (weather.includes('wind')) {
      return '💨';
    }
    return '🌤️'; // default partly cloudy
  };

  if (isMobile) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Fixed Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Weather Station</Text>
          <Text style={styles.subtitle}>
            Real-time weather monitoring and analytics
          </Text>
        </View>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mobile Weather Info - Above temperature box */}
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherIcon}>{getWeatherIcon()}</Text>
            <Text style={styles.locationText}>
              {neighborhood && countryName
                ? `${neighborhood}, ${countryName}`
                : 'Loading...'}
            </Text>
          </View>

          {/* Weather Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <View style={styles.metricIcon}>
                <Text style={{ color: solarTheme.text.primary, fontSize: 16 }}>
                  🌡️
                </Text>
              </View>
              <Text style={styles.metricValue}>{currentTemp || 0}°C</Text>
              <Text style={styles.metricLabel}>Temperature</Text>
            </View>
            <View style={styles.metricCard}>
              <View
                style={[
                  styles.metricIcon,
                  { backgroundColor: 'rgba(79, 211, 204, 0.2)' },
                ]}
              >
                <Text style={{ color: solarTheme.text.primary, fontSize: 16 }}>
                  💨
                </Text>
              </View>
              <Text style={styles.metricValue}>
                {currentWindSpeed || 0} km/h
              </Text>
              <Text style={styles.metricLabel}>Wind Speed</Text>
            </View>
          </View>

          {/* Second Row for Wind Gust and Humidity */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <View
                style={[
                  styles.metricIcon,
                  { backgroundColor: 'rgba(168, 85, 247, 0.2)' },
                ]}
              >
                <Text style={{ color: solarTheme.text.primary, fontSize: 16 }}>
                  🌪️
                </Text>
              </View>
              <Text style={styles.metricValue}>
                {currentWindGust || 0} km/h
              </Text>
              <Text style={styles.metricLabel}>Wind Gust</Text>
            </View>
            <View style={styles.metricCard}>
              <View
                style={[
                  styles.metricIcon,
                  { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
                ]}
              >
                <Text style={{ color: solarTheme.text.primary, fontSize: 16 }}>
                  💧
                </Text>
              </View>
              <Text style={styles.metricValue}>{currentHumidity || 0}%</Text>
              <Text style={styles.metricLabel}>Humidity</Text>
            </View>
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Weather Analytics</Text>
                <Text style={styles.chartSubtitle}>{getDataTypeLabel()}</Text>
              </View>
            </View>
            <View style={styles.chartWrapper}>
              <WeatherChart
                data={weatherData}
                timespan={timespan}
                key={`${JSON.stringify(weatherData)}-${refreshKey}`}
              />
            </View>
          </View>

          {/* Modern Date Selector */}
          <ModernDateSelector
            selectedDate={pickerDate.toISOString().split('T')[0]}
            onDateSelect={handleDateChange}
            disabled={isLoading}
          />

          {/* Time Range Selector */}
          <View style={styles.controlsCard}>
            <Text style={styles.controlsTitle}>Time Range</Text>
            <View style={styles.quickDateButtons}>
              {['Hourly', 'Daily', 'Weekly'].map((period) => (
                <TouchableOpacity
                  key={period.toLowerCase()}
                  style={[
                    styles.quickDateButton,
                    timespan === period.toLowerCase() &&
                      styles.quickDateButtonActive,
                  ]}
                  onPress={() => setTimespan(period.toLowerCase())}
                >
                  <Text
                    style={[
                      styles.quickDateButtonText,
                      timespan === period.toLowerCase() &&
                        styles.quickDateButtonTextActive,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Data Type Selector */}
            <Text
              style={[styles.controlsTitle, { marginTop: 8, marginBottom: 12 }]}
            >
              Data Type
            </Text>
            <View style={styles.dataTypeGrid}>
              {[
                { key: 'temperature', label: 'Temp', icon: '🌡️' },
                { key: 'windSpeed', label: 'Wind', icon: '💨' },
                { key: 'precip', label: 'Rain', icon: '🌧️' },
                { key: 'pressure', label: 'Press', icon: '🔽' },
                { key: 'solarRadiation', label: 'Solar', icon: '☀️' },
                { key: 'uvIndex', label: 'UV', icon: '🟣' },
              ].map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.dataTypeButton,
                    dataType === type.key && styles.dataTypeButtonActive,
                  ]}
                  onPress={() => setDataType(type.key)}
                >
                  <Text style={styles.dataTypeIcon}>{type.icon}</Text>
                  <Text
                    style={[
                      styles.dataTypeButtonText,
                      dataType === type.key && styles.dataTypeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Desktop version
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Weather Station</Text>
          <Text style={styles.subtitle}>
            Real-time weather monitoring and analytics
          </Text>
          <View style={styles.dataSourceIndicator}>
            <Text style={styles.dataSourceText}>
              Data Source: {getDataModeDisplay().label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Chart Section */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Weather Analytics</Text>
              <Text style={styles.chartSubtitle}>{getDataTypeLabel()}</Text>
            </View>
          </View>
          <View style={styles.chartWrapper}>
            <WeatherChart
              data={weatherData}
              timespan={timespan}
              key={`${JSON.stringify(weatherData)}-${refreshKey}`}
            />
          </View>
        </View>

        {/* Side Panel */}
        <View style={styles.sidePanel}>
          {/* Compact Weather Info */}
          <View style={styles.metricCard}>
            {/* Location and Icon Row */}
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherIcon}>{getWeatherIcon()}</Text>
              <Text style={styles.locationText}>
                {neighborhood && countryName
                  ? `${neighborhood}, ${countryName}`
                  : 'Loading...'}
              </Text>
            </View>

            {/* Weather Metrics Grid */}
            <View style={styles.compactWeatherMetrics}>
              <View style={styles.compactWeatherMetric}>
                <Text style={styles.weatherMetricValue}>
                  {currentTemp || 0}°C
                </Text>
                <Text style={styles.weatherMetricLabel}>Temperature</Text>
              </View>
              <View style={styles.compactWeatherMetric}>
                <Text style={styles.weatherMetricValue}>
                  {currentWindSpeed || 0} km/h
                </Text>
                <Text style={styles.weatherMetricLabel}>Wind Speed</Text>
              </View>
              <View style={styles.compactWeatherMetric}>
                <Text style={styles.weatherMetricValue}>
                  {currentWindGust || 0} km/h
                </Text>
                <Text style={styles.weatherMetricLabel}>Wind Gust</Text>
              </View>
              <View style={styles.compactWeatherMetric}>
                <Text style={styles.weatherMetricValue}>
                  {currentHumidity || 0}%
                </Text>
                <Text style={styles.weatherMetricLabel}>Humidity</Text>
              </View>
            </View>
          </View>

          {/* Modern Date Selector */}
          <ModernDateSelector
            selectedDate={pickerDate.toISOString().split('T')[0]}
            onDateSelect={handleDateChange}
            disabled={isLoading}
          />

          {/* Time Range Selector */}
          <View style={styles.controlsCard}>
            <Text style={styles.controlsTitle}>Time Range</Text>
            <View style={styles.quickDateButtons}>
              {['Hourly', 'Daily', 'Weekly'].map((period) => (
                <TouchableOpacity
                  key={period.toLowerCase()}
                  style={[
                    styles.quickDateButton,
                    timespan === period.toLowerCase() &&
                      styles.quickDateButtonActive,
                  ]}
                  onPress={() => setTimespan(period.toLowerCase())}
                >
                  <Text
                    style={[
                      styles.quickDateButtonText,
                      timespan === period.toLowerCase() &&
                        styles.quickDateButtonTextActive,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Data Type Selector */}
            <Text
              style={[
                styles.controlsTitle,
                { marginTop: 12, marginBottom: 12 },
              ]}
            >
              Data Type
            </Text>
            <View style={styles.dataTypeGrid}>
              {[
                { key: 'temperature', label: 'Temp', icon: '🌡️' },
                { key: 'windSpeed', label: 'Wind', icon: '💨' },
                { key: 'precip', label: 'Rain', icon: '🌧️' },
                { key: 'pressure', label: 'Press', icon: '🔽' },
                { key: 'solarRadiation', label: 'Solar', icon: '☀️' },
                { key: 'uvIndex', label: 'UV', icon: '🟣' },
              ].map((type, idx) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.dataTypeButton,
                    (idx + 1) % 3 === 0 && { marginRight: 0 },
                    dataType === type.key && styles.dataTypeButtonActive,
                  ]}
                  onPress={() => setDataType(type.key)}
                >
                  <Text style={styles.dataTypeIcon}>{type.icon}</Text>
                  <Text
                    style={[
                      styles.dataTypeButtonText,
                      dataType === type.key && styles.dataTypeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

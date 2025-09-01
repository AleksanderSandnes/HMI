import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { logInfo, logError, logWarn } from '../services/graylogService';
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
import { WeatherLegend } from '../components/weather/WeatherLegend';
import useCurrentWeatherData from '../hooks/useCurrentWeatherData';
import { useDatePicker } from '../hooks/useDatePicker';
import useHistoricalWeatherData from '../hooks/useHistoricalWeatherData';
import { webStyles, mobileStyles } from '../styles/weatherStationStyles';
import {
  dataTypeConfig,
  timespanOptions,
} from '../constants/weatherStationConfig';
import {
  getWeatherIcon,
  getDataModeDisplay,
} from '../utils/weatherStationUtils';
import { solarTheme } from '../theme/solarTheme';

export default function WeatherStation() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = isMobile ? mobileStyles : webStyles;

  // Calculate available height for main content (total height minus header and tab bar)
  const availableHeight = height - (isMobile ? 140 : 110); // More accurate space calculation

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
    logInfo('Current data mode: ${dataMode}', 'WeatherStation');
  }, [dataMode]);

  // Refresh data when data mode changes
  useEffect(() => {
    logInfo(
      'Data mode changed to: ${dataMode}, refreshing data...',
      'WeatherStation'
    );
    setRefreshKey((prev) => prev + 1);
  }, [dataMode]);

  // Debug wrapper for setPickerDate (matching Growatt implementation)
  const handleDateChange = useCallback(
    (newDate: string) => {
      logInfo(
        'Date changed from ${pickerDate} to ${newDate} (mode: ${dataMode})',
        'WeatherStation'
      );
      onConfirm({ date: new Date(newDate) });
    },
    [pickerDate, dataMode, onConfirm]
  );

  // Memoize timespan change handler
  const handleTimespanChange = useCallback((newTimespan: string) => {
    setTimespan(newTimespan);
  }, []);

  // Memoize data type change handler
  const handleDataTypeChange = useCallback(
    (newDataType: string) => {
      setDataType(newDataType);
    },
    [setDataType]
  );

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
            <Text style={styles.weatherIcon}>
              {getWeatherIcon(weatherText)}
            </Text>
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
                <WeatherLegend dataType={dataType} styles={styles} />
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
              {timespanOptions.map((period) => (
                <TouchableOpacity
                  key={period.toLowerCase()}
                  style={[
                    styles.quickDateButton,
                    timespan === period.toLowerCase() &&
                      styles.quickDateButtonActive,
                  ]}
                  onPress={() => handleTimespanChange(period.toLowerCase())}
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
              {dataTypeConfig.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.dataTypeButton,
                    dataType === type.key && styles.dataTypeButtonActive,
                  ]}
                  onPress={() => handleDataTypeChange(type.key)}
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
              Data Source: {getDataModeDisplay(dataMode).label}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.mainContent, { height: availableHeight }]}>
        {/* Chart Section */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Weather Analytics</Text>
              <WeatherLegend dataType={dataType} styles={styles} />
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 12 }}
            style={{ flex: 1 }}
          >
            {/* Compact Weather Info */}
            <View style={styles.metricCard}>
              {/* Location and Icon Row */}
              <View style={styles.weatherInfo}>
                <Text style={styles.weatherIcon}>
                  {getWeatherIcon(weatherText)}
                </Text>
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
                {timespanOptions.map((period) => (
                  <TouchableOpacity
                    key={period.toLowerCase()}
                    style={[
                      styles.quickDateButton,
                      timespan === period.toLowerCase() &&
                        styles.quickDateButtonActive,
                    ]}
                    onPress={() => handleTimespanChange(period.toLowerCase())}
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
                  { marginTop: 8, marginBottom: 8 },
                ]}
              >
                Data Type
              </Text>
              <View style={styles.dataTypeGrid}>
                {dataTypeConfig.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.dataTypeButton,
                      dataType === type.key && styles.dataTypeButtonActive,
                    ]}
                    onPress={() => handleDataTypeChange(type.key)}
                  >
                    <Text style={styles.dataTypeIcon}>{type.icon}</Text>
                    <Text
                      style={[
                        styles.dataTypeButtonText,
                        dataType === type.key &&
                          styles.dataTypeButtonTextActive,
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
      </View>
    </View>
  );
}

import React, { useState, useRef, useCallback } from 'react';
import { LineChart, BarChart } from 'react-native-chart-kit';
import {
  useWindowDimensions,
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { solarTheme } from '../../theme/solarTheme';

// Chart configurations for different data modes
const modeConfigs = {
  production: {
    color: '#10b981', // Green
    strokeWidth: 3,
    fillGradient: '#10b981',
    fillGradientTo: '#34d399',
  },
  development: {
    color: '#f59e0b', // Orange
    strokeWidth: 3,
    fillGradient: '#f59e0b',
    fillGradientTo: '#fbbf24',
  },
};

const chartConfig = {
  backgroundGradientFrom: solarTheme.background.main,
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: solarTheme.background.card,
  backgroundGradientToOpacity: 0.1,
  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // green for solar
  strokeWidth: 3, // Increased stroke width for better visibility
  barPercentage: 0.7,
  fillShadowGradient: solarTheme.chart.generation,
  fillShadowGradientTo: solarTheme.chart.generation,
  fillShadowGradientFromOpacity: 0.3,
  fillShadowGradientToOpacity: 0.1,
  propsForBackgroundLines: {
    stroke: solarTheme.chart.grid,
    strokeWidth: 0.5,
    strokeDasharray: '5,5',
  },
  propsForLabels: {
    fill: solarTheme.chart.label,
    fontSize: 14, // Increased font size for better readability
    fontWeight: '600',
  },
  propsForVerticalLabels: {
    fill: solarTheme.chart.label,
    fontSize: 13, // Increased font size for Y-axis
    fontWeight: '500',
  },
  propsForHorizontalLabels: {
    fill: solarTheme.chart.label,
    fontSize: 13, // Increased font size for X-axis
    fontWeight: '500',
  },
  decimalPlaces: 0,
  formatYLabel: (value: any) => `${Math.round(value)}`,
  formatXLabel: (value: any) => value,
};

// Bar chart specific configuration for daily time range
const dailyBarChartConfig = {
  ...chartConfig,
  barPercentage: 0.6,
  fillShadowGradient: '#3b82f6',
  fillShadowGradientTo: '#60a5fa',
  fillShadowGradientFromOpacity: 0.9,
  fillShadowGradientToOpacity: 0.7,
  propsForVerticalLabels: {
    fill: solarTheme.chart.label,
    fontSize: 12,
    fontWeight: '500',
  },
  propsForHorizontalLabels: {
    fill: solarTheme.chart.label,
    fontSize: 11,
    fontWeight: '500',
  },
  propsForBackgroundLines: {
    stroke: solarTheme.chart.grid,
    strokeWidth: 0.5,
    strokeDasharray: '',
  },
  decimalPlaces: 0,
  formatYLabel: (value: any) => `${Math.round(value)}`,
  formatXLabel: (value: any) => value,
};

// Bar chart specific configuration
const barChartConfig = {
  ...chartConfig,
  barPercentage: 0.5, // More spacing between bars like Growatt
  fillShadowGradient: '#3b82f6', // Light blue similar to Growatt
  fillShadowGradientTo: '#60a5fa', // Lighter blue gradient
  fillShadowGradientFromOpacity: 0.9,
  fillShadowGradientToOpacity: 0.7,
  propsForVerticalLabels: {
    fill: solarTheme.chart.label,
    fontSize: 12, // Increased font size
    fontWeight: '500',
  },
  propsForHorizontalLabels: {
    fill: solarTheme.chart.label,
    fontSize: 12, // Increased font size
    fontWeight: '500',
  },
  propsForBackgroundLines: {
    stroke: solarTheme.chart.grid,
    strokeWidth: 0.5,
    strokeDasharray: '',
  },
  decimalPlaces: 0,
  formatYLabel: (value: any) => `${Math.round(value)}`,
  formatXLabel: (value: any) => value,
};

// Monthly chart specific configuration (to match Growatt exactly)
const monthlyChartConfig = {
  ...barChartConfig,
  barPercentage: 0.4, // Thinner bars with more space like Growatt
  fillShadowGradient: '#60a5fa', // Lighter blue to match Growatt
  fillShadowGradientTo: '#93c5fd', // Even lighter gradient
  fillShadowGradientFromOpacity: 0.85,
  fillShadowGradientToOpacity: 0.65,
  propsForVerticalLabels: {
    fill: solarTheme.chart.label,
    fontSize: 11, // Slightly smaller for monthly
    fontWeight: '500',
  },
  propsForHorizontalLabels: {
    fill: solarTheme.chart.label,
    fontSize: 11,
    fontWeight: '500',
  },
  decimalPlaces: 0,
  formatYLabel: (value: any) => `${Math.round(value)}`,
  formatXLabel: (value: any) => value,
};

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: () => string;
    strokeWidth: number;
  }[];
}

interface PowerProductionChartProps {
  data: ChartData;
  loading?: boolean;
  timespan?: string; // 'hourly', 'daily', 'weekly', 'monthly', 'yearly'
}

// Enhanced hover tooltip component
interface TooltipProps {
  visible: boolean;
  x: number;
  y: number;
  value: number;
  label: string;
  timespan: string;
  animation: Animated.Value;
  chartWidth: number;
  chartHeight: number;
}

function HoverTooltip({
  visible,
  x,
  y,
  value,
  label,
  timespan,
  animation,
  chartWidth,
  chartHeight,
}: TooltipProps) {
  if (!visible) return null;

  const getUnit = () => {
    switch (timespan) {
      case 'hourly':
      case 'daily':
        return 'W';
      default:
        return 'kWh';
    }
  };

  // Smart positioning to keep tooltip within chart bounds
  const tooltipWidth = 100;
  const tooltipHeight = 60;
  const margin = 10;

  let adjustedX = x - tooltipWidth / 2;
  let adjustedY = y - tooltipHeight - margin;

  // Keep tooltip within horizontal bounds
  if (adjustedX < margin) {
    adjustedX = margin;
  } else if (adjustedX + tooltipWidth > chartWidth - margin) {
    adjustedX = chartWidth - tooltipWidth - margin;
  }

  // Keep tooltip within vertical bounds
  if (adjustedY < margin) {
    adjustedY = y + margin; // Show below point instead
  }

  return (
    <Animated.View
      style={[
        styles.tooltip,
        {
          position: 'absolute',
          left: adjustedX,
          top: adjustedY,
          opacity: animation,
          transform: [
            {
              scale: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
            },
          ],
          zIndex: 1000,
        },
      ]}
    >
      <View style={styles.tooltipContent}>
        <Text style={styles.tooltipValue}>
          {value !== null && value !== undefined ? value.toFixed(1) : '0.0'}{' '}
          {getUnit()}
        </Text>
        <Text style={styles.tooltipLabel}>{label}</Text>
      </View>

      {/* Tooltip pointer */}
      <View
        style={[
          styles.tooltipPointer,
          {
            left: Math.max(10, Math.min(tooltipWidth - 20, x - adjustedX - 5)),
            top: adjustedY < y ? -5 : tooltipHeight - 5,
            transform: adjustedY < y ? [{ rotate: '180deg' }] : [],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  chartContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    zIndex: 10,
  },
  loadingText: {
    color: solarTheme.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    color: solarTheme.text.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
  tooltip: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 211, 204, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 100,
  },
  tooltipContent: {
    alignItems: 'center',
  },
  tooltipValue: {
    color: solarTheme.text.primary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  tooltipLabel: {
    color: solarTheme.text.secondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  tooltipPointer: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(15, 23, 42, 0.95)',
  },
  hoverCircle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default function PowerProductionChart({
  data,
  loading = false,
  timespan = 'daily',
}: PowerProductionChartProps) {
  const windowDimensions = useWindowDimensions();
  const isMobile = windowDimensions.width <= 768;
  const isWeb = Platform.OS === 'web';

  // Mobile-specific chart configuration with aggressive label reduction
  const getMobileChartConfig = () => ({
    ...chartConfig,
    propsForLabels: {
      fill: solarTheme.chart.label,
      fontSize: isMobile ? 12 : 14,
      fontWeight: '600',
    },
    propsForVerticalLabels: {
      fill: solarTheme.chart.label,
      fontSize: isMobile ? 11 : 13,
      fontWeight: '500',
    },
    propsForHorizontalLabels: {
      fill: solarTheme.chart.label,
      fontSize: isMobile ? 11 : 13,
      fontWeight: '500',
    },
    formatYLabel: (value: any) =>
      isMobile ? `${Math.round(value / 1000)}k` : `${Math.round(value)}`,
  });

  const getMobileDailyBarChartConfig = () => ({
    ...dailyBarChartConfig,
    propsForLabels: {
      fill: solarTheme.chart.label,
      fontSize: isMobile ? 12 : 14,
      fontWeight: '600',
    },
    propsForVerticalLabels: {
      fill: solarTheme.chart.label,
      fontSize: isMobile ? 11 : 13,
      fontWeight: '500',
    },
    propsForHorizontalLabels: {
      fill: solarTheme.chart.label,
      fontSize: isMobile ? 11 : 13,
      fontWeight: '500',
    },
    formatYLabel: (value: any) =>
      isMobile ? `${Math.round(value / 1000)}k` : `${Math.round(value)}`,
  });

  const getMobileBarChartConfig = () => ({
    ...barChartConfig,
    propsForLabels: {
      fill: solarTheme.chart.label,
      fontSize: isMobile ? 12 : 14,
      fontWeight: '600',
    },
    propsForVerticalLabels: {
      fill: solarTheme.chart.label,
      fontSize: isMobile ? 11 : 13,
      fontWeight: '500',
    },
    propsForHorizontalLabels: {
      fill: solarTheme.chart.label,
      fontSize: isMobile ? 11 : 13,
      fontWeight: '500',
    },
    formatYLabel: (value: any) =>
      isMobile ? `${Math.round(value)}` : `${Math.round(value)}`,
  });

  // State for hover/touch functionality
  const [hoverData, setHoverData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    value: number;
    label: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    value: 0,
    label: '',
  });

  // Animation values for smooth interactions
  const hoverAnimation = useRef(new Animated.Value(0)).current;
  const chartRef = useRef<View>(null);

  // Calculate responsive dimensions
  const containerPadding = 48; // Account for container padding
  const availableWidth = isMobile
    ? windowDimensions.width - 20
    : windowDimensions.width * 0.67 - containerPadding; // Chart container takes ~67% of width

  // Aggressive height calculation to match Weather Station expansion
  const availableHeight = isMobile
    ? Math.min(windowDimensions.height * 0.35, 300) // Mobile: 35% like Weather Station
    : windowDimensions.height * 0.75; // Desktop: 75% like Weather Station - much more aggressive!

  const chartWidth = Math.max(availableWidth, 300); // Minimum width
  const chartHeight = Math.max(availableHeight, 300); // Increased minimum height

  // Calculate data point positions for interactive features
  const calculateDataPointPosition = useCallback(
    (index: number, value: number) => {
      if (!data || !data.datasets || data.datasets.length === 0)
        return { x: 0, y: 0 };

      const dataLength = data.datasets[0].data.length;
      const chartPadding = 60; // Chart internal padding
      const dataAreaWidth = chartWidth - chartPadding * 2;
      const dataAreaHeight = chartHeight - chartPadding * 2;

      // Calculate X position
      const x =
        chartPadding + (index / Math.max(dataLength - 1, 1)) * dataAreaWidth;

      // Calculate Y position (inverted because screen coordinates)
      const maxValue = Math.max(...data.datasets[0].data);
      const minValue = Math.min(...data.datasets[0].data);
      const valueRange = maxValue - minValue || 1;
      const normalizedValue = (value - minValue) / valueRange;
      const y = chartPadding + dataAreaHeight * (1 - normalizedValue);

      return { x, y };
    },
    [data, chartWidth, chartHeight]
  );

  // Show hover tooltip
  const showHover = useCallback(
    (index: number, value: number, label: string) => {
      const position = calculateDataPointPosition(index, value);

      setHoverData({
        visible: true,
        x: position.x,
        y: position.y,
        value,
        label,
      });

      Animated.timing(hoverAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    [calculateDataPointPosition, hoverAnimation]
  );

  // Hide hover tooltip
  const hideHover = useCallback(() => {
    Animated.timing(hoverAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setHoverData((prev) => ({ ...prev, visible: false }));
    });
  }, [hoverAnimation]);

  // Pan responder for touch interactions on mobile (only on non-web platforms)
  const panResponder = useRef(
    !isWeb
      ? PanResponder.create({
          onStartShouldSetPanResponder: () => timespan === 'hourly',
          onMoveShouldSetPanResponder: () => timespan === 'hourly',
          onPanResponderGrant: (evt) => {
            if (!data || !data.datasets || data.datasets.length === 0) return;

            const { locationX } = evt.nativeEvent;
            const dataLength = data.datasets[0].data.length;
            const chartPadding = 60;
            const dataAreaWidth = chartWidth - chartPadding * 2;

            // Find closest data point
            const relativeX = Math.max(
              0,
              Math.min(locationX - chartPadding, dataAreaWidth)
            );
            const index = Math.round(
              (relativeX / dataAreaWidth) * (dataLength - 1)
            );

            if (index >= 0 && index < dataLength) {
              const value = data.datasets[0].data[index];
              const label = data.labels[index] || index.toString();
              showHover(index, value, label);
            }
          },
          onPanResponderMove: (evt) => {
            if (!data || !data.datasets || data.datasets.length === 0) return;

            const { locationX } = evt.nativeEvent;
            const dataLength = data.datasets[0].data.length;
            const chartPadding = 60;
            const dataAreaWidth = chartWidth - chartPadding * 2;

            // Find closest data point
            const relativeX = Math.max(
              0,
              Math.min(locationX - chartPadding, dataAreaWidth)
            );
            const index = Math.round(
              (relativeX / dataAreaWidth) * (dataLength - 1)
            );

            if (index >= 0 && index < dataLength) {
              const value = data.datasets[0].data[index];
              const label = data.labels[index] || index.toString();
              showHover(index, value, label);
            }
          },
          onPanResponderRelease: () => {
            setTimeout(hideHover, 1500); // Hide after 1.5 seconds
          },
        })
      : null
  ).current;

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chart data...</Text>
        </View>
      </View>
    );
  }

  // Show no data state
  if (
    !data ||
    !data.datasets ||
    data.datasets.length === 0 ||
    data.datasets[0].data.length === 0
  ) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>
          No data available for the selected date
        </Text>
      </View>
    );
  }

  // Determine chart type based on timespan
  const getChartComponent = () => {
    const baseStyle = {
      marginVertical: 8,
      borderRadius: 16,
    };

    // Filter data for mobile to reduce label clutter
    const getFilteredData = (
      originalData: ChartData,
      maxLabels: number = 8
    ) => {
      if (!isMobile || originalData.labels.length <= maxLabels) {
        return originalData;
      }

      const step = Math.ceil(originalData.labels.length / maxLabels);
      return {
        ...originalData,
        labels: originalData.labels.filter((_, index) => index % step === 0),
        datasets: originalData.datasets.map((dataset) => ({
          ...dataset,
          data: dataset.data.filter((_, index) => index % step === 0),
        })),
      };
    };

    // Enhanced hover/touch handler for line charts
    const handleDataPointClick = (pointData: any) => {
      if (timespan === 'hourly') {
        const { x, y, value, index } = pointData;
        const label = data.labels[index] || index.toString();

        showHover(index, value, label);

        // Auto-hide after 3 seconds
        setTimeout(hideHover, 3000);
      }
    };

    // Web-specific mouse events for hover
    const webHoverProps = isWeb
      ? {
          onMouseEnter: () => {
            // Mouse enter chart area
          },
          onMouseLeave: hideHover,
          onMouseMove: (event: any) => {
            if (
              timespan === 'hourly' &&
              data &&
              data.datasets &&
              data.datasets.length > 0
            ) {
              const rect = event.currentTarget.getBoundingClientRect();
              const x = event.clientX - rect.left;
              const y = event.clientY - rect.top;

              const dataLength = data.datasets[0].data.length;
              const chartPadding = 60;
              const dataAreaWidth = chartWidth - chartPadding * 2;

              // Find closest data point
              const relativeX = Math.max(
                0,
                Math.min(x - chartPadding, dataAreaWidth)
              );
              const index = Math.round(
                (relativeX / dataAreaWidth) * (dataLength - 1)
              );

              if (index >= 0 && index < dataLength) {
                const value = data.datasets[0].data[index];
                const label = data.labels[index] || index.toString();
                showHover(index, value, label);
              }
            }
          },
        }
      : {};

    switch (timespan) {
      case 'hourly':
        // Enhanced Line chart for hourly data with hover effects
        const hourlyData = getFilteredData(data, 6); // Max 6 labels on mobile
        return (
          <View
            {...webHoverProps}
            {...(!isWeb && panResponder ? panResponder.panHandlers : {})}
          >
            <LineChart
              data={hourlyData}
              width={chartWidth}
              height={chartHeight}
              chartConfig={getMobileChartConfig()}
              withDots={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              yAxisLabel=""
              yAxisSuffix={isMobile ? '' : ' W'}
              bezier
              style={baseStyle}
              onDataPointClick={handleDataPointClick}
              getDotColor={(dataPoint, dataPointIndex) =>
                hoverData.visible &&
                dataPointIndex === hourlyData.labels.indexOf(hoverData.label)
                  ? '#ffffff'
                  : '#10b981'
              }
              getDotProps={(dataPoint, dataPointIndex) => ({
                r:
                  hoverData.visible &&
                  dataPointIndex === hourlyData.labels.indexOf(hoverData.label)
                    ? '8'
                    : '4',
                strokeWidth:
                  hoverData.visible &&
                  dataPointIndex === hourlyData.labels.indexOf(hoverData.label)
                    ? '3'
                    : '2',
                stroke:
                  hoverData.visible &&
                  dataPointIndex === hourlyData.labels.indexOf(hoverData.label)
                    ? '#10b981'
                    : '#ffffff',
              })}
            />
          </View>
        );
      case 'daily':
        // Enhanced bar chart for daily data showing hourly breakdown
        const dailyData = getFilteredData(data, 12); // Max 12 labels on mobile

        return (
          <BarChart
            data={dailyData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={getMobileDailyBarChartConfig()}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            showValuesOnTopOfBars={false}
            yAxisLabel=""
            yAxisSuffix={isMobile ? '' : ' W'}
            style={baseStyle}
          />
        );
      case 'weekly':
        // Bar chart for weekly data (discrete daily values)
        const weeklyData = getFilteredData(data, 7); // Max 7 labels on mobile
        return (
          <BarChart
            data={weeklyData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={getMobileBarChartConfig()}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            showValuesOnTopOfBars={false}
            yAxisLabel=""
            yAxisSuffix={isMobile ? '' : ' kWh'}
            style={baseStyle}
          />
        );
      case 'monthly':
        // Bar chart for monthly data with Growatt styling
        const monthlyData = getFilteredData(data, 6); // Max 6 labels on mobile
        return (
          <BarChart
            data={monthlyData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={monthlyChartConfig}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            showValuesOnTopOfBars={false}
            yAxisLabel=""
            yAxisSuffix={isMobile ? '' : ' kWh'}
            style={baseStyle}
          />
        );
      case 'yearly':
        // Bar chart for yearly data (discrete values)
        const yearlyData = getFilteredData(data, 5); // Max 5 labels on mobile
        return (
          <BarChart
            data={yearlyData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={getMobileBarChartConfig()}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            showValuesOnTopOfBars={false}
            yAxisLabel=""
            yAxisSuffix={isMobile ? '' : ' kWh'}
            style={baseStyle}
          />
        );
      default:
        const defaultData = getFilteredData(data, 8); // Max 8 labels on mobile
        return (
          <LineChart
            data={defaultData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={getMobileChartConfig()}
            withDots={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            bezier
            style={baseStyle}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Enhanced Hover Tooltip */}
      <HoverTooltip
        visible={hoverData.visible}
        x={hoverData.x}
        y={hoverData.y}
        value={hoverData.value}
        label={hoverData.label}
        timespan={timespan}
        animation={hoverAnimation}
        chartWidth={chartWidth}
        chartHeight={chartHeight}
      />

      {/* Chart Container */}
      <View style={styles.chartContainer} ref={chartRef}>
        {getChartComponent()}
      </View>
    </View>
  );
}

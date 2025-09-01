import React from 'react';
import { LineChart, BarChart } from 'react-native-chart-kit';
import {
  useWindowDimensions,
  View,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';
import { solarTheme } from '../../theme/solarTheme';

const chartConfig = {
  backgroundGradientFrom: solarTheme.background.main,
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: solarTheme.background.card,
  backgroundGradientToOpacity: 0.1,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // blue to match theme
  strokeWidth: 3, // Increased stroke width for better visibility
  barPercentage: 0.7,
  fillShadowGradient: 'rgba(59, 130, 246, 0.6)',
  fillShadowGradientTo: 'rgba(59, 130, 246, 0.3)',
  fillShadowGradientFromOpacity: 0.4,
  fillShadowGradientToOpacity: 0.1,
  propsForBackgroundLines: {
    stroke: solarTheme.chart.grid,
    strokeWidth: 0.5,
    strokeDasharray: '5,5',
  },
  propsForLabels: {
    fill: solarTheme.chart.label,
    fontSize: 14,
    fontWeight: '600',
  },
  propsForVerticalLabels: {
    fill: solarTheme.chart.label,
    fontSize: 13,
    fontWeight: '500',
  },
  propsForHorizontalLabels: {
    fill: solarTheme.chart.label,
    fontSize: 13,
    fontWeight: '500',
  },
  decimalPlaces: 1,
  formatYLabel: (value: any) => `${Math.round(value * 10) / 10}`,
  formatXLabel: (value: any) => value,
};

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: () => string;
    strokeWidth: number;
    withDots?: boolean; // Optional property for datasets that should show dots
  }[];
}

interface WeatherChartProps {
  data: ChartData;
  timespan?: string; // 'hourly', 'daily', 'weekly', 'monthly', 'yearly'
}

// Function to limit and format labels based on timespan and screen size
const processChartData = (
  data: ChartData,
  timespan: string,
  isMobile: boolean
): ChartData => {
  if (!data.labels || data.labels.length === 0) {
    return data;
  }

  let processedLabels = [...data.labels];
  let showEvery = 1;

  // Determine label frequency based on timespan and screen size
  switch (timespan) {
    case 'hourly':
      showEvery = isMobile ? 4 : 2; // Show every 4th hour on mobile, every 2nd on desktop
      break;
    case 'daily':
      showEvery = isMobile ? 3 : 2; // Show every 3rd hour on mobile, every 2nd on desktop
      break;
    case 'weekly':
      showEvery = 1; // Show all days for weekly (should only be 7 days)
      break;
    case 'monthly':
      showEvery = isMobile ? 3 : 2; // Show fewer labels for monthly
      break;
    case 'yearly':
      showEvery = isMobile ? 2 : 1; // Show fewer labels for yearly
      break;
    default:
      showEvery = isMobile ? 3 : 2;
  }

  // Create sparse labels array
  processedLabels = data.labels.map((label, index) => {
    return index % showEvery === 0 ? label : '';
  });

  return {
    ...data,
    labels: processedLabels,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
    paddingBottom: 0,
    marginBottom: 0,
  },
  chartContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 0,
    marginBottom: 0,
  },
  chart: {
    marginVertical: 0,
    borderRadius: 16,
    marginBottom: 0,
    paddingBottom: 0,
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
});

export default function WeatherChart({
  data,
  timespan = 'hourly',
}: WeatherChartProps) {
  const windowDimensions = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isMobile = windowDimensions.width <= 768;

  // Process chart data to reduce label clutter
  const processedData = processChartData(data, timespan, isMobile);

  // Calculate chart dimensions based on container
  const chartWidth =
    windowDimensions.width <= 768
      ? windowDimensions.width - 24 // Mobile: full width minus padding
      : windowDimensions.width * 0.735; // Desktop: even larger width to expand left

  const chartHeight =
    windowDimensions.width <= 768
      ? Math.min(windowDimensions.height * 0.35, 300) // Mobile: reasonable height
      : windowDimensions.height * 0.8; // Desktop: taller to expand downward

  // Bar chart configuration for non-hourly time ranges
  const barChartConfig = {
    ...chartConfig,
    barPercentage: 0.6,
    fillShadowGradient: '#3b82f6',
    fillShadowGradientTo: '#60a5fa',
    fillShadowGradientFromOpacity: 0.9,
    fillShadowGradientToOpacity: 0.7,
  };

  // Mobile-specific chart config with readable font sizes
  const mobileChartConfig = {
    ...chartConfig,
    propsForHorizontalLabels: {
      fill: solarTheme.chart.label,
      fontSize: 12, // Larger font for better mobile readability
      fontWeight: '500',
    },
    propsForVerticalLabels: {
      fill: solarTheme.chart.label,
      fontSize: 12, // Larger font for better mobile readability
      fontWeight: '500',
    },
  };

  const mobileBarChartConfig = {
    ...barChartConfig,
    propsForHorizontalLabels: {
      fill: solarTheme.chart.label,
      fontSize: 12,
      fontWeight: '500',
    },
    propsForVerticalLabels: {
      fill: solarTheme.chart.label,
      fontSize: 12,
      fontWeight: '500',
    },
  };

  const currentLineChartConfig =
    windowDimensions.width <= 768 ? mobileChartConfig : chartConfig;

  const currentBarChartConfig =
    windowDimensions.width <= 768 ? mobileBarChartConfig : barChartConfig;

  // Show no data state
  if (
    !processedData ||
    !processedData.datasets ||
    processedData.datasets.length === 0 ||
    processedData.datasets[0].data.length === 0
  ) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>
          No data available for the selected date
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Chart Container */}
      <View style={styles.chartContainer}>
        {timespan === 'hourly' || timespan === 'weekly' ? (
          <LineChart
            data={processedData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={currentLineChartConfig}
            withDots={timespan === 'weekly'} // Show dots for weekly data for better visibility
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            yAxisLabel=""
            yAxisSuffix=""
            bezier
            style={styles.chart}
            {...(Platform.OS !== 'web' && {
              onDataPointClick: (data) => {
                console.log('Data point clicked:', data);
              },
            })}
          />
        ) : (
          <BarChart
            data={processedData}
            width={chartWidth}
            height={chartHeight}
            chartConfig={currentBarChartConfig}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
            showValuesOnTopOfBars={false}
            yAxisLabel=""
            yAxisSuffix=""
            style={styles.chart}
          />
        )}
      </View>
    </View>
  );
}

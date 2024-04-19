import React from 'react';
import { LineChart } from 'react-native-chart-kit';
import { useWindowDimensions } from 'react-native';
import { View } from '@gluestack-ui/themed';

const chartConfig = {
  backgroundGradientFrom: 'rgba(40,38,91,255)',
  backgroundGradientFromOpacity: 0,
  backgroundGradientTo: 'rgba(39,56,106,255)',
  backgroundGradientToOpacity: 0.5,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // solid white
  barPercentage: 0.5,
  propsForBackgroundLines: {
    stroke: 'rgba(255, 255, 255, 1)',
    strokeWidth: 0.3,
    strokeDasharray: '0',
  },
  propsForLabels: {
    dy: 5,
  },
};

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: () => string;
    strokeWidth: number;
  }[];
}

interface WeatherChartProps {
  data: ChartData;
}

export default function WeatherChart({ data }: WeatherChartProps) {
  const windowDimensions = useWindowDimensions();

  if (windowDimensions.width <= 768) {
    return (
      <View style={{ marginBottom: -100 }}>
        <LineChart
          data={data}
          width={windowDimensions.width}
          height={windowDimensions.height * 0.8}
          chartConfig={chartConfig}
          withDots={false}
          withVerticalLines={false}
        />
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <LineChart
        data={data}
        width={windowDimensions.width * 0.75}
        height={windowDimensions.height}
        chartConfig={chartConfig}
        withDots={false}
        withShadow={false}
        withVerticalLines={false}
      />
    </View>
  );
}

import React from 'react';
import { View, Text } from 'react-native';
import { dataTypeLabels } from '../../constants/weatherStationConfig';

interface WeatherLegendProps {
  dataType: string;
  styles: any;
}

export const WeatherLegend: React.FC<WeatherLegendProps> = ({ dataType, styles }) => {
  if (dataType === 'precip') {
    return (
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>Precip. Accum. Total (mm)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Precip. Rate (mm)</Text>
        </View>
      </View>
    );
  }

  if (dataType === 'windSpeed') {
    return (
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>Wind Speed (km/h)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: '#f97316' }]} />
          <Text style={styles.legendText}>Wind Gust (km/h)</Text>
        </View>
      </View>
    );
  }

  if (dataType === 'temperature') {
    return (
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: '#ff0000' }]} />
          <Text style={styles.legendText}>Temperature (°C)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: '#329932' }]} />
          <Text style={styles.legendText}>Dew Point (°C)</Text>
        </View>
      </View>
    );
  }

  if (dataType === 'pressure') {
    return (
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: '#000000' }]} />
          <Text style={styles.legendText}>Pressure (hPa)</Text>
        </View>
      </View>
    );
  }

  if (dataType === 'solarRadiation') {
    return (
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: '#FF8C00' }]} />
          <Text style={styles.legendText}>Solar Radiation (watts/m²)</Text>
        </View>
      </View>
    );
  }

  if (dataType === 'uvIndex') {
    return (
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: '#8B00FF' }]} />
          <Text style={styles.legendText}>UV Index</Text>
        </View>
      </View>
    );
  }

  return <Text>{dataTypeLabels[dataType] || 'Temperature'}</Text>;
};

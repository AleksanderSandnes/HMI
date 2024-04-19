import React from 'react';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

export default function WeatherIcon({ precipRate }: { precipRate: number }) {
  if (precipRate === null) {
    return null;
  }

  if (precipRate < 2) {
    return <MaterialIcons name="sunny" size={120} color="yellow" />;
  }

  if (precipRate < 6) {
    return <Ionicons name="rainy" size={120} color="white" />;
  }

  return <FontAwesome5 name="cloud-showers-heavy" size={120} color="white" />;
}

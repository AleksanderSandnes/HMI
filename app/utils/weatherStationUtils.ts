import { dataModeConfig, dataTypeLabels } from '../constants/weatherStationConfig';

// Weather icon mapping utility
export const getWeatherIcon = (weatherText?: string) => {
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

// Data mode display utility
export const getDataModeDisplay = (dataMode: string) => {
  return (
    dataModeConfig[dataMode as keyof typeof dataModeConfig] || dataModeConfig.production
  );
};

// Weather Station Configuration Constants
export const dataTypeConfig = [
  { key: 'temperature', label: 'Temp', icon: '🌡️' },
  { key: 'windSpeed', label: 'Wind', icon: '💨' },
  { key: 'precip', label: 'Rain', icon: '🌧️' },
  { key: 'pressure', label: 'Press', icon: '🔽' },
  { key: 'solarRadiation', label: 'Solar', icon: '☀️' },
  { key: 'uvIndex', label: 'UV', icon: '🟣' },
];

export const timespanOptions = ['Hourly', 'Weekly'];

export const dataModeConfig = {
  production: { label: '🟢 Production API', color: '#10b981' },
  development: { label: '🟡 Development API', color: '#f59e0b' },
};

export const dataTypeLabels: { [key: string]: string } = {
  temperature: 'Temperature',
  windSpeed: 'Wind Speed',
  windDirection: 'Wind Direction',
  precip: 'Precipitation',
  pressure: 'Pressure',
  solarRadiation: 'Solar Radiation',
  uvIndex: 'UV Index',
};

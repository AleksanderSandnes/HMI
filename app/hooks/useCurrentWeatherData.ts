import { useState, useEffect, useCallback } from 'react';
import { countries } from 'country-data';

function useCurrentWeatherData() {
  const [neighborhood, setNeighborhood] = useState('');
  const [countryName, setCountryName] = useState('');
  const [currentPrecipRate, setCurrentPrecipRate] = useState(null);
  const [currentTemp, setCurrentTemp] = useState(null);
  const [currentWindSpeed, setCurrentWindSpeed] = useState(null);
  const [currentWindGust, setCurrentWindGust] = useState(null);
  const [currentHumidity, setCurrentHumidity] = useState(null);

  const fetchCurrentWeatherData = useCallback(() => {
    fetch('https://hmi-backend.onrender.com/api/weather/current')
      .then((response) => response.json())
      .then((data) => {
        setNeighborhood(data.observations[0].neighborhood);
        const countryCode = data.observations[0].country;
        const country = countries[countryCode];
        setCountryName(country ? country.name : 'Unknown country');
        setCurrentPrecipRate(data.observations[0].metric.precipRate);
        setCurrentTemp(data.observations[0].metric.temp);
        setCurrentWindSpeed(data.observations[0].metric.windSpeed);
        setCurrentWindGust(data.observations[0].metric.windGust);
        setCurrentHumidity(data.observations[0].humidity);
      });
  }, []);

  const getWeatherText = (precipRate: number | null) => {
    if (precipRate === null) return 'Unknown';
    if (precipRate < 2) return 'Sunny';
    if (precipRate < 4) return 'Light Rain';
    if (precipRate < 6) return 'Moderate Rain';
    if (precipRate < 20) return 'Rain';
    return 'Heavy Rain';
  };

  const weatherText = getWeatherText(currentPrecipRate);

  useEffect(() => {
    fetchCurrentWeatherData();
    const intervalId = setInterval(fetchCurrentWeatherData, 60000);
    return () => clearInterval(intervalId);
  }, [fetchCurrentWeatherData]);

  return {
    neighborhood,
    countryName,
    currentPrecipRate,
    currentTemp,
    currentWindSpeed,
    currentWindGust,
    currentHumidity,
    weatherText,
  };
}

export default useCurrentWeatherData;

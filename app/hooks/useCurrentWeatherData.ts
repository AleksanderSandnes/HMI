import { useState, useEffect, useCallback } from 'react';
import { countries } from 'country-data';
import { getCurrentWeatherData } from '../services/weatherApiService';
import { getDataMode } from '../services/dataConfig';

function useCurrentWeatherData() {
  const [neighborhood, setNeighborhood] = useState('');
  const [countryName, setCountryName] = useState('');
  const [currentPrecipRate, setCurrentPrecipRate] = useState(null);
  const [currentTemp, setCurrentTemp] = useState(null);
  const [currentWindSpeed, setCurrentWindSpeed] = useState(null);
  const [currentWindGust, setCurrentWindGust] = useState(null);
  const [currentHumidity, setCurrentHumidity] = useState(null);

  const fetchCurrentWeatherData = useCallback(async () => {
    const dataMode = getDataMode();

    console.log(
      `[CurrentWeatherHook] Fetching weather data in ${dataMode} mode`
    );

    try {
      const data = await getCurrentWeatherData();
      console.log(
        `[CurrentWeatherHook] Successfully fetched weather data in ${dataMode} mode`,
        data
      );

      if (data?.observations?.[0]) {
        const observation = data.observations[0];
        setNeighborhood(observation.neighborhood);
        const countryCode = observation.country;
        const country = countries[countryCode];
        setCountryName(country ? country.name : 'Unknown country');
        setCurrentPrecipRate(observation.metric.precipRate);
        setCurrentTemp(observation.metric.temp);
        setCurrentWindSpeed(observation.metric.windSpeed);
        setCurrentWindGust(observation.metric.windGust);
        setCurrentHumidity(observation.humidity);
      } else {
        console.warn(
          '[CurrentWeatherHook] No observation data found in response'
        );
      }
    } catch (error) {
      console.error(
        `[CurrentWeatherHook] Error fetching weather data in ${dataMode} mode:`,
        error
      );
    }
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
    const dataMode = getDataMode();
    console.log(
      `[CurrentWeatherHook] Setting up weather data fetching in ${dataMode} mode`
    );

    fetchCurrentWeatherData();
    const intervalId = setInterval(fetchCurrentWeatherData, 60000);
    return () => clearInterval(intervalId);
  }, [fetchCurrentWeatherData, getDataMode()]);

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

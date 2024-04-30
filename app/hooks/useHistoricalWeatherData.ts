import { useState, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  TemperatureDataItem,
  WindSpeedDataItem,
  WindDirectionDataItem,
  PrecipDataItem,
  PressureDataItem,
  SolarRadiationDataItem,
  UvIndexDataItem,
} from '../interface/weatherInterface';
import { ChartData } from '../components/charts/weatherChart';

const useHistoricalWeatherData = (formattedPickerDate: string) => {
  const [weatherData, setWeatherData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [dataType, setDataType] = useState<string>('temperature');
  const [historicalPickerDate, setHistoricalPickerDate] =
    useState<string>(formattedPickerDate);
  const isMobile = useWindowDimensions().width <= 768;

  const fetchDailyWeatherData = async (formattedPickerDate: string) => {
    const response = await fetch(
      `https://hmi-backend.onrender.com/api/weather/all/${formattedPickerDate}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const json = await response.json();
    if (!json || !json.observations) {
      return [];
    }
    return json.observations;
  };

  const formatTemperatureData = (data: TemperatureDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      tempAvg: item.metric.tempAvg,
      dewptAvg: item.metric.dewptAvg,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const tempAvg = formattedData.map((item) => item.tempAvg);
    const dewptAvg = formattedData.map((item) => item.dewptAvg);

    setWeatherData({
      labels,
      datasets: [
        {
          data: tempAvg,
          color: () => `#329932`,
          strokeWidth: 3,
        },
        {
          data: dewptAvg,
          color: () => `#ff0000`,
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatWindSpeedData = (data: WindSpeedDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      windspeedAvg: item.metric.windspeedAvg,
      windgustAvg: item.metric.windgustAvg,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const windspeedAvg = formattedData.map((item) => item.windspeedAvg);
    const windgustAvg = formattedData.map((item) => item.windgustAvg);

    setWeatherData({
      labels,
      datasets: [
        {
          data: windspeedAvg,
          color: () => `#329932`,
          strokeWidth: 3,
        },
        {
          data: windgustAvg,
          color: () => `#ff0000`,
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatWindDirectionData = (data: WindDirectionDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      winddirAvg: item.winddirAvg,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const winddirAvg = formattedData.map((item) => item.winddirAvg);

    setWeatherData({
      labels,
      datasets: [
        {
          data: winddirAvg,
          color: () => `#329932`,
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatPrecipData = (data: PrecipDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      precipRate: item.metric.precipRate,
      precipTotal: item.metric.precipTotal,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const precipRate = formattedData.map((item) => item.precipRate);
    const precipTotal = formattedData.map((item) => item.precipTotal);

    setWeatherData({
      labels,
      datasets: [
        {
          data: precipRate,
          color: () => `#329932`,
          strokeWidth: 3,
        },
        {
          data: precipTotal,
          color: () => `#ff0000`,
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatPressureData = (data: PressureDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      pressureMax: item.metric.pressureMax,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const pressureMax = formattedData.map((item) => item.pressureMax);

    setWeatherData({
      labels,
      datasets: [
        {
          data: pressureMax,
          color: () => `#329932`,
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatSolarRadiationData = (data: SolarRadiationDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      solarRadiationHigh: item.solarRadiationHigh,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const solarRadiationHigh = formattedData.map(
      (item) => item.solarRadiationHigh
    );

    setWeatherData({
      labels,
      datasets: [
        {
          data: solarRadiationHigh,
          color: () => `#329932`,
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatUvIndexData = (data: UvIndexDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      uvHigh: item.uvHigh,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const uvHigh = formattedData.map((item) => item.uvHigh);

    setWeatherData({
      labels,
      datasets: [
        {
          data: uvHigh,
          color: () => `#329932`,
          strokeWidth: 3,
        },
      ],
    });
  };

  useEffect(() => {
    fetchDailyWeatherData(historicalPickerDate).then((data) => {
      switch (dataType) {
        case 'temperature':
          formatTemperatureData(data);
          break;
        case 'windSpeed':
          formatWindSpeedData(data);
          break;
        case 'windDirection':
          formatWindDirectionData(data);
          break;
        case 'precip':
          formatPrecipData(data);
          break;
        case 'pressure':
          formatPressureData(data);
          break;
        case 'solarRadiation':
          formatSolarRadiationData(data);
          break;
        case 'uvIndex':
          formatUvIndexData(data);
          break;
        default:
          formatTemperatureData(data);
          break;
      }
    });
  }, [historicalPickerDate, dataType]);

  useEffect(() => {
    setHistoricalPickerDate(formattedPickerDate);
  }, [formattedPickerDate]);

  return {
    weatherData,
    dataType,
    setDataType,
  };
};

export default useHistoricalWeatherData;

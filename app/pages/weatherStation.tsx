/* eslint-disable indent */
import React, { useState, useEffect, useCallback } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import {
  Box,
  HStack,
  Text,
  VStack,
  View,
  ScrollView,
} from '@gluestack-ui/themed';
import { countries } from 'country-data';
import Background from '../components/boxes/background';
import SmallBox from '../components/boxes/smallBox';
import BigBox from '../components/boxes/bigBox';
import MonthSelector from '../components/selects/monthSelector';
import DaySelector from '../components/selects/daySelector';
import YearSelector from '../components/selects/yearSelector';
import WeatherInfo from '../components/weather/weatherInfo';
import WeatherChart, { ChartData } from '../components/charts/weatherChart';
import TimespanSelector from '../components/selects/timespanSelector';
import DataTypeSelector from '../components/selects/dataTypeSelector';

const web = StyleSheet.create({
  hStack: { flex: 0.9, flexDirection: 'row', width: '95%', margin: 'auto' },
  bigVStack: { flex: 8, flexDirection: 'column' },
  smallVStack: { flex: 2, flexDirection: 'column' },
  smallBoxWidth: { width: 20 },
  smallBoxHeight: { height: 20 },
  text: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
});

interface TemperatureDataItem {
  metric: { tempAvg: number; dewptAvg: number };
  obsTimeLocal: string;
}

interface WindSpeedDataItem {
  metric: { windspeedAvg: number; windgustAvg: number };
  obsTimeLocal: string;
}

interface WindDirectionDataItem {
  winddirAvg: number;
  obsTimeLocal: string;
}

interface PrecipDataItem {
  metric: { precipRate: number; precipTotal: number };
  obsTimeLocal: string;
}

interface PressureDataItem {
  metric: { pressureMax: number };
  obsTimeLocal: string;
}

interface SolarRadiationDataItem {
  solarRadiationHigh: number;
  obsTimeLocal: string;
}

interface UvIndexDataItem {
  uvHigh: number;
  obsTimeLocal: string;
}

const windowWidth = Dimensions.get('window').width;

export default function WeatherStation() {
  const [neighborhood, setNeighborhood] = useState('');
  const [countryName, setCountryName] = useState('');
  const [currentPrecipRate, setCurrentPrecipRate] = useState(null);
  const [currentTemp, setCurrentTemp] = useState(null);
  const [currentWindSpeed, setCurrentWindSpeed] = useState(null);
  const [currentWindGust, setCurrentWindGust] = useState(null);
  const [currentHumidity, setCurrentHumidity] = useState(null);

  const today = new Date();
  const [timepspan, setTimespan] = useState('daily');
  const [day, setDay] = useState(`0${today.getDate()}`.slice(-2));
  const [month, setMonth] = useState(String(today.getMonth()));
  const [year, setYear] = useState(today.getFullYear());

  function getDatesInMonth(yearParam: number, monthParam: number) {
    const date = new Date(yearParam, monthParam, 1);
    const datesInMonth = [];

    while (date.getMonth() === monthParam) {
      datesInMonth.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }

    return datesInMonth;
  }

  const dates = getDatesInMonth(Number(year), Number(month));

  const [weatherData, setWeatherData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });

  const [dataType, setDataType] = useState('temperature');

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchDailyWeatherData = async (dateString: string): Promise<any[]> => {
    const response = await fetch(
      `http://localhost:5000/api/weather/all/${dateString}`
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
    const formattedData = data.map(
      (item: {
        metric: { tempAvg: number; dewptAvg: number };
        obsTimeLocal: string;
      }) => ({
        hour: item.obsTimeLocal,
        tempAvg: item.metric.tempAvg,
        dewptAvg: item.metric.dewptAvg,
      })
    );

    const labels = formattedData.map((item: { hour: string }) => {
      const time = item.hour.split(' ')[1]; // Get the time part of the string
      const [hour, minute] = time.split(':').map(Number);

      return minute === 59 ? `${hour}:${minute}` : ''; // Display only if minute is 59
    });

    const tempAvg = formattedData.map(
      (item: { tempAvg: number }) => item.tempAvg
    );
    const dewptAvg = formattedData.map(
      (item: { dewptAvg: number }) => item.dewptAvg
    );

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
    const formattedData = data.map(
      (item: {
        metric: { windspeedAvg: number; windgustAvg: number };
        obsTimeLocal: string;
      }) => ({
        hour: item.obsTimeLocal,
        windspeedAvg: item.metric.windspeedAvg,
        windgustAvg: item.metric.windgustAvg,
      })
    );

    const labels = formattedData.map((item: { hour: string }) => {
      const time = item.hour.split(' ')[1]; // Get the time part of the string
      const [hour, minute] = time.split(':').map(Number);

      return minute === 59 ? `${hour}:${minute}` : ''; // Display only if minute is 59
    });

    const windspeedAvg = formattedData.map(
      (item: { windspeedAvg: number }) => item.windspeedAvg
    );
    const windgustAvg = formattedData.map(
      (item: { windgustAvg: number }) => item.windgustAvg
    );

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
    const formattedData = data.map(
      (item: { winddirAvg: number; obsTimeLocal: string }) => ({
        hour: item.obsTimeLocal,
        winddirAvg: item.winddirAvg,
      })
    );

    const labels = formattedData.map((item: { hour: string }) => {
      const time = item.hour.split(' ')[1]; // Get the time part of the string
      const [hour, minute] = time.split(':').map(Number);

      return minute === 59 ? `${hour}:${minute}` : ''; // Display only if minute is 59
    });

    const winddirAvg = formattedData.map(
      (item: { winddirAvg: number }) => item.winddirAvg
    );

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
    const formattedData = data.map(
      (item: {
        metric: { precipRate: number; precipTotal: number };
        obsTimeLocal: string;
      }) => ({
        hour: item.obsTimeLocal,
        precipRate: item.metric.precipRate,
        precipTotal: item.metric.precipTotal,
      })
    );

    const labels = formattedData.map((item: { hour: string }) => {
      const time = item.hour.split(' ')[1]; // Get the time part of the string
      const [hour, minute] = time.split(':').map(Number);

      return minute === 59 ? `${hour}:${minute}` : ''; // Display only if minute is 59
    });

    const precipRate = formattedData.map(
      (item: { precipRate: number }) => item.precipRate
    );
    const precipTotal = formattedData.map(
      (item: { precipTotal: number }) => item.precipTotal
    );

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
    const formattedData = data.map(
      (item: { metric: { pressureMax: number }; obsTimeLocal: string }) => ({
        hour: item.obsTimeLocal,
        pressureMax: item.metric.pressureMax,
      })
    );

    const labels = formattedData.map((item: { hour: string }) => {
      const time = item.hour.split(' ')[1]; // Get the time part of the string
      const [hour, minute] = time.split(':').map(Number);

      return minute === 59 ? `${hour}:${minute}` : ''; // Display only if minute is 59
    });

    const pressureMax = formattedData.map(
      (item: { pressureMax: number }) => item.pressureMax
    );

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
    const formattedData = data.map(
      (item: { solarRadiationHigh: number; obsTimeLocal: string }) => ({
        hour: item.obsTimeLocal,
        solarRadiationHigh: item.solarRadiationHigh,
      })
    );

    const labels = formattedData.map((item: { hour: string }) => {
      const time = item.hour.split(' ')[1]; // Get the time part of the string
      const [hour, minute] = time.split(':').map(Number);

      return minute === 59 ? `${hour}:${minute}` : ''; // Display only if minute is 59
    });

    const solarRadiationHigh = formattedData.map(
      (item: { solarRadiationHigh: number }) => item.solarRadiationHigh
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
    const formattedData = data.map(
      (item: { uvHigh: number; obsTimeLocal: string }) => ({
        hour: item.obsTimeLocal,
        uvHigh: item.uvHigh,
      })
    );

    const labels = formattedData.map((item: { hour: string }) => {
      const time = item.hour.split(' ')[1]; // Get the time part of the string
      const [hour, minute] = time.split(':').map(Number);

      return minute === 59 ? `${hour}:${minute}` : ''; // Display only if minute is 59
    });

    const uvHigh = formattedData.map((item: { uvHigh: number }) => item.uvHigh);

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
    const dateString = `${year}${String(Number(month) + 1).padStart(
      2,
      '0'
    )}${day}`;
    fetchDailyWeatherData(dateString).then((data) => {
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

    fetchCurrentWeatherData();
    const intervalId = setInterval(fetchCurrentWeatherData, 60000);
    return () => clearInterval(intervalId);
  }, [fetchCurrentWeatherData, day, month, year, dataType]);

  const getWeatherText = (precipRate: number | null) => {
    if (precipRate === null) return 'Unknown';
    if (precipRate < 2) return 'Sunny';
    if (precipRate < 4) return 'Light Rain';
    if (precipRate < 6) return 'Moderate Rain';
    if (precipRate < 20) return 'Rain';
    return 'Heavy Rain';
  };

  const weatherText = getWeatherText(currentPrecipRate);

  if (windowWidth <= 768) {
    return (
      <Background>
        <ScrollView>
          <View
            style={{
              flexDirection: 'column',
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              paddingTop: 60,
            }}
          >
            <View style={{ paddingBottom: 20, width: windowWidth * 0.95 }}>
              <BigBox>
                <Text>Chart</Text>
              </BigBox>
            </View>

            <View style={{ flex: 2, width: windowWidth * 0.95 }}>
              <SmallBox>
                <WeatherInfo
                  neighborhood={neighborhood}
                  countryName={countryName}
                  precipRate={currentPrecipRate}
                  temp={currentTemp ?? 0}
                  weatherText={weatherText}
                  windSpeed={currentWindSpeed ?? 0}
                  windGust={currentWindGust ?? 0}
                  humidity={currentHumidity ?? 0}
                />
              </SmallBox>

              <Box style={{ height: 20 }} />

              <SmallBox>
                <Box style={{ height: 20 }} />
                <Text
                  style={{
                    color: 'white',
                    textAlign: 'center',
                    alignSelf: 'center',
                  }}
                >
                  Vindhastighet
                </Text>
              </SmallBox>

              <Box style={{ height: 20 }} />
            </View>
          </View>
        </ScrollView>
      </Background>
    );
  }
  return (
    <Background>
      <HStack style={web.hStack}>
        <VStack style={web.bigVStack}>
          <BigBox>
            <WeatherChart
              data={weatherData}
              key={JSON.stringify(weatherData)}
            />
          </BigBox>
        </VStack>

        <Box style={web.smallBoxWidth} />

        <VStack style={web.smallVStack}>
          <SmallBox>
            <WeatherInfo
              neighborhood={neighborhood}
              countryName={countryName}
              precipRate={currentPrecipRate}
              temp={currentTemp ?? 0}
              weatherText={weatherText}
              windSpeed={currentWindSpeed ?? 0}
              windGust={currentWindGust ?? 0}
              humidity={currentHumidity ?? 0}
            />
          </SmallBox>

          <Box style={web.smallBoxHeight} />

          <SmallBox>
            <Text style={web.text}>Chart controls</Text>
            <TimespanSelector timespan={timepspan} setTimespan={setTimespan} />
            <DataTypeSelector dataType={dataType} setDataType={setDataType} />
            <MonthSelector month={month} setMonth={setMonth} />
            <DaySelector selectedDay={day} setDay={setDay} dates={dates} />
            <YearSelector year={year} setYear={setYear} />
          </SmallBox>
        </VStack>
      </HStack>
    </Background>
  );
}

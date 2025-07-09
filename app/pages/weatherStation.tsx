/* eslint-disable indent */
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Box, HStack, VStack } from '@gluestack-ui/themed';
import Background from '../components/boxes/universal/background';
import SmallBoxWeb from '../components/boxes/web/smallBoxWeb';
import SmallBoxMobile from '../components/boxes/mobile/smallBoxMobile';
import BigBox from '../components/boxes/universal/bigBox';
import WeatherInfo from '../components/weather/weatherInfo';
import WeatherChart from '../components/charts/weatherChart';
import TimespanSelector from '../components/selects/timespanSelector';
import DataTypeSelector from '../components/selects/dataTypeSelector';
import { Button } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import Dropdown from 'react-native-input-select';
import useCurrentWeatherData from '../hooks/useCurrentWeatherData';
import { useDatePicker } from '../hooks/useDatePicker';
import useHistoricalWeatherData from '../hooks/useHistoricalWeatherData';

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
  text2: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
});

const mobile = StyleSheet.create({
  outerView: {
    flexDirection: 'column',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    alignSelf: 'center',
  },
});

export default function WeatherStation() {
  const {
    neighborhood,
    countryName,
    currentPrecipRate,
    currentTemp,
    currentWindSpeed,
    currentWindGust,
    currentHumidity,
    weatherText,
  } = useCurrentWeatherData();

  const {
    pickerDate,
    formattedPickerDate,
    open,
    onDismiss,
    onConfirm,
    openDatePicker,
  } = useDatePicker();

  const { weatherData, dataType, setDataType } =
    useHistoricalWeatherData(formattedPickerDate);

  const [timespan, setTimespan] = useState('daily');
  const windowWidth = useWindowDimensions().width;

  if (windowWidth <= 768) {
    return (
      <Background>
        <ScrollView>
          <View style={mobile.outerView}>
            <Text style={web.text}>
              Date:{' '}
              {pickerDate
                ? new Date(pickerDate).toDateString()
                : 'No date selected'}
            </Text>
            <View style={{ paddingBottom: 20, width: windowWidth * 0.95 }}>
              <BigBox>
                <WeatherChart
                  data={weatherData}
                  key={JSON.stringify(weatherData)}
                />
              </BigBox>
            </View>

            <View
              style={{ paddingBottom: 20, flex: 2, width: windowWidth * 0.95 }}
            >
              <SmallBoxMobile>
                <Text style={web.text}>Chart controls</Text>
                <Button
                  onPress={openDatePicker}
                  uppercase={false}
                  mode="outlined"
                  buttonColor="#4fd3cc"
                  textColor="white"
                  style={{ borderWidth: 0 }}
                >
                  Pick a date
                </Button>
                <DatePickerModal
                  locale="en"
                  mode="single"
                  visible={open}
                  onDismiss={onDismiss}
                  date={new Date(pickerDate)}
                  onConfirm={onConfirm}
                />

                <Box style={{ height: 20 }} />

                <Dropdown
                  options={[
                    { value: 'temperature', label: 'Temperature' },
                    { value: 'windSpeed', label: 'Wind Speed' },
                    { value: 'windDirection', label: 'Wind Direction' },
                    { value: 'precip', label: 'Precipitation' },
                    { value: 'pressure', label: 'Pressure' },
                    { value: 'solarRadiation', label: 'Solar Radiation' },
                    { value: 'uvIndex', label: 'UV Index' },
                  ]}
                  selectedValue={dataType}
                  onValueChange={(value) => setDataType(value)}
                  primaryColor={'deepskyblue'}
                  dropdownStyle={{
                    width: '40%',
                    alignSelf: 'center',
                    backgroundColor: '#4fd3cc',
                    borderRadius: 50,
                  }}
                />
              </SmallBoxMobile>

              <Box style={{ height: 20 }} />

              <SmallBoxMobile>
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
              </SmallBoxMobile>

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
          <SmallBoxWeb>
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
          </SmallBoxWeb>

          <Box style={web.smallBoxHeight} />

          <SmallBoxWeb>
            <Text style={web.text}>Chart controls</Text>
            <Text style={web.text2}>
              Selected date:{' '}
              {pickerDate
                ? new Date(pickerDate).toDateString()
                : 'No date selected'}
            </Text>
            <TimespanSelector timespan={timespan} setTimespan={setTimespan} />
            <DataTypeSelector dataType={dataType} setDataType={setDataType} />
            <Box style={web.smallBoxHeight} />
            <Button
              onPress={openDatePicker}
              uppercase={false}
              mode="outlined"
              buttonColor="#4fd3cc"
              textColor="white"
              style={{ borderWidth: 0 }}
            >
              Pick a date
            </Button>
            <DatePickerModal
              locale="en"
              mode="single"
              visible={open}
              onDismiss={onDismiss}
              date={new Date(pickerDate)}
              onConfirm={onConfirm}
            />
          </SmallBoxWeb>
        </VStack>
      </HStack>
    </Background>
  );
}

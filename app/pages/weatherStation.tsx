import React, { useState, useEffect, useCallback } from 'react';
import { Dimensions, StyleSheet } from "react-native";
import { Box, HStack, Text, VStack, View, ScrollView } from "@gluestack-ui/themed";
import { countries } from 'country-data';
import Background from "../components/boxes/background";
import SmallBox from "../components/boxes/smallBox";
import BigBox from '../components/boxes/bigBox';
import PowerProductionChart from "../components/charts/powerProductionChart";
import FormButton from '../components/buttons/formButton';
import ModeSelector from '../components/selects/modeSelector';
import MonthSelector from '../components/selects/monthSelector';
import DaySelector from '../components/selects/daySelector';
import YearSelector from '../components/selects/yearSelector';
import WeatherInfo from '../components/weather/weatherInfo';

const web = StyleSheet.create({
    hStack: { flex: 0.90, flexDirection: 'row', width: '95%', margin: 'auto' },
    bigVStack: { flex: 8, flexDirection: 'column' },
    smallVStack: { flex: 2, flexDirection: 'column' },
    smallBoxWidth: { width: 20 },
    smallBoxHeight: { height: 20 },
    text: { fontSize: 24, color: 'white', textAlign: 'center', alignSelf: 'center', marginBottom: 20 },
});

const windowWidth = Dimensions.get('window').width;

const WeatherStation: React.FC = () => {
    const [neighborhood, setNeighborhood] = useState('');
    const [countryName, setCountryName] = useState('');
    const [precipRate, setPrecipRate] = useState(null);
    const [temp, setTemp] = useState(null);
    const [windSpeed, setWindSpeed] = useState(null);
    const [windGust, setWindGust] = useState(null);
    const [humidity, setHumidity] = useState(null);
    const [mode, setMode] = useState("daily");
    const [day, setDay] = useState("01");
    const [month, setMonth] = useState("0");
    const [year, setYear] = useState(2024);
    const dates = getDatesInMonth(Number(year), Number(month));

    const fetchData = useCallback(() => {
        fetch('http://localhost:5000/api/weather/current')
            .then(response => response.json())
            .then(data => {
                setNeighborhood(data.observations[0].neighborhood);
                const countryCode = data.observations[0].country;
                const country = countries[countryCode];
                setCountryName(country ? country.name : 'Unknown country');
                setPrecipRate(data.observations[0].metric.precipRate);
                setTemp(data.observations[0].metric.temp);
                setWindSpeed(data.observations[0].metric.windSpeed);
                setWindGust(data.observations[0].metric.windGust);
                setHumidity(data.observations[0].humidity);
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
            });
    }, []);

    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 60000);
        return () => clearInterval(intervalId);
    }, [fetchData]);

    const getWeatherText = (precipRate: number | null) => {
        if (precipRate === null) return 'Unknown';
        if (precipRate < 2) return 'Sunny';
        if (precipRate < 4) return 'Light Rain';
        if (precipRate < 6) return 'Moderate Rain';
        if (precipRate < 20) return 'Rain';
        return 'Heavy Rain';
    };

    const weatherText = getWeatherText(precipRate);

    function getDatesInMonth(year: number, month: number) {
        const date = new Date(year, month, 1);
        const dates = [];

        while (date.getMonth() === month) {
            dates.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }

        return dates;
    }

    if (windowWidth <= 768) {
        return (
            <Background>
                <ScrollView>
                    <View style={{ flexDirection: windowWidth > 768 ? 'row' : 'column', width: '100%', justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
                        <View style={{ flex: 8, flexDirection: 'column', paddingBottom: 20, width: windowWidth * 0.95 }}>
                            <BigBox>
                                <PowerProductionChart />
                            </BigBox>
                        </View>

                        {windowWidth > 768 && <Box style={{ width: 20 }} />}

                        <View style={{ flex: 2, flexDirection: 'column', width: windowWidth * 0.95 }}>
                            <SmallBox>
                                <Box style={{ height: 20 }} />
                                <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>{neighborhood}, {countryName}</Text>
                            </SmallBox>

                            <Box style={{ height: 20 }} />

                            <SmallBox>
                                <Box style={{ height: 20 }} />
                                <Text style={{ color: 'white', textAlign: 'center', alignSelf: 'center' }}>Vindhastighet</Text>
                            </SmallBox>

                            <Box style={{ height: 20 }} />
                        </View>
                    </View>
                </ScrollView>
            </Background>
        )
    } else {
        return (
            <Background>
                <HStack style={web.hStack}>
                    <VStack style={web.bigVStack}>
                        <BigBox>
                            <PowerProductionChart />
                        </BigBox>
                    </VStack>

                    <Box style={web.smallBoxWidth} />

                    <VStack style={web.smallVStack}>
                        <SmallBox>
                            <WeatherInfo
                                neighborhood={neighborhood}
                                countryName={countryName}
                                precipRate={precipRate}
                                temp={temp ?? 0}
                                weatherText={weatherText}
                                windSpeed={windSpeed ?? 0}
                                windGust={windGust ?? 0}
                                humidity={humidity ?? 0}
                            />
                        </SmallBox>

                        <Box style={web.smallBoxHeight} />

                        <SmallBox>
                            <Text style={web.text}>Chart controls</Text>
                            <ModeSelector mode={mode} setMode={setMode} />
                            <MonthSelector month={month} setMonth={setMonth} />
                            <DaySelector day={day} setDay={setDay} dates={dates} />
                            <YearSelector year={year} setYear={setYear} />
                            <FormButton />
                        </SmallBox>
                    </VStack>
                </HStack>
            </Background>
        )
    }
}

export default WeatherStation;
import React from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { HStack, Text } from '@gluestack-ui/themed';
import WeatherIcon from '../icons/weatherIcon';

const WeatherInfo = ({ neighborhood, countryName, precipRate, temp, weatherText, windSpeed, windGust, humidity }: {
    neighborhood: string;
    countryName: string;
    precipRate: number | null;
    temp: number;
    weatherText: string;
    windSpeed: number;
    windGust: number;
    humidity: number;
}) => (
    <>
        <Text style={{ fontSize: 20, color: 'white', marginBottom: 20 }}>
            {neighborhood}, <Text style={{ fontSize: 18, color: 'lightgray' }}>{countryName}</Text>
        </Text>

        {precipRate !== null && <WeatherIcon precipRate={precipRate} />}

        <Text style={{ fontSize: 40, color: 'white', marginTop: 20, marginBottom: 5 }}>{temp}°</Text>
        <Text style={{ fontSize: 20, color: 'lightgray', marginBottom: 20 }}>{weatherText}</Text>

        <HStack style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="wind" size={20} color="white" style={{ paddingRight: 10 }} />
            <Text style={{ fontSize: 20, color: 'white', marginRight: 40 }}>{windSpeed} / {windGust} km/h</Text>

            <Ionicons name="water-outline" size={20} color="white" style={{ paddingRight: 10 }} />
            <Text style={{ fontSize: 20, color: 'white' }}>{humidity}%</Text>
        </HStack>
    </>
);

export default WeatherInfo;
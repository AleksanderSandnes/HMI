const axios = require('axios');
const { Historical, Current } = require('../models/weatherModels');

const BASE_URL = 'https://api.weather.com/v2/pws';

const fetchHourlyWeather = async (date) => {
    const historicalData = await Historical.findOne({ date });

    if (historicalData) {
        return historicalData;
    } else {
        const weatherResponse = await axios.get(`${BASE_URL}/history/hourly?stationId=ISANDN24&format=json&units=m&date=${date}&apiKey=${process.env.WEATHER_API_KEY}`);
        const newHistoricalData = new Historical(weatherResponse.data);
        // await newHistoricalData.save();
        return weatherResponse.data;
    }
};

const fetchDailyWeather = async (date) => {
    const historicalData = await Historical.findOne({ date });

    if (historicalData) {
        return historicalData;
    } else {
        const weatherResponse = await axios.get(`${BASE_URL}/history/daily?stationId=ISANDN24&format=json&units=m&date=${date}&apiKey=${process.env.WEATHER_API_KEY}`);
        const newHistoricalData = new Historical(weatherResponse.data);
        // await newHistoricalData.save();
        return weatherResponse.data;
    }
};

const fetchAllWeather = async (date) => {
    const historicalData = await Historical.findOne({ date });

    if (historicalData) {
        return historicalData;
    } else {
        const weatherResponse = await axios.get(`${BASE_URL}/history/all?stationId=ISANDN24&format=json&units=m&date=${date}&apiKey=${process.env.WEATHER_API_KEY}`);
        const newHistoricalData = new Historical(weatherResponse.data);
        // await newHistoricalData.save();
        return weatherResponse.data;
    }
};

const fetchCurrentWeather = async () => {
    const weatherResponse = await axios.get(`${BASE_URL}/observations/current?stationId=ISANDN24&format=json&units=m&apiKey=${process.env.WEATHER_API_KEY}`);
    const newCurrentData = new Current(weatherResponse.data);
    // await newCurrentData.save();
    return weatherResponse.data;
};

const fetchDailySummary = async () => {
    const weatherResponse = await axios.get(`${BASE_URL}/dailysummary/7day?stationId=ISANDN24&format=json&units=m&apiKey=${process.env.WEATHER_API_KEY}`);
    const newHistoricalData = new Historical(weatherResponse.data);
    // await newHistoricalData.save();
    return weatherResponse.data;
};

const fetchRecentDayWeather = async () => {
    const weatherResponse = await axios.get(`${BASE_URL}/observations/all/1day?stationId=ISANDN24&format=json&units=m&apiKey=${process.env.WEATHER_API_KEY}`);
    const newHistoricalData = new Historical(weatherResponse.data);
    // await newHistoricalData.save();
    return weatherResponse.data;
};

const fetch7DayHourlyWeather = async () => {
    const weatherResponse = await axios.get(`${BASE_URL}/observations/hourly/7day?stationId=ISANDN24&format=json&units=m&apiKey=${process.env.WEATHER_API_KEY}`);
    const newHistoricalData = new Historical(weatherResponse.data);
    // await newHistoricalData.save();
    return weatherResponse.data;
};

module.exports = {
    fetchHourlyWeather,
    fetchDailyWeather,
    fetchAllWeather,
    fetchCurrentWeather,
    fetchDailySummary,
    fetchRecentDayWeather,
    fetch7DayHourlyWeather
};
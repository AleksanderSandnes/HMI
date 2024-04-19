const axios = require("axios");
const { Historical, Current } = require("../models/weatherModels");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;
const uri = `mongodb+srv://${db_username}:${db_password}@hmi.g7qbf6h.mongodb.net/?retryWrites=true&w=majority&appName=HMI`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const BASE_URL = "https://api.weather.com/v2/pws";

const fetchHourlyWeather = async (date) => {
  const historicalData = await Historical.findOne({ date });

  if (historicalData) {
    return historicalData;
  } else {
    const weatherResponse = await axios.get(
      `${BASE_URL}/history/hourly?stationId=ISANDN24&format=json&units=m&date=${date}&apiKey=${process.env.WEATHER_API_KEY}`
    );
    const newHistoricalData = new Historical(weatherResponse.data);
    // await newHistoricalData.save();
    return weatherResponse.data;
  }
};

const fetchDailyWeather = async (date) => {
  try {
    await client.connect();
    await client.db("HMI").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const collection = client.db("HMI").collection("weather_data");

    let data = await collection.findOne({ date: date });

    if (!data) {
      data = await axios.get(
        `${BASE_URL}/history/daily?stationId=ISANDN24&format=json&units=m&date=${date}&apiKey=${process.env.WEATHER_API_KEY}`
      );
      await collection.insertOne({ ...data, date: date });
    }

    res.status(200).json(data);
  } finally {
    if (client) {
      await client.close();
    }
  }
};

const fetchAllWeather = async (date) => {
  try {
    await client.connect();

    const collection = client.db("HMI").collection("weather_data");

    const today = new Date();
    const formattedToday = `${today.getFullYear()}${String(
      today.getMonth() + 1
    ).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;

    let dbData = await collection.findOne({ date: date });

    if (!dbData || date === formattedToday) {
      const isToday = date === formattedToday;
      const endpoint = isToday ? "/observations/all/1day" : "/history/all";
      const url = isToday
        ? `${BASE_URL}${endpoint}?stationId=ISANDN24&format=json&units=m&numericPrecision=decimal&apiKey=${process.env.WEATHER_API_KEY}`
        : `${BASE_URL}${endpoint}?stationId=ISANDN24&format=json&units=m&date=${date}&numericPrecision=decimal&apiKey=${process.env.WEATHER_API_KEY}`;

      const response = await axios.get(url);
      const apiData = new Historical(response.data);

      if (!dbData) {
        await collection.insertOne({
          observations: apiData.observations,
          date: date,
        });
      } else if (
        dbData.observations.length !== response.data.observations.length
      ) {
        await collection.updateOne(
          { date: date },
          { $set: { observations: response.data.observations } }
        );
        console.log("Updated data in DB:");
      }

      dbData = await collection.findOne({ date: date });
      console.log("Fetched updated data from DB:");
    }

    return dbData;
  } finally {
    if (client) {
      await client.close();
    }
  }
};

const fetchCurrentWeather = async () => {
  const weatherResponse = await axios.get(
    `${BASE_URL}/observations/current?stationId=ISANDN24&format=json&units=m&numericPrecision=decimal&apiKey=${process.env.WEATHER_API_KEY}`
  );
  const newCurrentData = new Current(weatherResponse.data);
  // await newCurrentData.save();
  return weatherResponse.data;
};

const fetchDailySummary = async () => {
  const weatherResponse = await axios.get(
    `${BASE_URL}/dailysummary/7day?stationId=ISANDN24&format=json&units=m&apiKey=${process.env.WEATHER_API_KEY}`
  );
  const newHistoricalData = new Historical(weatherResponse.data);
  // await newHistoricalData.save();
  return weatherResponse.data;
};

const fetchRecentDayWeather = async () => {
  const weatherResponse = await axios.get(
    `${BASE_URL}/observations/all/1day?stationId=ISANDN24&format=json&units=m&apiKey=${process.env.WEATHER_API_KEY}`
  );
  const newHistoricalData = new Historical(weatherResponse.data);
  // await newHistoricalData.save();
  return weatherResponse.data;
};

const fetch7DayHourlyWeather = async () => {
  const weatherResponse = await axios.get(
    `${BASE_URL}/observations/hourly/7day?stationId=ISANDN24&format=json&units=m&apiKey=${process.env.WEATHER_API_KEY}`
  );
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
  fetch7DayHourlyWeather,
};

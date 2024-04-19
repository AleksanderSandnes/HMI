const {
  fetchHourlyWeather,
  fetchDailyWeather,
  fetchAllWeather,
  fetchCurrentWeather,
  fetchDailySummary,
  fetchRecentDayWeather,
  fetch7DayHourlyWeather,
} = require("../services/weatherService");

const getHourlyWeather = async (req, res) => {
  try {
    const weatherData = await fetchHourlyWeather(req.params.date);
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hourly weather data" });
  }
};

const getDailyWeather = async (req, res) => {
  try {
    const weatherData = await fetchDailyWeather(req.params.date);
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching daily weather data" });
  }
};

const getAllWeather = async (req, res) => {
  try {
    const weatherData = await fetchAllWeather(req.params.date);
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching all weather data" });
  }
};

const getCurrentWeather = async (_req, res) => {
  try {
    const weatherData = await fetchCurrentWeather();
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching current weather" });
  }
};

const getDailySummary = async (_req, res) => {
  try {
    const weatherData = await fetchDailySummary();
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching 7-day weather summary" });
  }
};

const getRecentDayWeather = async (_req, res) => {
  try {
    const weatherData = await fetchRecentDayWeather();
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching recent weather data" });
  }
};

const get7DayHourlyWeather = async (_req, res) => {
  try {
    const weatherData = await fetch7DayHourlyWeather();
    res.json(weatherData);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching 7-day hourly weather data" });
  }
};

module.exports = {
  getHourlyWeather,
  getDailyWeather,
  getAllWeather,
  getCurrentWeather,
  getDailySummary,
  getRecentDayWeather,
  get7DayHourlyWeather,
};

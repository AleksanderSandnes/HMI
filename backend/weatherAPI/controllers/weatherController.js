const {
  fetchHourlyWeather,
  fetchDailyWeather,
  fetchAllWeather,
  fetchCurrentWeather,
  fetchDailySummary,
  fetchWeeklyData,
  fetchMonthlyHistoricalData,
  fetchYearlyHistoricalData,
  getOptimalEndpointForTimeRange,
} = require('../services/weatherService');

const getHourlyWeather = async (req, res) => {
  try {
    const userId = req.user; // Get user ID from authentication middleware
    const weatherData = await fetchHourlyWeather(req.params.date, userId);
    res.json(weatherData);
  } catch (error) {
    console.error(
      '[WeatherController] Error fetching hourly weather data:',
      error
    );
    res.status(500).json({
      message: 'Error fetching hourly weather data',
      error: error.message,
    });
  }
};

const getDailyWeather = async (req, res) => {
  try {
    const userId = req.user; // Get user ID from authentication middleware
    const weatherData = await fetchDailyWeather(req.params.date, userId);
    res.json(weatherData);
  } catch (error) {
    console.error(
      '[WeatherController] Error fetching daily weather data:',
      error
    );
    res.status(500).json({
      message: 'Error fetching daily weather data',
      error: error.message,
    });
  }
};

const getAllWeather = async (req, res) => {
  try {
    const userId = req.user; // Get user ID from authentication middleware
    const weatherData = await fetchAllWeather(req.params.date, userId);
    res.json(weatherData);
  } catch (error) {
    console.error(
      '[WeatherController] Error fetching all weather data:',
      error
    );
    res.status(500).json({
      message: 'Error fetching all weather data',
      error: error.message,
    });
  }
};

const getCurrentWeather = async (req, res) => {
  try {
    const userId = req.user; // Get user ID from authentication middleware
    const weatherData = await fetchCurrentWeather(userId);
    res.json(weatherData);
  } catch (error) {
    console.error('[WeatherController] Error fetching current weather:', error);
    res.status(500).json({
      message: 'Error fetching current weather',
      error: error.message,
    });
  }
};

// New optimized controller functions
const getWeeklyWeather = async (req, res) => {
  try {
    const userId = req.user; // Get user ID from authentication middleware
    const weatherData = await fetchWeeklyData(userId);
    res.json(weatherData);
  } catch (error) {
    console.error(
      '[WeatherController] Error fetching weekly weather data:',
      error
    );
    res.status(500).json({
      message: 'Error fetching weekly weather data',
      error: error.message,
    });
  }
};

// Utility endpoint to get optimal endpoint info for debugging
const getEndpointInfo = async (req, res) => {
  try {
    const { timeRange, date } = req.query;
    const endpointInfo = getOptimalEndpointForTimeRange(timeRange, date);
    res.json({
      timeRange,
      date,
      recommendation: endpointInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[WeatherController] Error getting endpoint info:', error);
    res.status(500).json({ message: 'Error getting endpoint information' });
  }
};

module.exports = {
  getHourlyWeather,
  getDailyWeather,
  getAllWeather,
  getCurrentWeather,
  getWeeklyWeather,
  getEndpointInfo,
};

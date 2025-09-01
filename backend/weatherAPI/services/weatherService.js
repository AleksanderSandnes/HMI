const axios = require('axios');
const { Historical, Current } = require('../models/weatherModels');
require('dotenv').config();
const client = require('../database/database');

const BASE_URL = 'https://api.weather.com/v2/pws';

// Get weather credentials from user settings or fallback to environment variables
const getWeatherCredentials = async (userId = null) => {
  const isProduction = process.env.NODE_ENV === 'production';
  let credentials = {
    apiKey: null,
    stationId: null,
  };

  // In production mode, only use user settings
  if (isProduction) {
    if (!userId) {
      throw new Error(
        'Weather API credentials required. Please log in and configure your weather API settings.'
      );
    }

    try {
      // Get user-specific weather settings from database
      const User = require('../models/User');
      const user = await User.findById(userId).select('apiSettings.weather');

      if (user?.apiSettings?.weather) {
        const { decrypt } = require('../utils/crypto');

        if (user.apiSettings.weather.apiKey) {
          try {
            credentials.apiKey = decrypt(user.apiSettings.weather.apiKey);
          } catch (error) {
            throw new Error(
              'Failed to decrypt weather API key. Please update your weather API settings.'
            );
          }
        }

        if (user.apiSettings.weather.stationId) {
          credentials.stationId = user.apiSettings.weather.stationId;
        }
      }

      if (!credentials.apiKey || !credentials.stationId) {
        throw new Error(
          'Weather API credentials not configured. Please set up your weather API credentials in Settings.'
        );
      }
    } catch (error) {
      console.error(
        '[Weather] Production mode: Failed to get user weather settings:',
        error.message
      );
      throw error;
    }
  } else {
    // Development mode: try user settings first, fallback to environment variables
    if (userId) {
      try {
        // Try to get user-specific weather settings from database
        const User = require('../models/User');
        const user = await User.findById(userId).select('apiSettings.weather');

        if (user?.apiSettings?.weather) {
          const { decrypt } = require('../utils/crypto');

          if (user.apiSettings.weather.apiKey) {
            try {
              credentials.apiKey = decrypt(user.apiSettings.weather.apiKey);
              console.log(
                '[Weather] Development mode: Using user-configured API key'
              );
            } catch (error) {
              console.warn(
                '[Weather] Development mode: Failed to decrypt user weather API key, using environment variable'
              );
            }
          }

          if (user.apiSettings.weather.stationId) {
            credentials.stationId = user.apiSettings.weather.stationId;
            console.log(
              '[Weather] Development mode: Using user-configured station ID'
            );
          }
        }
      } catch (error) {
        console.warn(
          '[Weather] Development mode: Failed to get user weather settings, using environment variables:',
          error.message
        );
      }
    }

    // Fallback to environment variables in development mode
    if (!credentials.apiKey) {
      credentials.apiKey = process.env.WEATHER_API_KEY;
      console.log(
        '[Weather] Development mode: Using environment variable API key'
      );
    }

    if (!credentials.stationId) {
      credentials.stationId = process.env.WEATHER_STATION_ID || 'ISANDN24';
      console.log(
        '[Weather] Development mode: Using environment variable station ID'
      );
    }
  }

  if (!credentials.apiKey) {
    const errorMessage = isProduction
      ? 'Weather API key not configured. Please set up your weather API credentials in Settings.'
      : 'Weather API key not available. Please check user settings or environment variables.';
    console.error('[Weather] No API key available');
    throw new Error(errorMessage);
  }

  if (!credentials.stationId) {
    const errorMessage = isProduction
      ? 'Weather station ID not configured. Please set up your weather station ID in Settings.'
      : 'Weather station ID not available. Please check user settings or environment variables.';
    console.error('[Weather] No station ID available');
    throw new Error(errorMessage);
  }

  console.log(
    `[Weather] Using credentials - Mode: ${isProduction ? 'production' : 'development'}, Station: ${credentials.stationId}`
  );
  return credentials;
};

// Optimal endpoint mapping based on Weather.com API documentation
const PWS_ENDPOINTS = {
  // Current weather - most accurate real-time data
  CURRENT: '/observations/current',

  // Hourly data - best for same-day hourly breakdown
  HOURLY: '/history/hourly',

  // Daily historical - best for specific date all observations
  DAILY_ALL: '/history/all',

  // Recent observations - best for recent 24-48 hour data
  RECENT_DAY: '/observations/all/1day',

  // Daily summaries - best for weekly/monthly aggregate data
  DAILY_SUMMARY: '/dailysummary/7day',

  // NOTE: /observations/hourly/7day endpoint appears unreliable
  // Using /dailysummary/7day instead for weekly data
};

const fetchHourlyWeather = async (date, userId = null) => {
  const historicalData = await Historical.findOne({ date });

  if (historicalData) {
    return historicalData;
  } else {
    const credentials = await getWeatherCredentials(userId);

    // Use hourly endpoint for specific date hourly data
    const weatherResponse = await axios.get(
      `${BASE_URL}${PWS_ENDPOINTS.HOURLY}?stationId=${credentials.stationId}&format=json&units=m&date=${date}&apiKey=${credentials.apiKey}`
    );
    const newHistoricalData = new Historical(weatherResponse.data);
    // await newHistoricalData.save();
    return weatherResponse.data;
  }
};

const fetchDailyWeather = async (date, userId = null) => {
  try {
    await client.connect();
    await client.db('HMI').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );

    const collection = client.db('HMI').collection('weather_data');

    let data = await collection.findOne({ date: date });

    if (!data) {
      const credentials = await getWeatherCredentials(userId);

      // Use daily/all endpoint for comprehensive daily data
      const response = await axios.get(
        `${BASE_URL}${PWS_ENDPOINTS.DAILY_ALL}?stationId=${credentials.stationId}&format=json&units=m&date=${date}&numericPrecision=decimal&apiKey=${credentials.apiKey}`
      );
      data = response.data;
      await collection.insertOne({ ...data, date: date });
    }

    return data;
  } finally {
    if (client) {
      await client.close();
    }
  }
};

const fetchAllWeather = async (date, userId = null) => {
  try {
    await client.connect();

    const collection = client.db('HMI').collection('weather_data');

    const today = new Date();
    const formattedToday = `${today.getFullYear()}${String(
      today.getMonth() + 1
    ).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    let dbData = await collection.findOne({ date: date });

    if (!dbData || date === formattedToday) {
      const credentials = await getWeatherCredentials(userId);

      const isToday = date === formattedToday;
      // Use optimal endpoints based on whether it's today or historical
      const endpoint = isToday
        ? PWS_ENDPOINTS.RECENT_DAY
        : PWS_ENDPOINTS.DAILY_ALL;
      const url = isToday
        ? `${BASE_URL}${endpoint}?stationId=${credentials.stationId}&format=json&units=m&numericPrecision=decimal&apiKey=${credentials.apiKey}`
        : `${BASE_URL}${endpoint}?stationId=${credentials.stationId}&format=json&units=m&date=${date}&numericPrecision=decimal&apiKey=${credentials.apiKey}`;

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
          { $set: { observations: response.data.observations } },
          { upsert: true }
        );
      }

      dbData = await collection.findOne({ date: date });
    }

    return dbData;
  } finally {
    if (client) {
      await client.close();
    }
  }
};

const fetchCurrentWeather = async (userId = null) => {
  const credentials = await getWeatherCredentials(userId);

  const weatherResponse = await axios.get(
    `${BASE_URL}${PWS_ENDPOINTS.CURRENT}?stationId=${credentials.stationId}&format=json&units=m&numericPrecision=decimal&apiKey=${credentials.apiKey}`
  );
  const newCurrentData = new Current(weatherResponse.data);
  // await newCurrentData.save();
  return weatherResponse.data;
};

const fetchDailySummary = async (userId = null) => {
  const credentials = await getWeatherCredentials(userId);

  const weatherResponse = await axios.get(
    `${BASE_URL}${PWS_ENDPOINTS.DAILY_SUMMARY}?stationId=${credentials.stationId}&format=json&units=m&apiKey=${credentials.apiKey}`
  );
  const newHistoricalData = new Historical(weatherResponse.data);
  // await newHistoricalData.save();
  return weatherResponse.data;
};

// Additional optimized functions for better time range coverage
const fetchWeeklyData = async (userId = null) => {
  // Use daily summary for weekly aggregated data (most reliable)
  return await fetchDailySummary(userId);
};

// New function to fetch weekly hourly data for all hours
const fetchWeeklyHourlyData = async (selectedDate, userId = null) => {
  console.log(
    `[Weather] Fetching weekly hourly data for date: ${selectedDate}`
  );

  // Parse YYYYMMDD format correctly
  const year = parseInt(selectedDate.slice(0, 4));
  const month = parseInt(selectedDate.slice(4, 6)) - 1; // Month is 0-indexed
  const day = parseInt(selectedDate.slice(6, 8));

  console.log(
    `[Weather] Parsed date: Year=${year}, Month=${month + 1}, Day=${day}`
  );

  // Calculate week dates (Sunday to Saturday)
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - dayOfWeek); // Go to Sunday of this week

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const weekDate = new Date(startDate);
    weekDate.setDate(startDate.getDate() + i);
    const formattedDate = `${weekDate.getFullYear()}${String(weekDate.getMonth() + 1).padStart(2, '0')}${String(weekDate.getDate()).padStart(2, '0')}`;
    weekDates.push(formattedDate);
  }

  console.log(`[Weather] Week dates for ${selectedDate}:`, weekDates);

  const credentials = await getWeatherCredentials(userId);
  let weeklyData = [];

  // Fetch hourly data for each day of the week
  for (const dateStr of weekDates) {
    try {
      console.log(`[Weather] Fetching hourly data for ${dateStr}`);

      const weatherResponse = await axios.get(
        `${BASE_URL}${PWS_ENDPOINTS.HOURLY}?stationId=${credentials.stationId}&format=json&units=m&date=${dateStr}&apiKey=${credentials.apiKey}`
      );

      if (weatherResponse.data && weatherResponse.data.observations) {
        // Include all hourly observations (no filtering)
        const allObservations = weatherResponse.data.observations;

        console.log(
          `[Weather] ${dateStr}: ${allObservations.length} hourly observations`
        );
        weeklyData = weeklyData.concat(allObservations);
      }
    } catch (error) {
      console.error(
        `[Weather] Error fetching data for ${dateStr}:`,
        error.message
      );
      // Continue with other dates even if one fails
    }
  }

  console.log(`[Weather] Total weekly hourly records: ${weeklyData.length}`);

  return {
    weeklyData: weeklyData,
    observations: weeklyData, // For backward compatibility
    selectedDate: selectedDate,
    weekDates: weekDates,
  };
};

const fetchMonthlyData = async (userId = null) => {
  // For monthly data, we'll use daily summary as PWS API has limited historical range
  // In a production environment, you might want to aggregate multiple daily summary calls
  console.info(
    '[MONTHLY] Using 7-day summary as PWS API has limited monthly historical data'
  );
  return await fetchDailySummary(userId);
};

const fetchYearlyData = async (userId = null) => {
  // For yearly data, we'll use daily summary as PWS API has limited historical range
  // In a production environment, you might want to aggregate multiple daily summary calls
  console.info(
    '[YEARLY] Using 7-day summary as PWS API has limited yearly historical data'
  );
  return await fetchDailySummary(userId);
};

// Utility function to get the best endpoint for a given time range
const getOptimalEndpointForTimeRange = (timeRange, date) => {
  switch (timeRange.toLowerCase()) {
    case 'hourly':
      return {
        endpoint: PWS_ENDPOINTS.HOURLY,
        params: { date },
        description: 'Hourly historical data for specific date',
      };
    case 'daily':
      return {
        endpoint: PWS_ENDPOINTS.DAILY_ALL,
        params: { date },
        description: 'All observations for specific date',
      };
    case 'weekly':
      return {
        endpoint: PWS_ENDPOINTS.DAILY_SUMMARY,
        params: {},
        description: '7-day daily summary (best available for weekly view)',
      };
    case 'current':
      return {
        endpoint: PWS_ENDPOINTS.CURRENT,
        params: {},
        description: 'Current weather observations',
      };
    case 'recent':
      return {
        endpoint: PWS_ENDPOINTS.RECENT_DAY,
        params: {},
        description: 'Recent 24-hour observations',
      };
    default:
      return {
        endpoint: PWS_ENDPOINTS.DAILY_ALL,
        params: { date },
        description: 'Default: All observations for specific date',
      };
  }
};

module.exports = {
  fetchHourlyWeather,
  fetchDailyWeather,
  fetchAllWeather,
  fetchCurrentWeather,
  fetchDailySummary,
  fetchWeeklyData,
  fetchWeeklyHourlyData,
  getOptimalEndpointForTimeRange,
  getWeatherCredentials, // Export for testing and API endpoint use
};

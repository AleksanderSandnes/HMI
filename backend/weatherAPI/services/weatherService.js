const axios = require("axios");
const { Historical, Current } = require("../models/weatherModels");
require("dotenv").config();
const client = require("../database/database");
const {
  PWS_ENDPOINTS,
  toYyyyMmDd,
  getSelectedDateParts,
  getWeekDatesFromDateParts,
  getOptimalEndpointForTimeRange,
} = require("./weatherHelpers");

const BASE_URL = "https://api.weather.com/v2/pws";

// Get weather credentials from user settings or fallback to environment variables
const getWeatherCredentials = async (userId = null) => {
  const isProduction = process.env.NODE_ENV === "production";
  let credentials = {
    apiKey: null,
    stationId: null,
  };

  // In production mode, only use user settings
  if (isProduction) {
    if (!userId) {
      throw new Error(
        "Weather API credentials required. Please log in and configure your weather API settings.",
      );
    }

    try {
      // Get user-specific weather settings from database
      const User = require("../models/User");
      const user = await User.findById(userId).select("apiSettings.weather");

      if (user?.apiSettings?.weather) {
        const { decrypt } = require("../utils/crypto");

        if (user.apiSettings.weather.apiKey) {
          try {
            credentials.apiKey = decrypt(user.apiSettings.weather.apiKey);
          } catch (error) {
            throw new Error(
              "Failed to decrypt weather API key. Please update your weather API settings.",
            );
          }
        }

        if (user.apiSettings.weather.stationId) {
          credentials.stationId = user.apiSettings.weather.stationId;
        }
      }

      if (!credentials.apiKey || !credentials.stationId) {
        throw new Error(
          "Weather API credentials not configured. Please set up your weather API credentials in Settings.",
        );
      }
    } catch (error) {
      console.error(
        "[Weather] Production mode: Failed to get user weather settings:",
        error.message,
      );
      throw error;
    }
  } else {
    // Development mode: try user settings first, fallback to environment variables
    if (userId) {
      try {
        // Try to get user-specific weather settings from database
        const User = require("../models/User");
        const user = await User.findById(userId).select("apiSettings.weather");

        if (user?.apiSettings?.weather) {
          const { decrypt } = require("../utils/crypto");

          if (user.apiSettings.weather.apiKey) {
            try {
              credentials.apiKey = decrypt(user.apiSettings.weather.apiKey);
              console.log("[Weather] Development mode: Using user-configured API key");
            } catch (error) {
              console.warn(
                "[Weather] Development mode: Failed to decrypt user weather API key, using environment variable",
              );
            }
          }

          if (user.apiSettings.weather.stationId) {
            credentials.stationId = user.apiSettings.weather.stationId;
            console.log("[Weather] Development mode: Using user-configured station ID");
          }
        }
      } catch (error) {
        console.warn(
          "[Weather] Development mode: Failed to get user weather settings, using environment variables:",
          error.message,
        );
      }
    }

    // Fallback to environment variables in development mode
    if (!credentials.apiKey) {
      credentials.apiKey = process.env.WEATHER_API_KEY;
      console.log("[Weather] Development mode: Using environment variable API key");
    }

    if (!credentials.stationId) {
      credentials.stationId = process.env.WEATHER_STATION_ID || "ISANDN24";
      console.log("[Weather] Development mode: Using environment variable station ID");
    }
  }

  if (!credentials.apiKey) {
    const errorMessage = isProduction
      ? "Weather API key not configured. Please set up your weather API credentials in Settings."
      : "Weather API key not available. Please check user settings or environment variables.";
    console.error("[Weather] No API key available");
    throw new Error(errorMessage);
  }

  if (!credentials.stationId) {
    const errorMessage = isProduction
      ? "Weather station ID not configured. Please set up your weather station ID in Settings."
      : "Weather station ID not available. Please check user settings or environment variables.";
    console.error("[Weather] No station ID available");
    throw new Error(errorMessage);
  }

  console.log(
    `[Weather] Using credentials - Mode: ${isProduction ? "production" : "development"}, Station: ${credentials.stationId}`,
  );
  return credentials;
};

// Today and yesterday as YYYYMMDD (local time). Neither is persisted to the cache:
// today is still in progress, and yesterday is backfilled by a daily background job.
const getTodayAndYesterday = () => {
  const now = new Date();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  return { today: toYyyyMmDd(now), yesterday: toYyyyMmDd(yesterdayDate) };
};

/**
 * Hourly observations for a single day with a transparent MongoDB cache.
 *
 * Cache-aside keyed by (stationId, date):
 *  - Today: always fetched live, never cached (the day is still in progress).
 *  - Yesterday: read from the cache if present, otherwise fetched live but NOT saved
 *    (a daily background job backfills yesterday's data).
 *  - Older past days: read from the cache first; on a miss they are fetched live and saved.
 *  - Empty responses (no observations) are never saved.
 *
 * Only the schema-whitelisted fields (temp, wind, rain, pressure, solar, uv, ...) are
 * stored. Returns the observations array for the day. Shared by the hourly and weekly
 * (7-day hourly) paths so both use the same cache and rules. Because each day is resolved
 * independently, a partial week (some days cached, some missing) transparently reads the
 * cached days, fetches + saves the missing ones, and the caller combines them.
 */
const getHourlyObservationsForDay = async (date, stationId, apiKey, today, yesterday) => {
  const fetchLive = async () => {
    const weatherResponse = await axios.get(
      `${BASE_URL}${PWS_ENDPOINTS.HOURLY}?stationId=${stationId}&format=json&units=m&date=${date}&apiKey=${apiKey}`,
    );
    return weatherResponse.data?.observations || [];
  };

  // Today is incomplete - always go live, never cache.
  if (date === today) {
    console.log(`[Weather] Hourly ${stationId}/${date} is today -> live fetch (no cache)`);
    return await fetchLive();
  }

  // 1) Try the cache first.
  const cached = await Historical.findOne({ stationId, date });
  if (cached) {
    console.log(`[Weather] Hourly cache HIT ${stationId}/${date}`);
    return cached.observations || [];
  }

  // 2) Cache miss -> fetch live.
  console.log(`[Weather] Hourly cache MISS ${stationId}/${date} -> calling Weather.com`);
  const observations = await fetchLive();

  // 3) Save completed past days that actually contain data, but never persist
  //    yesterday (a daily background job backfills it) or empty responses.
  const shouldPersist = date !== yesterday;
  if (observations.length > 0 && shouldPersist) {
    try {
      await new Historical({
        date,
        stationId,
        observations,
        cachedAt: new Date(),
      }).save();
      console.log(`[Weather] Hourly cache SAVE ${stationId}/${date} (${observations.length} obs)`);
    } catch (error) {
      // Never let a cache write break the request (e.g. duplicate-key race).
      console.warn(`[Weather] Hourly cache save failed for ${stationId}/${date}: ${error.message}`);
    }
  } else if (!shouldPersist) {
    console.log(
      `[Weather] Hourly ${stationId}/${date} is yesterday -> not cached (background job will backfill)`,
    );
  } else {
    console.log(`[Weather] Hourly ${stationId}/${date} has no observations -> not cached`);
  }

  return observations;
};

/**
 * Hourly weather for a specific day, served through the shared cache-aside helper.
 */
const fetchHourlyWeather = async (date, userId = null) => {
  const credentials = await getWeatherCredentials(userId);
  const { today, yesterday } = getTodayAndYesterday();
  const observations = await getHourlyObservationsForDay(
    date,
    credentials.stationId,
    credentials.apiKey,
    today,
    yesterday,
  );
  return { observations };
};

const fetchAllWeather = async (date, userId = null) => {
  try {
    await client.connect();

    const collection = client.db("HMI").collection("weather_data");

    const today = new Date();
    const formattedToday = toYyyyMmDd(today);

    let dbData = await collection.findOne({ date: date });

    if (!dbData || date === formattedToday) {
      const credentials = await getWeatherCredentials(userId);

      const isToday = date === formattedToday;
      // Use optimal endpoints based on whether it's today or historical
      const endpoint = isToday ? PWS_ENDPOINTS.RECENT_DAY : PWS_ENDPOINTS.DAILY_ALL;
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
      } else if (dbData.observations.length !== response.data.observations.length) {
        await collection.updateOne(
          { date: date },
          { $set: { observations: response.data.observations } },
          { upsert: true },
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
    `${BASE_URL}${PWS_ENDPOINTS.CURRENT}?stationId=${credentials.stationId}&format=json&units=m&numericPrecision=decimal&apiKey=${credentials.apiKey}`,
  );
  const newCurrentData = new Current(weatherResponse.data);
  // await newCurrentData.save();
  return weatherResponse.data;
};

const fetchDailySummary = async (userId = null) => {
  const credentials = await getWeatherCredentials(userId);

  const weatherResponse = await axios.get(
    `${BASE_URL}${PWS_ENDPOINTS.DAILY_SUMMARY}?stationId=${credentials.stationId}&format=json&units=m&apiKey=${credentials.apiKey}`,
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
  console.log(`[Weather] Fetching weekly hourly data for date: ${selectedDate}`);

  const { year, month, day } = getSelectedDateParts(selectedDate);

  console.log(`[Weather] Parsed date: Year=${year}, Month=${month + 1}, Day=${day}`);

  const weekDates = getWeekDatesFromDateParts(year, month, day);

  console.log(`[Weather] Week dates for ${selectedDate}:`, weekDates);

  const credentials = await getWeatherCredentials(userId);
  const { today, yesterday } = getTodayAndYesterday();
  let weeklyData = [];

  // Fetch hourly data for each day of the week, served through the shared cache
  // (today/yesterday are fetched live and not saved; older days are read from /
  // written to historical_weather). A partial week reads the cached days and
  // fetches + saves only the missing ones, then they are combined below.
  for (const dateStr of weekDates) {
    try {
      const dayObservations = await getHourlyObservationsForDay(
        dateStr,
        credentials.stationId,
        credentials.apiKey,
        today,
        yesterday,
      );

      console.log(`[Weather] ${dateStr}: ${dayObservations.length} hourly observations`);
      weeklyData = weeklyData.concat(dayObservations);
    } catch (error) {
      console.error(`[Weather] Error fetching data for ${dateStr}:`, error.message);
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
  console.info("[MONTHLY] Using 7-day summary as PWS API has limited monthly historical data");
  return await fetchDailySummary(userId);
};

const fetchYearlyData = async (userId = null) => {
  // For yearly data, we'll use daily summary as PWS API has limited historical range
  // In a production environment, you might want to aggregate multiple daily summary calls
  console.info("[YEARLY] Using 7-day summary as PWS API has limited yearly historical data");
  return await fetchDailySummary(userId);
};

/**
 * Backfill YESTERDAY's data into the persistent caches. The normal cache-aside paths
 * deliberately never save "yesterday" (see getHourlyObservationsForDay), leaving it for
 * this daily background job:
 *   - Hourly observations are force-upserted into `historical_weather` (feeds the hourly
 *     and weekly views).
 *   - All-observations are saved into `weather_data` via fetchAllWeather (saves for any
 *     non-today date).
 * Returns a small summary used by the cron to build a notification. Throws on credential
 * or hourly-fetch failure so the cron can record an error notification.
 */
const backfillYesterday = async (userId = null) => {
  const credentials = await getWeatherCredentials(userId);
  const { yesterday } = getTodayAndYesterday();
  const result = {
    date: yesterday,
    stationId: credentials.stationId,
    hourlyObservations: 0,
    allSaved: false,
  };

  // 1) Hourly -> historical_weather (force upsert; cache path skips yesterday).
  const hourlyResponse = await axios.get(
    `${BASE_URL}${PWS_ENDPOINTS.HOURLY}?stationId=${credentials.stationId}&format=json&units=m&date=${yesterday}&apiKey=${credentials.apiKey}`,
  );
  const observations = hourlyResponse.data?.observations || [];
  result.hourlyObservations = observations.length;

  if (observations.length > 0) {
    await Historical.findOneAndUpdate(
      { stationId: credentials.stationId, date: yesterday },
      { $set: { observations, cachedAt: new Date() } },
      { upsert: true, setDefaultsOnInsert: true },
    );
    console.log(
      `[Weather] Backfilled hourly ${credentials.stationId}/${yesterday} (${observations.length} obs)`,
    );
  } else {
    console.log(
      `[Weather] Backfill: no hourly observations for ${credentials.stationId}/${yesterday}`,
    );
  }

  // 2) All observations -> weather_data (fetchAllWeather persists non-today dates).
  try {
    const all = await fetchAllWeather(yesterday, userId);
    result.allSaved = Boolean(all);
  } catch (error) {
    console.warn(`[Weather] Backfill all-observations failed: ${error.message}`);
    result.allError = error.message;
  }

  return result;
};

module.exports = {
  fetchHourlyWeather,
  fetchAllWeather,
  fetchCurrentWeather,
  fetchDailySummary,
  fetchWeeklyData,
  fetchWeeklyHourlyData,
  getOptimalEndpointForTimeRange,
  getWeatherCredentials, // Export for testing and API endpoint use
  backfillYesterday, // Used by the daily background cron
};

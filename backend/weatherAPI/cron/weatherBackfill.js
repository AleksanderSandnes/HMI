const cron = require('node-cron');
const User = require('../models/User');
const { backfillYesterday } = require('../services/weatherService');
const { createNotification, sendExpoPush } = require('../services/notificationService');

const isProduction = () => (process.env.NODE_ENV || 'development') === 'production';

// YYYYMMDD -> YYYY-MM-DD for human-readable messages.
const prettyDate = (yyyymmdd) =>
  typeof yyyymmdd === 'string' && yyyymmdd.length === 8
    ? `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
    : yyyymmdd;

/**
 * Backfill yesterday's weather for a single user and record exactly one notification
 * (success / warning / error) plus a best-effort push. Never throws.
 */
async function backfillOne(user) {
  try {
    const summary = await backfillYesterday(user._id);
    const obs = summary.hourlyObservations;
    const ok = obs > 0 || summary.allSaved;
    const when = prettyDate(summary.date);

    await createNotification({
      userId: user._id,
      type: 'weather_sync',
      level: ok ? 'success' : 'warning',
      title: ok ? 'Weather data synced' : 'Weather sync finished — no data',
      message: ok
        ? `Saved ${obs} hourly observation${obs === 1 ? '' : 's'} for ${when} (station ${summary.stationId}).`
        : `No weather observations were available for ${when}.`,
      meta: summary,
    });

    await sendExpoPush(user.expoPushTokens, {
      title: ok ? 'Weather data synced' : 'Weather sync finished',
      body: ok
        ? `${obs} observation${obs === 1 ? '' : 's'} saved for ${when}.`
        : `No weather data was available for ${when}.`,
      data: { type: 'weather_sync' },
    });

    return { userId: String(user._id), ...summary, ok };
  } catch (error) {
    console.error(`[WeatherCron] Backfill failed for user ${user._id}: ${error.message}`);

    await createNotification({
      userId: user._id,
      type: 'weather_sync',
      level: 'error',
      title: 'Weather sync failed',
      message: error.message,
    });

    await sendExpoPush(user.expoPushTokens, {
      title: 'Weather sync failed',
      body: error.message,
      data: { type: 'weather_sync' },
    });

    return { userId: String(user._id), error: error.message, ok: false };
  }
}

// Run the backfill for one specific user (used by the dev trigger endpoint).
async function runWeatherBackfillForUser(userId) {
  const user = await User.findById(userId).select('expoPushTokens apiSettings.weather');
  if (!user) {
    throw new Error('User not found');
  }
  return backfillOne(user);
}

// Run the backfill for every relevant user. In production we only touch users that have a
// weather API key configured; in development the service falls back to env credentials, so
// all users are processed.
async function runWeatherBackfillForAll() {
  const filter = isProduction()
    ? { 'apiSettings.weather.apiKey': { $nin: [null, ''] } }
    : {};

  const users = await User.find(filter).select('expoPushTokens apiSettings.weather');
  console.log(`[WeatherCron] Starting backfill for ${users.length} user(s).`);

  const results = [];
  for (const user of users) {
    results.push(await backfillOne(user));
  }

  console.log('[WeatherCron] Backfill complete.');
  return results;
}

// Schedule the daily 00:01 backfill. node-cron fields: min hour day month weekday.
function scheduleWeatherBackfill() {
  cron.schedule('1 0 * * *', () => {
    console.log('[WeatherCron] Triggered by schedule (00:01).');
    runWeatherBackfillForAll().catch((error) =>
      console.error(`[WeatherCron] Scheduled run failed: ${error.message}`)
    );
  });
  console.log('[WeatherCron] Scheduled daily weather backfill at 00:01.');
}

module.exports = {
  scheduleWeatherBackfill,
  runWeatherBackfillForAll,
  runWeatherBackfillForUser,
};

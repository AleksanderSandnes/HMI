const { fetchPlantData } = require('../services/javaApiService');
const User = require('../models/User');
const { decrypt } = require('../utils/crypto');
require('dotenv').config();
const client = require('../database/database');

/**
 * Get Growatt credentials based on environment
 * Production: MongoDB user settings
 * Development: Environment variables
 */
async function getGrowattCredentials(userId = null) {
  const environment = process.env.NODE_ENV || 'development';

  console.log(
    `[SolarController] Getting credentials for ${environment} mode, userId: ${userId}`
  );

  if (environment === 'production') {
    if (!userId) {
      throw new Error('User authentication required in production mode');
    }
    try {
      // Production: Get from MongoDB user settings
      const user = await User.findById(userId).select('apiSettings');

      if (
        !user ||
        !user.apiSettings?.growatt?.email ||
        !user.apiSettings?.growatt?.encryptedPassword ||
        !user.apiSettings?.growatt?.plantId
      ) {
        throw new Error(
          'No Growatt credentials found in user settings. Please configure email, password, and plantId in Settings > API Credentials.'
        );
      }

      console.log(
        '[SolarController] ✅ Using MongoDB credentials (production mode)'
      );

      // Decrypt the password for API use
      const decryptedPassword = decrypt(
        user.apiSettings.growatt.encryptedPassword
      );

      return {
        username: user.apiSettings.growatt.email,
        password: decryptedPassword,
        plantId: user.apiSettings.growatt.plantId,
        hasCredentials: true,
        userId: userId,
      };
    } catch (error) {
      console.error(
        '[SolarController] Failed to get MongoDB credentials:',
        error
      );
      throw error;
    }
  } else {
    // Development: Use environment variables
    const username = process.env.GROWATT_USERNAME;
    const password = process.env.GROWATT_PASSWORD;
    const plantId = process.env.GROWATT_PLANT_ID;

    if (!username || !password || !plantId) {
      throw new Error(
        'Growatt credentials not found. Set GROWATT_USERNAME, GROWATT_PASSWORD, and GROWATT_PLANT_ID in environment variables.'
      );
    }

    console.log(
      '[SolarController] ⚠️ Using environment variable credentials (development mode)'
    );
    console.log(
      `[SolarController] Username: ${username ? '***SET***' : 'NOT SET'}`
    );
    console.log(
      `[SolarController] Password: ${password ? '***SET***' : 'NOT SET'}`
    );
    console.log(
      `[SolarController] PlantId: ${plantId ? '***SET***' : 'NOT SET'}`
    );
    return {
      username,
      password,
      plantId,
      hasCredentials: true,
    };
  }
}

const getDailySolar = async (req, res) => {
  try {
    // Get user ID from authentication middleware (if available)
    const userId = req.user;
    
    // Get JWT token from request headers
    const authHeader = req.headers.authorization;
    const jwtToken = authHeader ? authHeader.replace('Bearer ', '') : null;

    const credentials = await getGrowattCredentials(userId);
    const { username, password, plantId } = credentials;
    const date = new Date(req.params.date + 'T00:00:00Z');
    const formattedToday =
      new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

    try {
      await client.connect();

      const collection = client.db('HMI').collection('solar_data');

      let data = await collection.findOne({ date: date });

      if (!data || date.toISOString() === formattedToday) {
        console.log(
          '[SolarController] Fetching fresh data from Java Growatt API...'
        );
        // Pass JWT token to Java API service
        data = await fetchPlantData(username, password, plantId, date, jwtToken);
        if (data) {
          const operation =
            date.toISOString() === formattedToday
              ? collection.updateOne(
                  { date: date },
                  { $set: { ...data } },
                  { upsert: true }
                )
              : collection.insertOne({ ...data, date: date });
          await operation;
          data = await collection.findOne({ date: date });
        }
      }

      res.status(200).json(data);
    } finally {
      if (client) {
        await client.close();
      }
    }
  } catch (error) {
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: `Error retrieving day data: ${error.message}` });
    }
  }
};

module.exports = { getDailySolar };

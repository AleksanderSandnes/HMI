/**
 * API Settings Routes
 * Handles secure storage and retrieval of API credentials in MongoDB
 */

const express = require('express');
const bcrypt = require('bcrypt');
const isAuthenticated = require('../middleware/isAuth.js');
const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/crypto');
const router = express.Router();

/**
 * Get user's API settings
 * GET /api/settings/api
 */
router.get('/api', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('apiSettings');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return API settings without exposing sensitive data
    const apiSettings = {
      growatt: {
        email: user.apiSettings?.growatt?.email || '',
        plantId: user.apiSettings?.growatt?.plantId || '',
        hasPassword: !!user.apiSettings?.growatt?.encryptedPassword,
      },
      weather: {
        stationId: user.apiSettings?.weather?.stationId || '',
        hasApiKey: !!user.apiSettings?.weather?.apiKey,
      },
    };

    res.status(200).json({
      success: true,
      apiSettings,
    });
  } catch (error) {
    console.error('Error fetching API settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API settings',
    });
  }
});

/**
 * Update user's API settings
 * PUT /api/settings/api
 */
router.put('/api', isAuthenticated, async (req, res) => {
  try {
    console.log(
      '[API Settings] Received update request:',
      JSON.stringify(req.body, null, 2)
    );

    const { growatt, weather } = req.body;

    // Validate at least one setting is provided
    if (!growatt && !weather) {
      console.log('[API Settings] Error: No settings provided');
      return res.status(400).json({
        success: false,
        message: 'At least one API setting (growatt or weather) is required',
      });
    }

    const user = await User.findById(req.user);
    console.log('[API Settings] Found user:', user ? user.email : 'null');

    if (!user) {
      console.log('[API Settings] Error: User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Initialize apiSettings if it doesn't exist
    if (!user.apiSettings) {
      user.apiSettings = {};
    }

    // Update Growatt settings if provided
    if (growatt) {
      console.log(
        '[API Settings] Updating Growatt settings:',
        JSON.stringify(growatt, null, 2)
      );

      if (!growatt.email) {
        console.log('[API Settings] Error: Growatt email missing');
        return res.status(400).json({
          success: false,
          message: 'Growatt email is required',
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(growatt.email)) {
        console.log('[API Settings] Error: Invalid email format');
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }

      if (!user.apiSettings.growatt) {
        user.apiSettings.growatt = {};
      }

      user.apiSettings.growatt.email = growatt.email;
      user.apiSettings.growatt.plantId = growatt.plantId || '';
      console.log('[API Settings] Set email and plantId');

      // Only update password if provided
      if (growatt.password && growatt.password.trim()) {
        console.log('[API Settings] Encrypting password');
        // Use encryption (not hashing) so we can decrypt for API calls
        user.apiSettings.growatt.encryptedPassword = encrypt(
          growatt.password.trim()
        );
        console.log('[API Settings] Password encrypted successfully');
      }
    }

    // Update Weather settings if provided
    if (weather) {
      console.log(
        '[API Settings] Updating Weather settings:',
        JSON.stringify(weather, null, 2)
      );

      if (!user.apiSettings.weather) {
        user.apiSettings.weather = {};
      }

      // If both apiKey and stationId are empty, remove the weather settings
      if (
        (!weather.apiKey || !weather.apiKey.trim()) &&
        (!weather.stationId || !weather.stationId.trim())
      ) {
        console.log('[API Settings] Removing weather settings (empty values)');
        delete user.apiSettings.weather;
      } else {
        if (!weather.stationId || !weather.stationId.trim()) {
          console.log('[API Settings] Error: Weather station ID missing');
          return res.status(400).json({
            success: false,
            message: 'Weather station ID is required',
          });
        }

        user.apiSettings.weather.stationId = weather.stationId.trim();
        console.log('[API Settings] Set weather station ID');

        // Only update API key if provided and not empty
        if (weather.apiKey && weather.apiKey.trim()) {
          console.log('[API Settings] Encrypting weather API key');
          user.apiSettings.weather.apiKey = encrypt(weather.apiKey.trim());
          console.log('[API Settings] Weather API key encrypted successfully');
        }
      }
    }

    // Update timestamp
    user.apiSettings.updatedAt = new Date();

    console.log('[API Settings] Saving user to database...');
    await user.save();
    console.log('[API Settings] User saved successfully');

    console.log(
      `[API Settings] Updated API settings for user ${user.email}${growatt ? ' (Growatt)' : ''}${weather ? ' (Weather)' : ''}`
    );

    res.status(200).json({
      success: true,
      message: 'API settings updated successfully',
      apiSettings: {
        growatt: user.apiSettings.growatt
          ? {
              email: user.apiSettings.growatt.email,
              plantId: user.apiSettings.growatt.plantId,
              hasPassword: !!user.apiSettings.growatt.encryptedPassword,
            }
          : null,
        weather: user.apiSettings.weather
          ? {
              stationId: user.apiSettings.weather.stationId,
              hasApiKey: !!user.apiSettings.weather.apiKey,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[API Settings] Error updating API settings:', error);
    console.error('[API Settings] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update API settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * Get decrypted Growatt credentials (for API use only)
 * POST /api/settings/api/credentials
 */
router.post('/credentials', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('apiSettings');

    if (!user || !user.apiSettings?.growatt?.encryptedPassword) {
      return res.status(404).json({
        success: false,
        message: 'No Growatt credentials found',
      });
    }

    const { password: providedPassword } = req.body;

    if (!providedPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password verification required',
      });
    }

    // Verify the provided password matches the stored encrypted password
    try {
      const decryptedPassword = decrypt(
        user.apiSettings.growatt.encryptedPassword
      );
      const isValid = providedPassword === decryptedPassword;

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password',
        });
      }
    } catch (error) {
      console.error('Password verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Password verification failed',
      });
    }

    // Return credentials for API use
    res.status(200).json({
      success: true,
      credentials: {
        account: user.apiSettings.growatt.email,
        password: providedPassword, // Return the verified password
        plantId: user.apiSettings.growatt.plantId,
      },
    });
  } catch (error) {
    console.error('Error retrieving credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve credentials',
    });
  }
});

/**
 * Get decrypted Weather API credentials (for API use only)
 * POST /api/settings/api/weather-credentials
 */
router.post('/weather-credentials', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('apiSettings');

    if (!user || !user.apiSettings?.weather?.apiKey) {
      return res.status(404).json({
        success: false,
        message: 'No Weather API credentials found',
      });
    }

    try {
      const decryptedApiKey = decrypt(user.apiSettings.weather.apiKey);

      // Return credentials for API use
      res.status(200).json({
        success: true,
        credentials: {
          apiKey: decryptedApiKey,
          stationId: user.apiSettings.weather.stationId,
        },
      });
    } catch (error) {
      console.error('Weather API key decryption error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to decrypt weather API key',
      });
    }
  } catch (error) {
    console.error('Error retrieving weather credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve weather credentials',
    });
  }
});

/**
 * Clear user's API settings
 * DELETE /api/settings/api
 */
router.delete('/api', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Clear API settings
    user.apiSettings = {
      updatedAt: new Date(),
    };

    await user.save();

    console.log(`[API Settings] Cleared API settings for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'API settings cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing API settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear API settings',
    });
  }
});

module.exports = router;

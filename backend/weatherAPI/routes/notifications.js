const express = require('express');
const notificationController = require('../controllers/notifications.js');
const isAuthenticated = require('../middleware/isAuth.js');

const router = express.Router();

// All notification routes require authentication; everything is scoped to req.user.
router.get('/', isAuthenticated, notificationController.list);
router.get('/count', isAuthenticated, notificationController.count);
router.delete('/clear', isAuthenticated, notificationController.clear);
router.delete('/:id', isAuthenticated, notificationController.remove);

// Expo push token registration (mobile/tablet).
router.post('/push-token', isAuthenticated, notificationController.registerPushToken);
router.delete('/push-token', isAuthenticated, notificationController.removePushToken);

// Dev-only: manually trigger the weather backfill for the current user, so the cron
// outcome (data save + notification) can be tested without waiting for 00:01.
if ((process.env.NODE_ENV || 'development') !== 'production') {
  router.post(
    '/dev/run-weather-backfill',
    isAuthenticated,
    async (req, res, next) => {
      try {
        const { runWeatherBackfillForUser } = require('../cron/weatherBackfill.js');
        const result = await runWeatherBackfillForUser(req.user);
        res.json({ success: true, result });
      } catch (error) {
        next(error);
      }
    }
  );
}

module.exports = router;

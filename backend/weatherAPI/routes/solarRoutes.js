const express = require('express');
const isAuthenticated = require('../middleware/isAuth.js');
const { getDailySolar } = require('../controllers/solarController');

const router = express.Router();

// Log all requests to solar routes
router.use((req, res, next) => {
  console.log(
    `[SolarRoutes] ${req.method} ${req.path} - Headers:`,
    req.headers.authorization ? 'Auth Present' : 'No Auth'
  );
  console.log(`[SolarRoutes] Environment: ${process.env.NODE_ENV}`);
  next();
});

// Authenticated endpoint (for production and authenticated development)
router.get('/daily/:date', isAuthenticated, getDailySolar);

// Development-only endpoint (no authentication required)
if (process.env.NODE_ENV !== 'production') {
  router.get('/dev/daily/:date', getDailySolar);
}

module.exports = router;

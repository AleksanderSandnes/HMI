const express = require('express');
const isAuthenticated = require('../middleware/isAuth.js');
const { getDailySolar } = require('../controllers/solarController');

const router = express.Router();

// Log all requests to solar routes
router.use((req, res, next) => {
  console.log('=== SOLAR ROUTE REQUEST ===');
  console.log(`[SolarRoutes] ${req.method} ${req.originalUrl}`);
  console.log(`[SolarRoutes] Path: ${req.path}`);
  console.log(
    `[SolarRoutes] Headers:`,
    req.headers.authorization ? 'Auth Present' : 'No Auth'
  );
  console.log(`[SolarRoutes] Environment: ${process.env.NODE_ENV}`);
  console.log(
    `[SolarRoutes] Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`
  );
  console.log('=========================');
  next();
});

// Authenticated endpoint (for production and authenticated development)
router.get('/daily/:date', isAuthenticated, getDailySolar);

// Development-only endpoint (no authentication required)
if (process.env.NODE_ENV !== 'production') {
  router.get('/dev/daily/:date', getDailySolar);
}

// Catch-all route for debugging - should be last
router.all('*', (req, res) => {
  console.log('=== SOLAR CATCH-ALL TRIGGERED ===');
  console.log(`[SolarRoutes] Unmatched route: ${req.method} ${req.path}`);
  console.log(`[SolarRoutes] Available routes: GET /daily/:date`);
  console.log('================================');
  res.status(404).json({
    error: 'Solar endpoint not found',
    path: req.path,
    method: req.method,
    availableRoutes: ['GET /daily/:date'],
  });
});

module.exports = router;

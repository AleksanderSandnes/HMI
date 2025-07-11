const express = require('express');
const isAuthenticated = require('../middleware/isAuth.js');
const { getDailySolar } = require('../controllers/solarController');

const router = express.Router();

// Authenticated endpoint (for production and authenticated development)
router.get('/daily/:date', isAuthenticated, getDailySolar);

// Development-only endpoint (no authentication required)
if (process.env.NODE_ENV !== 'production') {
  router.get('/dev/daily/:date', getDailySolar);
}

module.exports = router;

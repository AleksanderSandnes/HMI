const express = require('express');
const isAuthenticated = require('../middleware/isAuth.js');
const {
  getHourlyWeather,
  getDailyWeather,
  getAllWeather,
  getCurrentWeather,
  getWeeklyWeather,
  getWeeklyHourlyWeather,
  getMonthlyWeather,
  getYearlyWeather,
  getEndpointInfo,
} = require('../controllers/weatherController');

const router = express.Router();

// Core weather data routes using optimal Weather.com PWS endpoints
// These routes now use authentication to get user-specific weather settings
router.get('/hourly/:date', isAuthenticated, getHourlyWeather); // Uses /history/hourly
router.get('/daily/:date', isAuthenticated, getDailyWeather); // Uses /history/all
router.get('/all/:date', isAuthenticated, getAllWeather); // Uses /history/all
router.get('/current', isAuthenticated, getCurrentWeather); // Uses /observations/current

// Weekly route using /dailysummary/7day endpoint (7 days of daily summaries)
router.get('/weekly/:date?', isAuthenticated, getWeeklyWeather); // Optional date parameter for weekly view

// New weekly hourly route for specific hours (8, 10, 12, 14, 16, 18, 20, 22) across a week
router.get('/weekly-hourly/:date', isAuthenticated, getWeeklyHourlyWeather); // Date parameter to calculate week

// Utility route for debugging endpoint recommendations (no auth needed)
router.get('/endpoint-info', getEndpointInfo);

module.exports = router;

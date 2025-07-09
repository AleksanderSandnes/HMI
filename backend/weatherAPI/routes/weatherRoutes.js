const express = require('express');
const { getHourlyWeather, getDailyWeather, getAllWeather, getCurrentWeather, getDailySummary, getRecentDayWeather, get7DayHourlyWeather } = require('../controllers/weatherController');

const router = express.Router();

router.get('/hourly/:date', getHourlyWeather);
router.get('/daily/:date', getDailyWeather);
router.get('/all/:date', getAllWeather);
router.get('/current', getCurrentWeather);
router.get('/dailysummary', getDailySummary);
router.get('/recent/day', getRecentDayWeather);
router.get('/hourly/7day', get7DayHourlyWeather);

module.exports = router;
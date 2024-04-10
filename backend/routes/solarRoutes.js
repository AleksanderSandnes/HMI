const express = require('express');
const { getDayData } = require('../controllers/solarController');

const router = express.Router();

router.get('/dayData', getDayData);

module.exports = router;
const express = require('express');
const { getDailySolar } = require('../controllers/solarController');

const router = express.Router();

router.get('/daily/:date', getDailySolar);

module.exports = router;
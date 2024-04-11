const express = require('express');
const mongoose = require('mongoose');
const weatherRoutes = require('./routes/weatherRoutes.js');
const solarRoutes = require('./routes/solarRoutes.js');
const cors = require('cors'); // Import cors

const app = express();
const PORT = process.env.PORT || 5000;

// mongoose.connect('mongodb://localhost:27017/HMI');

app.use('/api/weather', cors(), weatherRoutes);

app.use('/api/solar', cors(), solarRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
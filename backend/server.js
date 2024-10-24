const express = require('express');
const weatherRoutes = require('./routes/weatherRoutes.js');
const solarRoutes = require('./routes/solarRoutes.js');
const userRoutes = require('./routes/user.js');
const cors = require('cors'); // Import cors
const { default: mongoose } = require('mongoose');
const errorHandler = require('./middleware/errorHandler.js');

const app = express();
const PORT = process.env.PORT || 5000;

mongoose
  .connect(
    'mongodb+srv://aleksandersandnes:8382Vardeveien11!@hmi.g7qbf6h.mongodb.net/?retryWrites=true&w=majority&appName=HMI'
  )
  .then(() => console.log('Database connected'))
  .catch((err) => console.log(err));

app.use(express.json());

app.use('/api/weather', cors(), weatherRoutes);
app.use('/api/solar', cors(), solarRoutes);
app.use('/api/user', cors(), userRoutes);

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

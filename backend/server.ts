import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import weatherController from './wunderground/controllers/weatherController';
import growattController from './growatt/controllers';

const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect('mongodb://localhost:27017/HMI');

app.use('/api/growatt', cors(), bodyParser.urlencoded({ extended: false }), growattController);

app.use('/api/weather', cors(), weatherController);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
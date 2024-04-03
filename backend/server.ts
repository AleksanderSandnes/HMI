import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import weatherController from './controllers/weatherController';

const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect('mongodb://localhost:27017/HMI');

app.use(cors());
app.use('/api', weatherController); // use your controller with the /api prefix

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
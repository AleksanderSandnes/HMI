import dotenv from 'dotenv';
import express, { Router, Request, Response } from 'express';
import axios from 'axios';

dotenv.config();

const router: Router = express.Router();

const BASE_URL: string = 'https://api.weather.com/v2/pws';

router.get('/weather/hourly/:date', async (req: Request, res: Response) => {
    try {
        const weatherResponse = await axios.get(`${BASE_URL}/history/hourly?stationId=ISANDN24&format=json&units=m&date=${req.params.date}&apiKey=${process.env.WEATHER_API_KEY}`);
        res.json(weatherResponse.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching hourly weather data' });
    }
});

router.get('/weather/all/:date', async (req: Request, res: Response) => {
    try {
        const weatherResponse = await axios.get(`${BASE_URL}/history/all?stationId=ISANDN24&format=json&units=m&date=${req.params.date}&apiKey=${process.env.WEATHER_API_KEY}`);
        res.json(weatherResponse.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all weather data' });
    }
});

router.get('/weather/daily/:date', async (req: Request, res: Response) => {
    try {
        const weatherResponse = await axios.get(`${BASE_URL}/history/daily?stationId=ISANDN24&format=json&units=m&date=${req.params.date}&apiKey=${process.env.WEATHER_API_KEY}`);
        res.json(weatherResponse.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching daily weather data' });
    }
});

router.get('/weather/summary', async (req: Request, res: Response) => {
    try {
        const weatherResponse = await axios.get(`${BASE_URL}/dailysummary/7day?stationId=ISANDN24&format=json&units=m&apiKey=${process.env.WEATHER_API_KEY}`);
        res.json(weatherResponse.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching 7-day weather summary' });
    }
});

router.get('/weather/recent', async (req: Request, res: Response) => {
    try {
        const weatherResponse = await axios.get(`${BASE_URL}/observations/all/1day?stationId=ISANDN24&format=json&units=m&apiKey=${process.env.WEATHER_API_KEY}`);
        res.json(weatherResponse.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recent weather data' });
    }
});

router.get('/weather/hourly/7day', async (req: Request, res: Response) => {
    try {
        const weatherResponse = await axios.get(`${BASE_URL}/observations/hourly/7day?stationId=ISANDN24&format=json&units=m&apiKey=${process.env.WEATHER_API_KEY}`);
        res.json(weatherResponse.data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching 7-day hourly weather data' });
    }
});

export default router;
import mongoose from 'mongoose';

// Define a schema for your data
const historicalWeatherSchema = new mongoose.Schema({
    observations: [{
        stationID: String,
        tz: String,
        obsTimeUtc: String,
        obsTimeLocal: String,
        epoch: Number,
        lat: Number,
        lon: Number,
        solarRadiationHigh: Number,
        uvHigh: Number,
        winddirAvg: Number,
        humidityHigh: Number,
        humidityLow: Number,
        humidityAvg: Number,
        qcStatus: Number,
        metric: {
            tempHigh: Number,
            tempLow: Number,
            tempAvg: Number,
            windspeedHigh: Number,
            windspeedLow: Number,
            windspeedAvg: Number,
            windgustHigh: Number,
            windgustLow: Number,
            windgustAvg: Number,
            dewptHigh: Number,
            dewptLow: Number,
            dewptAvg: Number,
            windchillHigh: Number,
            windchillLow: Number,
            windchillAvg: Number,
            heatindexHigh: Number,
            heatindexLow: Number,
            heatindexAvg: Number,
            pressureMax: Number,
            pressureMin: Number,
            pressureTrend: Number,
            precipRate: Number,
            precipTotal: Number
        }
    }]
});

// Create a model from the schema
const Historical = mongoose.model('Historical', historicalWeatherSchema, 'historical_weather');

export default Historical;
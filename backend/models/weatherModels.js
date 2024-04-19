const mongoose = require('mongoose');

// Define a schema for your data
const historicalWeatherSchema = new mongoose.Schema({
    date: String,
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

const currentWeatherSchema = new mongoose.Schema({
    observations: [{
        stationID: String,
        obsTimeUtc: String,
        obsTimeLocal: String,
        neighborhood: String,
        softwareType: String,
        country: String,
        solarRadiation: Number,
        lon: Number,
        realtimeFrequency: Number,
        epoch: Number,
        lat: Number,
        uv: Number,
        winddir: Number,
        humidity: Number,
        qcStatus: Number,
        metric: {
            temp: Number,
            heatIndex: Number,
            dewpt: Number,
            windChill: Number,
            windSpeed: Number,
            windGust: Number,
            pressure: Number,
            precipRate: Number,
            precipTotal: Number,
            elev: Number
        }
    }]
});

// Create models from the schema
const Historical = mongoose.model('Historical', historicalWeatherSchema, 'historical_weather');
const Current = mongoose.model('Current', currentWeatherSchema, 'current_weather');

module.exports = { Historical, Current };
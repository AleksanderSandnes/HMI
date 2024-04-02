import mongoose from 'mongoose';

// Define a schema for your data
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

// Create a model from the schema
const Current = mongoose.model('Current', currentWeatherSchema, 'current_weather');

export default Current;
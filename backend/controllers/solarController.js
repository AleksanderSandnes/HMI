const { fetchPlantData } = require('../services/solarService');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

const getDailySolar = async (req, res) => {
    try {
        const client = new MongoClient("mongodb://localhost:27017/HMI");
        const username = process.env.GROWATT_USERNAME;
        const password = process.env.GROWATT_PASSWORD;
        const date = new Date(req.params.date + "T00:00:00Z");

        try {
            await client.connect();
            const collection = client.db("HMI").collection("solar_data");

            let data = await collection.findOne({ date: date });

            if (!data) {
                data = await fetchPlantData(username, password, date);
                await collection.insertOne({ ...data, date: date });
            }

            res.status(200).json(data);
        } finally {
            if (client) {
                await client.close();
            }
        }
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ message: `Error retrieving day data: ${error.message}` });
        }
    }
};

module.exports = { getDailySolar };
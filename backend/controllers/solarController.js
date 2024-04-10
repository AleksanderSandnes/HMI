const { fetchPlantData } = require('../services/solarService');
require('dotenv').config();

const getDayData = async (_req, res) => {
    try {
        const username = process.env.GROWATT_USERNAME;
        const password = process.env.GROWATT_PASSWORD;

        const data = await fetchPlantData(username, password);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: `Error retrieving day data: ${error.message}` });
    }
};

module.exports = { getDayData };
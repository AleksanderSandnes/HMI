const { fetchPlantData } = require('../services/solarService');
require('dotenv').config();
const client = require('../database/database');

const getDailySolar = async (req, res) => {
  try {
    const username = process.env.GROWATT_USERNAME;
    const password = process.env.GROWATT_PASSWORD;
    const date = new Date(req.params.date + 'T00:00:00Z');
    const formattedToday =
      new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

    try {
      await client.connect();

      const collection = client.db('HMI').collection('solar_data');

      let data = await collection.findOne({ date: date });

      if (!data || date.toISOString() === formattedToday) {
        data = await fetchPlantData(username, password, date);
        if (data) {
          const operation =
            date.toISOString() === formattedToday
              ? collection.updateOne(
                  { date: date },
                  { $set: { ...data } },
                  { upsert: true }
                )
              : collection.insertOne({ ...data, date: date });
          await operation;
          data = await collection.findOne({ date: date });
        }
      }

      res.status(200).json(data);
    } finally {
      if (client) {
        await client.close();
      }
    }
  } catch (error) {
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: `Error retrieving day data: ${error.message}` });
    }
  }
};

module.exports = { getDailySolar };

const { fetchPlantData } = require("../services/solarService");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;
const uri = `mongodb+srv://${db_username}:${db_password}@hmi.g7qbf6h.mongodb.net/?retryWrites=true&w=majority&appName=HMI`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const getDailySolar = async (req, res) => {
  try {
    const username = process.env.GROWATT_USERNAME;
    const password = process.env.GROWATT_PASSWORD;
    const date = new Date(req.params.date + "T00:00:00Z");
    const formattedToday =
      new Date().toISOString().split("T")[0] + "T00:00:00.000Z";

    try {
      await client.connect();

      const collection = client.db("HMI").collection("solar_data");

      let data = await collection.findOne({ date: date });

      if (!data || date.toISOString() === formattedToday) {
        data = await fetchPlantData(username, password, date);
        if (data) {
          const operation =
            date.toISOString() === formattedToday
              ? collection.updateOne({ date: date }, { $set: { ...data } })
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

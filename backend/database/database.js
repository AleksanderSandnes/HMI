const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;
const uri = `mongodb+srv://${db_username}:${db_password}@hmi.g7qbf6h.mongodb.net/?retryWrites=true&w=majority&appName=HMI`;

let client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

module.exports = client;

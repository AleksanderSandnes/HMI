const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const db_username = process.env.DB_USERNAME;
const db_password = process.env.DB_PASSWORD;
const environment = process.env.NODE_ENV || "development";

// Use local MongoDB in development, production cluster in production
let uri;
if (environment === "development") {
  uri = process.env.MONGODB_LOCAL_URI || "mongodb://localhost:27017/hmi-dev";
  console.log("🟡 [MongoDB] Using local development database:", uri);
} else {
  uri = `mongodb+srv://${db_username}:${db_password}@hmi.g7qbf6h.mongodb.net/?retryWrites=true&w=majority&appName=HMI`;
  console.log("🟢 [MongoDB] Using production cluster");
}

let client = new MongoClient(uri, {
  serverApi:
    environment === "development"
      ? undefined
      : {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
});

module.exports = client;

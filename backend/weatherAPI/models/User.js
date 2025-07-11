const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    apiSettings: {
      growatt: {
        email: { type: String },
        encryptedPassword: { type: String }, // For password verification (bcrypt hash)
        apiPassword: { type: String }, // For API usage (encrypted, reversible)
        plantId: { type: String },
      },
      weather: {
        apiKey: { type: String }, // Weather.com API key
        stationId: { type: String }, // Weather station ID
      },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;

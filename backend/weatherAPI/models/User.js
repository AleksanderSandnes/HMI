const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    apiSettings: {
      growatt: {
        email: { type: String },
        password: { type: String }, // Plain text password for API usage (as requested)
        plantId: { type: String },
      },
      weather: {
        apiKey: { type: String }, // Weather.com API key
        stationId: { type: String }, // Weather station ID
      },
      updatedAt: { type: Date, default: Date.now },
    },
    // Expo push tokens for this user's mobile/tablet devices (push notifications).
    expoPushTokens: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;

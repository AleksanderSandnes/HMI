const mongoose = require("mongoose");

/**
 * In-app notification (web notification center).
 *
 * Written by BOTH the Node weather backfill cron (via Mongoose) and the Java solar
 * backfill job (via Spring Data) into the SAME shared `notifications` collection, so the
 * field names and types here must stay aligned with the Java `Notification` entity.
 *
 * "Mark as read" is implemented as a hard delete, so every stored notification is, by
 * definition, unread. The unread badge count is simply the number of documents for a user.
 */
const notificationSchema = new mongoose.Schema(
  {
    // Stored as an ObjectId so it matches the Mongoose-cast `req.user` in queries and the
    // org.bson.types.ObjectId the Java job writes.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    // Source of the notification.
    type: {
      type: String,
      enum: ["weather_sync", "solar_sync", "system"],
      default: "system",
    },
    // Outcome severity, drives the icon/colour in the UI.
    level: {
      type: String,
      enum: ["success", "error", "info", "warning"],
      default: "info",
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    // Optional structured payload (counts, date, etc.).
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Fast "newest first, per user" look-ups.
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema, "notifications");

module.exports = Notification;

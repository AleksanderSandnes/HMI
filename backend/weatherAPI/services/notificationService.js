const axios = require("axios");
const Notification = require("../models/Notification");

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

// Expo push tokens look like `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`.
const isExpoPushToken = (token) =>
  typeof token === "string" &&
  (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["));

/**
 * Persist an in-app notification for a user. Never throws — a failed notification write
 * must not abort the background job that produced it.
 *
 * @returns {Promise<object|null>} the created document, or null on failure.
 */
const createNotification = async ({
  userId,
  type = "system",
  level = "info",
  title,
  message = "",
  meta = undefined,
}) => {
  try {
    const doc = await Notification.create({
      userId,
      type,
      level,
      title,
      message,
      meta,
    });
    console.log(`[Notifications] Created (${type}/${level}) for user ${userId}: ${title}`);
    return doc;
  } catch (error) {
    console.warn(`[Notifications] Failed to create notification: ${error.message}`);
    return null;
  }
};

/**
 * Best-effort Expo push delivery. Silently skips invalid/empty tokens and never throws,
 * so push delivery can never break a cron job. Requires the receiving device to have
 * registered a real Expo push token (needs an EAS projectId + a dev/standalone build).
 */
const sendExpoPush = async (tokens, { title, body, data = {} }) => {
  const valid = (Array.isArray(tokens) ? tokens : [tokens]).filter(isExpoPushToken);
  if (valid.length === 0) {
    return;
  }

  const messages = valid.map((to) => ({
    to,
    sound: "default",
    title,
    body,
    data,
  }));

  try {
    await axios.post(EXPO_PUSH_ENDPOINT, messages, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
    console.log(`[Push] Sent ${messages.length} Expo push message(s).`);
  } catch (error) {
    console.warn(`[Push] Expo push delivery failed: ${error.message}`);
  }
};

module.exports = { createNotification, sendExpoPush, isExpoPushToken };

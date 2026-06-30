const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const User = require("../models/User");

const notificationController = {
  // List the current user's notifications, newest first.
  list: asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: notifications.length,
      notifications: notifications.map((n) => ({
        id: n._id,
        type: n.type,
        level: n.level,
        title: n.title,
        message: n.message,
        meta: n.meta ?? null,
        createdAt: n.createdAt,
      })),
    });
  }),

  // Unread count = total count, since "mark read" hard-deletes the document.
  count: asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({ userId: req.user });
    res.json({ success: true, count });
  }),

  // Mark a single notification as read (hard delete). Scoped to the owner.
  remove: asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error("Invalid notification id");
    }

    const deleted = await Notification.findOneAndDelete({
      _id: id,
      userId: req.user,
    });

    if (!deleted) {
      res.status(404);
      throw new Error("Notification not found");
    }

    res.json({ success: true, id });
  }),

  // Mark all as read (clear) for the current user.
  clear: asyncHandler(async (req, res) => {
    const result = await Notification.deleteMany({ userId: req.user });
    res.json({ success: true, deleted: result.deletedCount });
  }),

  // Register (or refresh) an Expo push token for the current user's device.
  registerPushToken: asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      res.status(400);
      throw new Error("A push token string is required");
    }

    // addToSet avoids duplicate tokens across re-registrations.
    await User.findByIdAndUpdate(req.user, {
      $addToSet: { expoPushTokens: token },
    });

    res.json({ success: true });
  }),

  // Remove an Expo push token (e.g. on logout / unregister).
  removePushToken: asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      res.status(400);
      throw new Error("A push token string is required");
    }

    await User.findByIdAndUpdate(req.user, {
      $pull: { expoPushTokens: token },
    });

    res.json({ success: true });
  }),
};

module.exports = notificationController;

const mongoose = require("mongoose");
const User = require("../models/userSchema");
const { GlobalNotification } = require("../models/notificationSchema");
const { sendExpoPushNotification, sendBatchPushNotifications } = require("./pushTokenController");
const { sendRealTimeNotification } = require("./socketController");
let io;

/**
 * Initialize the notification controller with the socket.io instance.
 */
const initializeNotificationController = (socketIoInstance) => {
  io = socketIoInstance;
};

const emitNotification = (io, userId, notificationData) => {
  const recipientSocketId = onlineUsers.get(userId);

  if (recipientSocketId) {
    io.to(recipientSocketId).emit("receiveNotification", notificationData);
    console.log(`📩 Notification sent to user ${userId} (Socket: ${recipientSocketId})`);
  } else {
    console.log(`⚠️ User ${userId} is offline. Notification stored.`);
  }
};

// Function to get all global notifications
const getGlobalNotifications = async (req, res) => {
  try {
    const notifications = await GlobalNotification.find({})
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ notifications });
  } catch (err) {
    console.error("Error fetching global notifications:", err);
    return res.status(500).json({ error: "Error fetching notifications" });
  }
};

// Function to send notification to all users
const sendAdminNotification = async (req, res) => {
  try {
    const { message, title, type } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    // Store in GlobalNotification Schema
    const globalNotification = new GlobalNotification({
      message,
      title: title || "Admin Notification",
      type: type || "admin",
    });
    await globalNotification.save();

    // Emit Real-Time Notification to All Users
    if (io) {
      io.emit("receiveNotification", globalNotification);
      console.log("📢 Global notification sent to all users");
    } else {
      console.error("❌ Socket.io instance is not initialized");
    }

    // Fetch Users with Push Tokens
    const users = await User.find({ expoPushToken: { $ne: null } }, "expoPushToken").lean();
    const tokens = users.map((u) => u.expoPushToken).filter(Boolean);

    // Send Push Notifications in Batch
    if (tokens.length > 0) {
      await sendBatchPushNotifications(
        tokens,
        globalNotification.title,
        message,
        { type: "admin" }
      );
    }

    return res.status(200).json({ success: true, message: "Admin notification sent to all users", globalNotification });
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    return res.status(500).json({ success: false, message: "Failed to send notification", error: error.message });
  }
};

// Function to delete a global notification
const deleteAdminNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID" });
    }

    const deletedNotification = await GlobalNotification.findByIdAndDelete(notificationId);

    if (!deletedNotification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    return res.status(200).json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    return res.status(500).json({ success: false, message: "Failed to delete notification", error: error.message });
  }
};

// Function to resend a global notification
const resendAdminNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID" });
    }

    const notification = await GlobalNotification.findById(notificationId).lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    // Emit Real-Time Notification to All Users
    if (io) {
      io.emit("receiveNotification", notification);
      console.log("📢 Global notification resent to all users");
    } else {
      console.error("❌ Socket.io instance is not initialized");
    }

    // Fetch Users with Push Tokens
    const users = await User.find({ expoPushToken: { $ne: null } }, "expoPushToken").lean();
    const tokens = users.map((u) => u.expoPushToken).filter(Boolean);

    // Send Push Notifications in Batch
    if (tokens.length > 0) {
      await sendBatchPushNotifications(
        tokens,
        notification.title,
        notification.message,
        { type: "admin" }
      );
    }

    return res.status(200).json({ success: true, message: "Admin notification resent to all users", notification });
  } catch (error) {
    console.error("❌ Error resending notification:", error);
    return res.status(500).json({ success: false, message: "Failed to resend notification", error: error.message });
  }
};

// Function to schedule a notification
const scheduleAdminNotification = async (req, res) => {
  try {
    const { message, title, type, scheduleTime } = req.body;

    if (!message || !scheduleTime) {
      return res.status(400).json({ success: false, message: "Message and schedule time are required" });
    }

    const scheduleDate = new Date(scheduleTime);
    if (isNaN(scheduleDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid schedule time" });
    }

    // Store in GlobalNotification Schema with scheduled time
    const globalNotification = new GlobalNotification({
      message,
      title: title || "Admin Notification",
      type: type || "admin",
      scheduleTime: scheduleDate,
    });
    await globalNotification.save();

    // Schedule the notification
    setTimeout(async () => {
      // Emit Real-Time Notification to All Users
      if (io) {
        io.emit("receiveNotification", globalNotification);
        console.log("📢 Scheduled global notification sent to all users");
      } else {
        console.error("❌ Socket.io instance is not initialized");
      }

      // Fetch Users with Push Tokens
      const users = await User.find({ expoPushToken: { $ne: null } }, "expoPushToken").lean();
      const tokens = users.map((u) => u.expoPushToken).filter(Boolean);

      // Send Push Notifications in Batch
      if (tokens.length > 0) {
        await sendBatchPushNotifications(
          tokens,
          globalNotification.title,
          message,
          { type: "admin" }
        );
      }
    }, scheduleDate.getTime() - Date.now());

    return res.status(200).json({ success: true, message: "Admin notification scheduled", globalNotification });
  } catch (error) {
    console.error("❌ Error scheduling notification:", error);
    return res.status(500).json({ success: false, message: "Failed to schedule notification", error: error.message });
  }
};

module.exports = {
  initializeNotificationController,
  getGlobalNotifications,
  sendAdminNotification,
  deleteAdminNotification,
  resendAdminNotification,
  scheduleAdminNotification,
};
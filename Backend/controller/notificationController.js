const Notification = require('../models/notificationSchema');
const { sendRealTimeNotification } = require('./socketController');
const mongoose = require('mongoose');
const User = require('../models/userSchema');
let io;

// Initialize the controller with io
const initializeNotificationController = (socketIoInstance) => {
  io = socketIoInstance;
};

// Send notification

const sendNotification = async ({ userId, title, message, type, metadata }) => {
  try {
    if (!userId) {
      throw new Error("userId is required for notifications.");
    }

    // Create notification
    const notification = new Notification({ userId, title, message, type, metadata });

    // Save to DB
    await notification.save();
    console.log(`Notification saved for user ${userId}`);

    // Emit real-time notification
    sendRealTimeNotification(io, userId, { title, message, type, createdAt: new Date() });

    return { success: true, message: "Notification sent successfully!" };
  } catch (error) {
    console.error("Error saving notification to database:", error);
    return { success: false, message: "Failed to send notification" };
  }
};

 

// Fetch notifications for a specific user
const getUserNotifications = async (req, res) => {
  const userId = req.user.id;
  console.log("Requested user id ", userId);
  try {
    // Ensure userId is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Fetch notifications from the database
    const notifications = await Notification.find({ userId: userId })
      .sort({ createdAt: -1 }) // Sort by most recent
      .lean();

    if (notifications.length === 0) {
      return res.status(404).json({ message: 'No notifications found for this user' });
    }

    // Return the notifications
    return res.status(200).json({ notifications });

  } catch (err) {
    console.error('Error fetching notifications:', err);
    return res.status(500).json({ error: 'Error fetching notifications' });
  }
};

// Mark notification as read or unread
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId, isReadable } = req.body; // Get ID and read status

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    // Update the notification status
    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { isReadable },
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.status(200).json({
      success: true,
      message: `Notification marked as ${isReadable ? 'read' : 'unread'}.`,
      notification: updatedNotification,
    });
  } catch (error) {
    console.error('Error updating notification status:', error);
    return res.status(500).json({ error: 'Error updating notification status' });
  }
};


module.exports = { initializeNotificationController, sendNotification, getUserNotifications,markNotificationAsRead };

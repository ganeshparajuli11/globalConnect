const Notification = require('../models/notificationSchema');
const { sendRealTimeNotification } = require('./shocketController');
const mongoose = require('mongoose');
const User = require('../models/userSchema');
let io;

// Initialize the controller with io
const initializeNotificationController = (socketIoInstance) => {
  io = socketIoInstance;
};

// Send notification

const sendNotification = async (req, res) => {
    try {
      const { userId, title, message, type, metadata } = req.body;
  
      // Create notification
      const notification = new Notification({
        userId,
        title,
        message,
        type,
        metadata,
      });
  
      // Save notification to DB
      await notification.save();
      console.log(`Notification saved to DB for user ${userId}`);
  
      // Emit the notification in real-time using socket.io
      sendRealTimeNotification(req.app.get('io'), userId, {
        title,
        message,
        type,
        createdAt: new Date(),
      });
  
      res.status(200).json({ message: 'Notification sent successfully!' });
    } catch (error) {
      console.error('Error saving notification to database:', error);
      res.status(500).json({ message: 'Failed to send notification' });
    }
  };
  

// Fetch notifications for a specific user
const getUserNotifications = async (req, res) => {
  const userId = req.userId; // Access the userId from the request (set by middleware)

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



module.exports = { initializeNotificationController, sendNotification, getUserNotifications };

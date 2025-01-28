const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User to notify
  title: { type: String, required: true }, // Notification title
  message: { type: String, required: true }, // Notification content
  type: { 
    type: String, 
    enum: ['system', 'follow', 'message', 'alert'], // Added 'alert' to the list
    required: true 
  }, // Notification type
  metadata: { type: Object, default: {} }, // Additional data (e.g., senderId for follow or message)
  isRead: { type: Boolean, default: false }, // Read status
  createdAt: { type: Date, default: Date.now }, // Timestamp
});

module.exports = mongoose.model('Notification', notificationSchema);

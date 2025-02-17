const mongoose = require("mongoose");
// User-specific notifications schema
const userNotificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // User's ID
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    metadata: { type: Object }, 
  },
  { timestamps: true }
);

// Global notifications schema
const globalNotificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Models for each collection
module.exports = {
  UserNotification: mongoose.model("UserNotification", userNotificationSchema),
  GlobalNotification: mongoose.model("GlobalNotification", globalNotificationSchema),
};

const { GlobalNotification } = require("../models/notificationSchema"); // Correct import for the model

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { message, isGlobal } = req.body;
    const newNotification = new GlobalNotification({ message, isGlobal });
    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: "Error creating notification", error: error.message });
  }
};

// Get all notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await GlobalNotification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
};

// Update a notification
exports.updateNotification = async (req, res) => {
  try {
    const { message, isGlobal } = req.body;
    const updatedNotification = await GlobalNotification.findByIdAndUpdate(
      req.params.id,
      { message, isGlobal },
      { new: true }
    );
    res.json(updatedNotification);
  } catch (error) {
    res.status(500).json({ message: "Error updating notification", error: error.message });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    await GlobalNotification.findByIdAndDelete(req.params.id); // Use the correct model for deletion
    res.json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting notification", error: error.message });
  }
};

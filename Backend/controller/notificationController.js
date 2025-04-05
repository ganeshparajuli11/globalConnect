let onlineUsers = new Map();
const {
  UserNotification,
  GlobalNotification,
} = require("../models/notificationSchema");
const { sendRealTimeNotification } = require("./socketController");
const mongoose = require("mongoose");
const User = require("../models/userSchema");
const Post = require("../models/postSchema");
const { sendExpoPushNotification, sendBatchPushNotifications } = require("./pushTokenController");

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


const sendNotification = async (req, res) => {
  try {
    const { message, title, type, userId } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    if (userId) {
      // Validate User ID
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "Invalid user ID" });
      }

      // Store in UserNotification Schema
      const notification = new UserNotification({
        userId,
        message,
        title: title || "Notification",
        type: type || "info",
        isAdminNotification: false,
      });
      await notification.save();

      // Emit Real-Time Notification to Specific User
      emitNotification(io, userId, notification);

      // Send Push Notification if User has Expo Push Token
      const userDoc = await User.findById(userId, "expoPushToken").lean();
      if (userDoc?.expoPushToken) {
        await sendExpoPushNotification(
          userDoc.expoPushToken,
          notification.title,
          message,
          { screen: "NotificationScreen" }
        );
      }

      return res.status(200).json({ success: true, message: "Notification sent to user", notification });
    } else {
      // Store in GlobalNotification Schema
      const globalNotification = new GlobalNotification({
        message,
        title: title || "Admin Notification",
        type: type || "admin",
      });
      await globalNotification.save();

      // Emit Real-Time Notification to All Users
      io.emit("receiveNotification", globalNotification);
      console.log("📢 Global notification sent to all users");

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

      return res.status(200).json({ success: true, message: "Admin notification sent to all users" });
    }
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    return res.status(500).json({ success: false, message: "Failed to send notification", error: error.message });
  }
};


/**
 * Admin sends a notification to a specific user.
 * @param {Object} params - Contains userId and message.
 */
const sendNotificationToUser = async ({ userId, message }) => {
  try {
    if (!userId) {
      throw new Error("userId is required for user notifications.");
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid userId.");
    }

    // Create and save the user notification
    const notification = new UserNotification({ userId, message });
    await notification.save();
    console.log(`Notification saved for user ${userId}`);

    // Emit a real-time notification to the specific user
    sendRealTimeNotification(io, userId, { message, createdAt: new Date() });
    return {
      success: true,
      message: "Notification sent to user successfully.",
    };
  } catch (error) {
    console.error("Error sending notification to user:", error);
    return { success: false, message: "Failed to send notification to user." };
  }
};

/**
 * Admin sends a global notification for all users.
 * @param {Object} params - Contains message.
 */

/**
 * Creates a notification when one user follows another.
 * @param {Object} params - Contains followerId and followedId.
 */
const sendFollowNotification = async ({ followerId, followedId }) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(followerId) || !mongoose.Types.ObjectId.isValid(followedId)) {
      throw new Error("Invalid followerId or followedId.");
    }

    const follower = await User.findById(followerId).lean();
    const message = `${follower?.name || "Someone"} started following you.`;

    const notification = new UserNotification({ userId: followedId, message });
    await notification.save();

    sendRealTimeNotification(io, followedId, { message, createdAt: new Date() });

    const followedUser = await User.findById(followedId, "expoPushToken").lean();
    if (followedUser?.expoPushToken) {
      await sendExpoPushNotification(followedUser.expoPushToken, "New Follower", message, { screen: "UserProfile", userId: followerId });
    }

    return { success: true, message: "Follow notification sent successfully" };
  } catch (error) {
    console.error("Error sending follow notification:", error);
    return { success: false, message: "Failed to send follow notification." };
  }
};

// clear all notifications for a user
const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Delete all notifications for this user
    const result = await UserNotification.deleteMany({ userId });

    if (result.deletedCount === 0) {
      return res.status(200).json({
        success: true,
        message: "No notifications found to clear.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Successfully cleared ${result.deletedCount} notifications.`,
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear notifications",
      error: error.message,
    });
  }
};

async function sendLikeNotification({ likerId, postId, postOwnerId }) {
  try {
    // Get post owner and liker details
    const postOwner = await User.findById(postOwnerId);
    const liker = await User.findById(likerId);
    if (!postOwner || !postOwner.expoPushToken) {
      console.log("Post owner push token not found");
      return;
    }

    // Construct notification title and body
    const title = `${liker.name} liked your post`;
    const body = `${liker.name} liked your post`;

    // Send push notification with target screen 'PostDetails' and include postId.
    await sendExpoPushNotification(
      postOwner.expoPushToken,
      title,
      body,
      { screen: "PostDetails", postId },
      "like"
    );
    console.log("Like push notification sent to user:", postOwnerId);
  } catch (error) {
    console.error("Error sending like notification:", error);
  }
}
// Example function to send a comment notification
async function sendCommentNotification({ commenterId, postId, postOwnerId, commentText }) {
  try {
    // Get the post owner and commenter details
    const postOwner = await User.findById(postOwnerId);
    const commenter = await User.findById(commenterId);
    if (!postOwner || !postOwner.expoPushToken) {
      console.log("Post owner push token not found");
      return;
    }

    // Construct the notification message
    const title = `${commenter.name} commented on your photo`;
    const body = `${commenter.name} commented: "${commentText}" in your post`;

    // Send push notification with required data payload
    await sendExpoPushNotification(
      postOwner.expoPushToken,
      title,
      body,
      { screen: "PostDetails", postId },
      "comment"
    );
    console.log("Comment push notification sent to user:", postOwnerId);
  } catch (error) {
    console.error("Error sending comment notification:", error);
  }
}

/**
 * Fetch notifications for the logged-in user (user-specific notifications).
 */
const getUserNotifications = async (req, res) => {
  const userId = req.user.id;
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const notifications = await UserNotification.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ notifications });
  } catch (err) {
    console.error("Error fetching user notifications:", err);
    return res.status(500).json({ error: "Error fetching notifications" });
  }
};


/**
 * Mark a user-specific notification as read or unread.
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId, isRead } = req.body;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }

    const notification = await UserNotification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    if (notification.isRead) {
      return res.status(200).json({
        success: true,
        message: "Notification is already marked as read",
        notification
      });
    }

    if (!isRead) {
      return res.status(400).json({
        error: "Cannot mark notification as unread once it has been read"
      });
    }

    const updatedNotification = await UserNotification.findByIdAndUpdate(
      notificationId,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification: updatedNotification
    });
  } catch (error) {
    console.error("Error updating notification status:", error);
    return res.status(500).json({
      error: "Error updating notification status",
      details: error.message
    });
  }
};


module.exports = {
  initializeNotificationController,
  sendNotificationToUser,
  sendNotification,
  sendFollowNotification,
  getUserNotifications,
  markNotificationAsRead,
  sendCommentNotification,
  clearAllNotifications,
  emitNotification,
  sendLikeNotification

};

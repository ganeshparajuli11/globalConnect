const {
  UserNotification,
  GlobalNotification,
} = require("../models/notificationSchema");
const { sendRealTimeNotification } = require("./socketController");
const mongoose = require("mongoose");
const User = require("../models/userSchema"); // Used to fetch additional user info if needed
const Post = require("../models/postSchema"); // Used to fetch additional user info if needed

let io;

/**
 * Initialize the notification controller with the socket.io instance.
 */
const initializeNotificationController = (socketIoInstance) => {
  io = socketIoInstance;
};

/**
 * Admin sends a notification to users (either specific user or all users)
 */
const sendAdminNotification = async (req, res) => {
  try {
    const { message, title, type, userId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Create notification data
    const notificationData = {
      message,
      title,
      type: type || "info",
      createdAt: new Date(),
      isAdminNotification: true,
    };

    // If userId is provided, send to specific user
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      // Create and save user notification
      const notification = new UserNotification({
        ...notificationData,
        userId,
      });
      await notification.save();

      // Send real-time notification to specific user
      sendRealTimeNotification(io, userId, notificationData);

      return res.status(200).json({
        success: true,
        message: "Notification sent to user successfully",
        notification,
      });
    }
    // If no userId, send to all users
    else {
      // Get all user IDs
      const users = await User.find({}, "_id");
      const userIds = users.map((user) => user._id);

      // Create notifications for all users
      const notifications = await UserNotification.insertMany(
        userIds.map((userId) => ({
          ...notificationData,
          userId,
        }))
      );

      // Broadcast to all connected users
      io.emit("receiveNotification", notificationData);

      return res.status(200).json({
        success: true,
        message: "Notification sent to all users successfully",
        notifications,
      });
    }
  } catch (error) {
    console.error("Error sending admin notification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};

/**
 * Get all admin notifications
 */
const getAdminNotifications = async (req, res) => {
  try {
    const notifications = await UserNotification.find({
      isAdminNotification: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};

/**
 * Delete an admin notification
 */
const deleteAdminNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await UserNotification.findOneAndDelete({
      _id: notificationId,
      isAdminNotification: true,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

/**
 * Update an admin notification
 */
const updateAdminNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { message, title, type } = req.body;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await UserNotification.findOneAndUpdate(
      {
        _id: notificationId,
        isAdminNotification: true,
      },
      {
        message,
        title,
        type,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification updated successfully",
      notification,
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update notification",
      error: error.message,
    });
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
const sendGlobalNotification = async ({ message }) => {
  try {
    // Create and save the global notification
    const notification = new GlobalNotification({ message });
    await notification.save();
    console.log("Global notification saved.");

    // Broadcast the notification to all connected clients
    io.emit("global-notification", { message, createdAt: new Date() });
    return { success: true, message: "Global notification sent successfully." };
  } catch (error) {
    console.error("Error sending global notification:", error);
    return { success: false, message: "Failed to send global notification." };
  }
};

/**
 * Creates a notification when one user follows another.
 * @param {Object} params - Contains followerId and followedId.
 */
const sendFollowNotification = async ({ followerId, followedId }) => {
  try {
    // Validate IDs if using ObjectId (adjust if they're strings)
    if (
      !mongoose.Types.ObjectId.isValid(followerId) ||
      !mongoose.Types.ObjectId.isValid(followedId)
    ) {
      throw new Error("Invalid followerId or followedId.");
    }

    // Fetch follower details to personalize the notification
    const follower = await User.findById(followerId);
    const followerName = follower ? follower.name : "Someone";
    const followerProfileImage =
      follower && follower.profile_image ? follower.profile_image : null;
    const message = `${followerName} started following you.`;

    // Create and save the follow notification for the followed user, including metadata
    const notification = new UserNotification({
      userId: followedId,
      message,
      metadata: {
        followerName,
        profileImage: followerProfileImage,
      },
    });
    await notification.save();
    console.log(`Follow notification saved for user ${followedId}`);

    // Emit a real-time notification to the followed user, including the profile image
    if (io) {
      sendRealTimeNotification(io, followedId, {
        message,
        followerName,
        profileImage: followerProfileImage,
        createdAt: new Date(),
      });
    } else {
      console.warn("Socket.io instance is not initialized.");
    }

    return { success: true, message: "Follow notification sent successfully." };
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

// Function to send a comment notification
const sendCommentNotification = async ({
  commenterId,
  postId,
  postOwnerId,
  commentText,
}) => {
  try {
    if (!commenterId || !postId || !postOwnerId) {
      throw new Error("Missing required parameters.");
    }

    // Fetch commenter details
    const commenter = await User.findById(commenterId);
    if (!commenter) {
      throw new Error("Commenter not found.");
    }

    // Fetch post details
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("Post not found.");
    }

    const message = `${commenter.name} commented on your post: "${commentText}"`;

    // Create a new comment notification
    const notification = new UserNotification({
      userId: postOwnerId, // The owner of the post receives the notification
      message,
      metadata: {
        commenterId,
        commenterName: commenter.name,
        profileImage: commenter.profile_image || null,
        postId,
      },
    });

    await notification.save();
    console.log(`Comment notification saved for user ${postOwnerId}`);

    // Emit real-time notification using Socket.io
    if (io) {
      io.to(postOwnerId.toString()).emit("receiveNotification", {
        message,
        commenterId,
        commenterName: commenter.name,
        profileImage: commenter.profile_image || null,
        postId,
        createdAt: new Date(),
      });
    } else {
      console.warn("Socket.io instance is not initialized.");
    }

    return {
      success: true,
      message: "Comment notification sent successfully.",
    };
  } catch (error) {
    console.error("Error sending comment notification:", error);
    return { success: false, message: "Failed to send comment notification." };
  }
};

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
 * Fetch global notifications (available to all users).
 */
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

/**
 * Mark a user-specific notification as read or unread.
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId, isRead } = req.body; // Use 'isRead' as per schema

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ error: "Invalid notification ID" });
    }

    const updatedNotification = await UserNotification.findByIdAndUpdate(
      notificationId,
      { isRead },
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Notification marked as ${isRead ? "read" : "unread"}.`,
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Error updating notification status:", error);
    return res
      .status(500)
      .json({ error: "Error updating notification status" });
  }
};

module.exports = {
  initializeNotificationController,
  sendNotificationToUser,
  sendGlobalNotification,
  sendFollowNotification,
  getUserNotifications,
  getGlobalNotifications,
  markNotificationAsRead,
  sendCommentNotification,
  clearAllNotifications,
  sendAdminNotification,
  getAdminNotifications,
  deleteAdminNotification,
  updateAdminNotification,
};

const User = require('../models/userSchema');
const axios = require('axios');
const LOGO_URL = "http://localhost:3000/api/logo";

/**
 * updateUserPushToken
 * @param {*} req
 * @param {*} res
 * Expects { "expoPushToken": "ExponentPushToken[xxxxxxx]" } in req.body
 */
async function updateUserPushToken(req, res) {
  try {
    const { expoPushToken } = req.body;

    // Check if token exists
    if (!expoPushToken || !expoPushToken.startsWith("ExponentPushToken")) {
      return res.status(400).json({ error: "Invalid expoPushToken" });
    }

    // Find the authenticated user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's push token
    user.expoPushToken = expoPushToken;
    await user.save();

    console.log(`✅ Push token updated for user ${user._id}: ${expoPushToken}`);

    return res.json({ success: true, message: "Push token updated", token: expoPushToken });
  } catch (err) {
    console.error("❌ Error updating push token:", err);
    return res.status(500).json({ error: "Error updating push token" });
  }
}

async function sendExpoPushNotification(expoPushToken, title, body, data = {}, type = "default") {
  try {
    if (!expoPushToken.startsWith("ExponentPushToken")) {
      console.log("❌ Invalid push token:", expoPushToken);
      return null;
    }

    const screen = type === "admin" ? "HomeScreen" : "ChatScreen";

    const response = await axios.post("https://exp.host/--/api/v2/push/send", {
      to: expoPushToken,
      title,
      body,
      data: { ...data, screen },
      sound: "default",
      icon: LOGO_URL,
    });

    console.log("✅ Push notification sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error sending push notification:", error?.response?.data || error.message);
    return null;
  }
}

// Function to send batch push notifications
async function sendBatchPushNotifications(tokens, title, body, data = {}, type = "default") {
  try {
    const screen = type === "admin" ? "HomeScreen" : "ChatScreen";

    const messages = tokens.map((token) => ({
      to: token,
      title,
      body,
      data: { ...data, screen },
      sound: "default",
      icon: LOGO_URL,
    }));

    const response = await axios.post("https://exp.host/--/api/v2/push/send", messages);

    console.log("✅ Batch push notifications sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error sending batch push notifications:", error?.response?.data || error.message);
    return null;
  }
}

module.exports = { sendExpoPushNotification, updateUserPushToken,sendBatchPushNotifications };

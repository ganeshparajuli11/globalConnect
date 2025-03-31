const crypto = require("crypto");
const User = require("../models/userSchema");
const Message = require("../models/messageSchema");
const { sendRealTimeMessage } = require("./socketController"); // Ensure socketController exports a valid io instance
const { sendExpoPushNotification } = require("./pushTokenController");

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const IV_LENGTH = 16;

/**
 * Encrypts a string using AES-256-CBC.
 */
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const encryptedBuffer = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encryptedBuffer.toString("hex");
};

/**
 * Decrypts an AES-256-CBC encrypted string.
 */
const decrypt = (encryptedText) => {
  try {
    const parts = encryptedText.split(":");
    const iv = Buffer.from(parts.shift(), "hex");
    const encrypted = Buffer.from(parts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    const decryptedBuffer = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decryptedBuffer.toString("utf8");
  } catch (err) {
    console.error("❌ Decryption error:", err.message);
    return "Unable to decrypt message.";
  }
};

/**
 * Sends a message and handles real-time delivery.
 */
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user?.id;
    const { receiverId, content, messageType, postId } = req.body;

    if (!receiverId || !messageType) {
      return res.status(400).json({ error: "Receiver ID and message type are required." });
    }

    let processedContent = content;
    let media = [];

    if (messageType === "text") {
      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "Text content is required." });
      }
      processedContent = encrypt(content);
    }

    if (messageType === "image") {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "At least one image file is required." });
      }
      media = req.files.map((file) => ({
        media_path: `/uploads/messages/${file.filename}`,
        media_type: file.mimetype,
      }));
    }
    console.log("checking nam,e", req.user.name)
    const imageField = messageType === "image" && media.length > 0 ? media[0].media_path : undefined;

    // Save the message in MongoDB
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType,
      content: messageType === "image" ? null : processedContent,
      media: messageType === "image" ? media : [],
      image: imageField,
      post: messageType === "post" ? postId : null,
    });
    await message.save();

    // Emit real-time message (Handled in `socketController.js`)
    sendRealTimeMessage(senderId, receiverId, {
      _id: message._id, // Include the message ID
      sender: { _id: senderId, name: req.user.name },
      receiver: { _id: receiverId, name: (await User.findById(receiverId)).name },
      content: messageType === "text" ? content : null, // Send decrypted text
      messageType,
      media: messageType === "image" ? media : [],
      image: imageField,
      postId: postId || null,
      timestamp: message.timestamp,
    });
    const senderData = await User.findById(senderId, "name").lean();
    // Send push notification if receiver is offline
    const receiver = await User.findById(receiverId, "expoPushToken name").lean();
    if (receiver?.expoPushToken) {
      let pushMessage = `${senderData.name || "Someone"} sent you a message.`;
      if (messageType === "text") pushMessage = `${senderData.name || "Someone"}: ${content}`;
else if (messageType === "image") pushMessage = `${senderData.name || "Someone"} sent an image.`;
else if (messageType === "post") pushMessage = `${senderData.name || "Someone"} shared a post with you.`;

      const payload = { screen: "chat", senderId, name: senderData.name };
      console.log("Push payload:", message.content, payload);
      await sendExpoPushNotification(receiver.expoPushToken, "New Message Received", pushMessage, payload, "message");
    }

    res.status(200).json({ success: true, message: "Message sent successfully.", data: message });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ error: "An error occurred while sending the message." });
  }
};

/**
 * Mark a message as read.
 */
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.body;
    if (!messageId) {
      return res.status(400).json({ error: "Message ID is required." });
    }

    const message = await Message.findByIdAndUpdate(
      messageId,
      { readByReceiver: true },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ error: "Message not found." });
    }

    sendRealTimeMessage(message.sender, message.receiver, {
      messageId,
      readByReceiver: true,
      readAt: Date.now(),
    });

    res.status(200).json({ success: true, message: "Message marked as read.", data: message });
  } catch (error) {
    console.error("❌ Error marking message as read:", error);
    res.status(500).json({ error: "Failed to mark message as read." });
  }
};

/**
 * Fetch messages between current user and a partner (used by both admin and regular users).
 * For regular users, the request body should include senderId (partner's ID).
 */
const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { senderId, lastReadTimestamp } = req.body;

    if (!senderId) {
      return res.status(400).json({ error: "Sender ID is required." });
    }

    const query = {
      $or: [
        { sender: currentUserId, receiver: senderId },
        { sender: senderId, receiver: currentUserId }
      ]
    };

    if (lastReadTimestamp) {
      query.timestamp = { $gt: new Date(parseInt(lastReadTimestamp)) };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: 1 })
      .populate("sender", "name")
      .populate("receiver", "name")
      .lean();

    if (!messages.length) {
      return res.status(200).json({
        success: true,
        message: "No new messages found.",
        data: []
      });
    }

    const formattedMessages = messages.map((msg) => {
      let senderInfo = msg.sender;
      if (msg.sender && msg.sender._id.toString() === currentUserId.toString()) {
        senderInfo = { _id: msg.sender._id, name: "You" };
      }
      return {
        _id: msg._id,
        sender: senderInfo,
        receiver: msg.receiver,
        messageType: msg.messageType,
        content: msg.messageType === "text" ? decrypt(msg.content) : msg.content,
        media: msg.media || [],
        image: msg.image || null,
        postId: msg.post || null,
        timestamp: msg.timestamp,
        readByReceiver: msg.readByReceiver,
      };
    });

    res.status(200).json({
      success: true,
      message: "Messages fetched successfully.",
      data: formattedMessages,
    });
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
};

/**
 * Fetch all conversations for the current user.
 * For non-admins, the query includes users from their following/followers as well as any user with role "admin".
 */
const getAllMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === "admin";
    const { searchQuery = "", page = 1, limit = 20 } = req.query;

    // Base query: match name based on search
    let query = {
      name: { $regex: searchQuery, $options: "i" }
    };

    if (!isAdmin) {
      const currentUser = await User.findById(currentUserId, "following followers").lean();

      const mutualFollowers = currentUser.followers.filter(follower =>
        currentUser.following.some(following => following._id.toString() === follower._id.toString())
      );

      const userIdsToSearch = new Set([
        ...currentUser.following.map(user => user.toString()),
        ...currentUser.followers.map(user => user.toString()),
        ...mutualFollowers.map(user => user.toString())
      ]);

      // Include any user with role "admin" automatically.
      query.$or = [
        { _id: { $in: Array.from(userIdsToSearch) } },
        { role: "admin" }
      ];
    }

    const users = await User.find(query, "_id name avatar profile_image")
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const conversations = await Promise.all(
      users.map(async (user) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: currentUserId, receiver: user._id },
            { sender: user._id, receiver: currentUserId },
          ],
        })
          .sort({ timestamp: -1 })
          .lean();

        return {
          userId: user._id,
          name: user.name,
          avatar: user.avatar || user.profile_image,
          lastMessage: lastMessage
            ? lastMessage.messageType === "text"
              ? decrypt(lastMessage.content)
              : lastMessage.messageType === "image"
                ? "Sent an image"
                : "Shared a post"
            : "Start a new conversation",
          timestamp: lastMessage ? lastMessage.timestamp : null,
          hasMessages: !!lastMessage,
        };
      })
    );

    conversations.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    res.status(200).json({
      success: true,
      message: isAdmin
        ? "Admin: All users fetched with last messages."
        : "User: Allowed contacts fetched with last messages.",
      data: conversations,
      pagination: { page, limit, total: conversations.length },
    });
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    res.status(500).json({ success: false, message: "Failed to fetch conversations." });
  }
};

/**
 * Fetch messages for admin between the admin and a specific user.
 * The request body should include userId (the conversation partner’s ID).
 */
const getMessagesForAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only." });
    }

    const currentUserId = req.user.id;
    const { userId, lastReadTimestamp } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const query = {
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    };

    if (lastReadTimestamp) {
      query.timestamp = { $gt: new Date(parseInt(lastReadTimestamp)) };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: 1 })
      .populate("sender", "name")
      .populate("receiver", "name")
      .lean();

    if (!messages.length) {
      return res.status(200).json({
        success: true,
        message: "No new messages found.",
        data: []
      });
    }

    const formattedMessages = messages.map((msg) => {
      let senderInfo = msg.sender;
      if (msg.sender && msg.sender._id.toString() === currentUserId.toString()) {
        senderInfo = { _id: msg.sender._id, name: "You" };
      }
      return {
        _id: msg._id,
        sender: senderInfo,
        receiver: msg.receiver,
        messageType: msg.messageType,
        content: msg.messageType === "text" ? decrypt(msg.content) : msg.content,
        media: msg.media || [],
        image: msg.image || null,
        postId: msg.post || null,
        timestamp: msg.timestamp,
        readByReceiver: msg.readByReceiver,
      };
    });

    res.status(200).json({
      success: true,
      message: "Messages fetched successfully.",
      data: formattedMessages,
    });
  } catch (error) {
    console.error("❌ Error fetching messages for admin:", error);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markMessageAsRead,
  getAllMessages,
  getMessagesForAdmin,
};

const crypto = require("crypto");
const User = require("../models/userSchema");
const Message = require("../models/messageSchema");
const Post = require("../models/postSchema");
const { sendFirebaseNotification } = require("./firebaseController");
const { onlineUsers } = require("./socketController");
const { sendExpoPushNotification } = require("./pushTokenController");

// Encryption configuration
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const IV_LENGTH = 16; // AES block size

/**
 * Encrypts a string using AES-256-CBC.
 * Returns the result in the format: iv:encryptedData (both hex-encoded).
 */
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const encryptedBuffer = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encryptedBuffer.toString("hex");
};

/**
 * Decrypts an AES-256-CBC encrypted string (colon-separated format).
 */
const decrypt = (encryptedText) => {
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encrypted = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const decryptedBuffer = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decryptedBuffer.toString("utf8");
};

/**
 * Helper: Emits a real‑time message event using Socket.IO.
 */
const emitMessage = (io, receiverId, payload) => {
  const recipientSocketId = onlineUsers.get(receiverId);
  if (recipientSocketId) {
    io.to(recipientSocketId).emit("receiveMessage", payload);
    console.log(`Message emitted to ${receiverId} at socket ${recipientSocketId}`);
  } else {
    console.log(`Receiver ${receiverId} is offline. Message stored.`);
  }
};

/**
 * Checks if two users can message each other (mutual following).
 */
const canMessage = async (userId1, userId2) => {
  try {
    const user1 = await User.findById(userId1);
    const user2 = await User.findById(userId2);
    return user1.following.includes(userId2) && user2.followers.includes(userId1);
  } catch (error) {
    console.error("Error in canMessage:", error);
    return false;
  }
};

/**
 * Formats a Message document for API responses.
 * Decrypts text messages and converts image data if necessary.
 */
const formatMessage = (message, currentUserId) => {
  let formattedContent = message.content;
  if (message.messageType === "text" && message.content) {
    try {
      formattedContent = decrypt(message.content);
    } catch (err) {
      console.error("Decryption error:", err.message);
      formattedContent = "Unable to decrypt message.";
    }
  }

  let formattedImage = null;
  if (message.messageType === "image" && message.image) {
    formattedImage = Buffer.isBuffer(message.image)
      ? message.image.toString("utf8")
      : message.image;
  }

  return {
    _id: message._id,
    sender: {
      _id: message.sender._id,
      name: message.sender._id.toString() === currentUserId.toString()
        ? "You"
        : message.sender.name,
      avatar: message.sender.avatar || message.sender.profile_image,
    },
    receiver: {
      _id: message.receiver._id,
      name: message.receiver.name,
      avatar: message.receiver.avatar || message.receiver.profile_image,
    },
    messageType: message.messageType,
    content: message.messageType === "text" ? formattedContent : message.content,
    media: message.messageType === "image" ? message.media : undefined,
    image: formattedImage,
    post: message.post
      ? {
          _id: message.post._id,
          title: message.post.title,
          image: message.post.image,
        }
      : null,
    timestamp: message.timestamp,
    readByReceiver: message.readByReceiver,
    isAdmin: message.isAdmin || false,
  };
};


const sendMessage = async (req, res, io) => {
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
        return res.status(400).json({ error: "Text content is required for text messages." });
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

    // Emit real‑time message (using plain text content for immediate display)
    emitMessage(io, receiverId, {
      senderId,
      content: messageType === "text" ? content : null,
      messageType,
      media: messageType === "image" ? media : [],
      postId: postId || null,
      timestamp: Date.now(),
    });

    // Only send push notification if:
    // 1. The receiver is not online, and
    // 2. The receiver is not the same as the sender.
    const recipientSocketId = onlineUsers.get(receiverId);
    if (!recipientSocketId && receiverId !== senderId) {
      // Fetch receiver's Expo push token (if available)
      const receiver = await User.findById(receiverId, "expoPushToken name").lean();
      const sender = await User.findById(senderId, "name").lean();

      if (receiver?.expoPushToken) {
        let pushMessage = `${sender?.name || "Someone"} sent you a message.`;
        if (messageType === "text") {
          pushMessage = `${sender?.name || "Someone"}: ${content}`;
        } else if (messageType === "image") {
          pushMessage = `${sender?.name || "Someone"} sent an image.`;
        } else if (messageType === "post") {
          pushMessage = `${sender?.name || "Someone"} shared a post with you.`;
        }

        await sendExpoPushNotification(
          receiver.expoPushToken,
          "New Message",
          pushMessage,
          { screen: "ChatScreen", senderId }
        );
        console.log(`Push notification sent to ${receiverId}`);
      }
    } else {
      console.log(`Receiver ${receiverId} is online or is the sender; skipping push notification.`);
    }

    res.status(200).json({ success: true, message: "Message sent successfully.", data: message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "An error occurred while sending the message." });
  }
};


/**
 * Controller: Retrieve conversation between the current user and another user.
 */
const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({ success: false, message: "Sender ID is required." });
    }

    // Fetch messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: senderId },
        { sender: senderId, receiver: currentUserId },
      ],
    })
      .sort({ timestamp: 1 })
      .populate("sender", "name profile_image avatar")
      .populate("receiver", "name profile_image avatar")
      .populate("post")
      .lean();

    if (!messages.length) {
      return res.status(200).json({ success: true, message: "No messages found.", data: [] });
    }

    // Format messages for UI, decrypting text messages
    const formattedMessages = messages.map((msg) => ({
      _id: msg._id,
      sender: {
        _id: msg.sender._id,
        name: msg.sender._id.toString() === currentUserId.toString() ? "You" : msg.sender.name,
        avatar: msg.sender.avatar || msg.sender.profile_image || null,
      },
      receiver: {
        _id: msg.receiver._id,
        name: msg.receiver.name,
        avatar: msg.receiver.avatar || msg.receiver.profile_image || null,
      },
      messageType: msg.messageType,
      content: msg.messageType === "text" ? decrypt(msg.content) : msg.content,
      media: msg.messageType === "image" ? msg.media : undefined,
      image: msg.image || null,
      post: msg.post
        ? {
            _id: msg.post._id,
            title: msg.post.title,
            image: msg.post.image,
          }
        : null,
      timestamp: msg.timestamp,
      readByReceiver: msg.readByReceiver,
    }));

    res.status(200).json({ success: true, message: "Messages fetched successfully.", data: formattedMessages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Failed to fetch messages." });
  }
};

/**
 * Controller: Retrieve all conversation threads for the current user.
 */
const getAllMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { searchQuery } = req.query;

    // Get current user's data with following/followers populated
    const currentUser = await User.findById(currentUserId)
      .populate("following", "name avatar profile_image")
      .populate("followers", "name avatar profile_image");

    // Get mutual followers (users who follow each other)
    const mutualFollowers = currentUser.followers.filter(follower =>
      currentUser.following.some(following => following._id.toString() === follower._id.toString())
    );
    const mutualFollowerIds = new Set(mutualFollowers.map(user => user._id.toString()));

    // Get admin users and their IDs
    const adminUsers = await User.find({ role: "admin" }).select("_id name avatar profile_image");
    const adminIds = adminUsers.map(admin => admin._id.toString());

    // Combine mutual followers and admin IDs
    const conversationParticipants = Array.from(new Set([...mutualFollowerIds, ...adminIds]));

    // Query messages involving current user and conversation participants
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: { $in: conversationParticipants } },
        { receiver: currentUserId, sender: { $in: conversationParticipants } }
      ]
    })
      .sort({ timestamp: -1 })
      .populate("sender receiver", "name avatar profile_image");

    // Build conversation map (one per other user)
    const conversationMap = {};
    messages.forEach(msg => {
      const otherUser = msg.sender._id.toString() === currentUserId.toString() ? msg.receiver : msg.sender;
      const otherUserId = otherUser._id.toString();

      let lastMessagePreview = "";
      if (msg.messageType === "text" && msg.content) {
        try {
          lastMessagePreview = decrypt(msg.content);
        } catch (err) {
          console.error("Decryption error in preview:", err.message);
          lastMessagePreview = "Encrypted message";
        }
      } else if (msg.messageType === "image") {
        lastMessagePreview = "Image";
      } else if (msg.messageType === "post") {
        lastMessagePreview = "Post";
      }

      if (!conversationMap[otherUserId] || conversationMap[otherUserId].timestamp < msg.timestamp) {
        conversationMap[otherUserId] = {
          userId: otherUser._id,
          name: otherUser.name,
          avatar: otherUser.avatar || otherUser.profile_image,
          lastMessage: lastMessagePreview,
          timestamp: msg.timestamp,
          hasMessages: true
        };
      }
    });

    // Add conversation participants without messages
    conversationParticipants.forEach(participantId => {
      if (!conversationMap[participantId]) {
        let foundUser =
          mutualFollowers.find(u => u._id.toString() === participantId) ||
          adminUsers.find(u => u._id.toString() === participantId);
        if (foundUser) {
          conversationMap[participantId] = {
            userId: foundUser._id,
            name: foundUser.name,
            avatar: foundUser.avatar || foundUser.profile_image,
            lastMessage: "",
            timestamp: null,
            hasMessages: false
          };
        }
      }
    });

    let results = Object.values(conversationMap);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(conv => conv.name.toLowerCase().includes(query));
    }

    // Sort results: conversations with messages first (by timestamp), then alphabetically
    results.sort((a, b) => {
      if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
      if (a.timestamp) return -1;
      if (b.timestamp) return 1;
      return a.name.localeCompare(b.name);
    });

    res.status(200).json({
      success: true,
      message: "Mutual followers and admin messages fetched successfully.",
      data: results
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Failed to fetch messages." });
  }
};


const adminSendMessage = async (req, res, io) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can use this endpoint." });
    }
    const senderId = req.user.id;
    const { receiverId, content, messageType, postId } = req.body;

    if (!receiverId || !messageType) {
      return res.status(400).json({ error: "Receiver ID and message type are required." });
    }

    let processedContent = content;
    let media = [];

    if (messageType === "text") {
      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "Text content is required for text messages." });
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

    const imageField = messageType === "image" && media.length > 0 ? media[0].media_path : undefined;

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType,
      content: messageType === "image" ? null : processedContent,
      media: messageType === "image" ? media : [],
      image: imageField,
      post: messageType === "post" ? postId : null,
      isAdmin: true,
    });
    await message.save();

    emitMessage(io, receiverId, {
      senderId,
      content: messageType === "text" ? content : null,
      messageType,
      media: messageType === "image" ? media : [],
      postId: postId || null,
      timestamp: Date.now(),
      isAdmin: true,
    });

    res.status(200).json({ success: true, message: "Admin message sent successfully.", data: message });
  } catch (error) {
    console.error("Error sending admin message:", error);
    res.status(500).json({ error: "An error occurred while sending the admin message." });
  }
};


const adminGetMessages = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can use this endpoint." });
    }
    const adminId = req.user.id;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }
    const messages = await Message.find({
      $or: [
        { sender: adminId, receiver: userId },
        { sender: userId, receiver: adminId },
      ],
    })
      .sort({ timestamp: 1 })
      .populate("sender receiver", "name avatar profile_image")
      .populate("post");

    const formattedMessages = messages.map((msg) => formatMessage(msg, adminId));
    res.status(200).json({ success: true, message: "Admin messages fetched successfully.", data: formattedMessages });
  } catch (error) {
    console.error("Error fetching admin messages:", error);
    res.status(500).json({ error: "Failed to fetch admin messages." });
  }
};


const adminGetAllMessages = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can use this endpoint." });
    }

    const adminId = req.user.id;
    const { searchQuery } = req.query;

    // Get all messages where admin is either sender or receiver
    const messages = await Message.find({
      $or: [{ sender: adminId }, { receiver: adminId }],
    })
      .sort({ timestamp: -1 })
      .populate({
        path: "sender",
        select: "name email avatar profile_image"
      })
      .populate({
        path: "receiver",
        select: "name email avatar profile_image"
      });

    if (!messages.length) {
      return res.status(200).json({ 
        success: true, 
        message: "No messages found.", 
        data: [] 
      });
    }

    // Create a map to store unique conversations with latest message
    const conversationMap = new Map();

    // Process messages to create conversation map
    messages.forEach(msg => {
      const otherUser = msg.sender._id.toString() === adminId.toString() ? msg.receiver : msg.sender;
      const userId = otherUser._id.toString();

      let lastMessagePreview = "";
      if (msg.messageType === "text" && msg.content) {
        try {
          lastMessagePreview = decrypt(msg.content);
        } catch (err) {
          console.error("Decryption error in preview:", err.message);
          lastMessagePreview = "Encrypted message";
        }
      } else if (msg.messageType === "image") {
        lastMessagePreview = "Image";
      } else if (msg.messageType === "post") {
        lastMessagePreview = "Post";
      }

      // Only update if this is a more recent message for this user
      if (!conversationMap.has(userId) || 
          conversationMap.get(userId).timestamp < msg.timestamp) {
        conversationMap.set(userId, {
          userId: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          avatar: otherUser.avatar || otherUser.profile_image,
          lastMessage: lastMessagePreview,
          timestamp: msg.timestamp,
          unreadCount: 0 // You can implement unread count logic here
        });
      }
    });

    // Convert map to array
    let conversations = Array.from(conversationMap.values());

    // Apply search filter if query exists
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      conversations = conversations.filter(conv => 
        conv.name.toLowerCase().includes(query) || 
        conv.email.toLowerCase().includes(query)
      );
    }

    // Sort conversations by timestamp (most recent first)
    conversations.sort((a, b) => b.timestamp - a.timestamp);

    res.status(200).json({
      success: true,
      message: "Admin conversations fetched successfully.",
      data: {
        conversations,
        total: conversations.length,
        hasSearch: !!searchQuery
      }
    });

  } catch (error) {
    console.error("Error fetching admin conversations:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch admin conversations.",
      error: error.message 
    });
  }
};

module.exports = {
  canMessage,
  sendMessage,
  getMessages,
  getAllMessages,
  adminSendMessage,
  adminGetMessages,
  adminGetAllMessages,
};


const express = require("express");
const { 
  sendMessage, 
  getMessages, 
} = require("../controller/userMessaging");
const { checkAuthentication } = require("../middleware/middleware");
const { uploadMessageMedia } = require("../middleware/uploadMiddleware");


module.exports = (io) => {
  const router = express.Router();

  router.post(
    "/message",
    checkAuthentication,
    uploadMessageMedia.array("media", 1), 
    (req, res, next) => next(),
    (req, res) => sendMessage(req, res, io)
  );

  router.post("/get-message", checkAuthentication, getMessages);
  router.get("/all-message", checkAuthentication, getAllMessages);

  // ----- Admin Messaging Routes -----
  router.post(
    "/admin/message",
    checkAuthentication,
    uploadMessageMedia.array("media", 1), 
    (req, res, next) => next(),
    (req, res) => adminSendMessage(req, res, io)
  );

  router.post("/admin/get-message", checkAuthentication, adminGetMessages);
  router.get("/admin/all-message", checkAuthentication, adminGetAllMessages);

  return router;
};

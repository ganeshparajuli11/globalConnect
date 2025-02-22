const crypto = require("crypto");
const User = require("../models/userSchema");
const Message = require("../models/messageSchema");
const Post = require("../models/postSchema");
const { sendFirebaseNotification } = require("./firebaseController");
const { onlineUsers } = require("./socketController");

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
 * Helper: Emits a real-time message event using Socket.IO.
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
 * Decrypts text messages and, for image messages, converts binary image data
 * into a UTF‑8 string (e.g. "/uploads/messages/filename.png") so that the frontend
 * can directly build the full URL.
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
    // If image is stored as binary (Buffer), convert it to UTF‑8 string.
    if (Buffer.isBuffer(message.image)) {
      formattedImage = message.image.toString("utf8");
    } else {
      formattedImage = message.image;
    }
  }
  
  return {
    _id: message._id,
    sender: {
      _id: message.sender._id,
      name:
        message.sender._id.toString() === currentUserId.toString()
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
    // For image messages, include media array if needed
    media: message.messageType === "image" ? message.media : undefined,
    // Include converted image field
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

/**
 * Controller: Regular user sends a message.
 */
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

    // If your Message schema requires an "image" field for image messages, assign the first file's URL.
    const imageField = messageType === "image" && media.length > 0 ? media[0].media_path : undefined;

    // Save the message
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

    // Emit the real-time message (plain text is sent for immediate display)
    emitMessage(io, receiverId, {
      senderId,
      content: messageType === "text" ? content : null,
      messageType,
      media: messageType === "image" ? media : [],
      postId: postId || null,
      timestamp: Date.now(),
    });

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

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: senderId },
        { sender: senderId, receiver: currentUserId },
      ],
    })
      .sort({ timestamp: 1 })
      .populate("sender receiver", "name avatar profile_image")
      .populate("post");

    const formattedMessages = messages.map((msg) => formatMessage(msg, currentUserId));
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
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    })
      .sort({ timestamp: -1 })
      .populate("sender receiver", "name avatar profile_image");

    if (!messages.length) {
      return res.status(200).json({ success: true, message: "No messages found.", data: [] });
    }

    const conversationMap = messages.reduce((acc, msg) => {
      const otherUser = msg.sender._id.toString() === currentUserId.toString() ? msg.receiver : msg.sender;
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
      if (!acc[otherUser._id]) {
        acc[otherUser._id] = {
          userId: otherUser._id,
          name: otherUser.name,
          avatar: otherUser.avatar || otherUser.profile_image,
          lastMessage: lastMessagePreview,
          timestamp: msg.timestamp,
        };
      }
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: "Messages fetched successfully.",
      data: Object.values(conversationMap),
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

/**
 * Controller: Admin sends a message to any user.
 * Bypasses mutual following checks and marks the message with an admin flag.
 */
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

/**
 * Controller: Retrieve conversation between an admin and a specific user.
 */
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

/**
 * Controller: Retrieve all conversation threads for an admin.
 */
const adminGetAllMessages = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admin can use this endpoint." });
    }
    const adminId = req.user.id;
    const messages = await Message.find({
      $or: [{ sender: adminId }, { receiver: adminId }],
    })
      .sort({ timestamp: -1 })
      .populate("sender receiver", "name avatar profile_image");

    if (!messages.length) {
      return res.status(200).json({ success: true, message: "No messages found.", data: [] });
    }

    const conversationMap = messages.reduce((acc, msg) => {
      const otherUser = msg.sender._id.toString() === adminId.toString() ? msg.receiver : msg.sender;
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
      if (!acc[otherUser._id]) {
        acc[otherUser._id] = {
          userId: otherUser._id,
          name: otherUser.name,
          avatar: otherUser.avatar || otherUser.profile_image,
          lastMessage: lastMessagePreview,
          timestamp: msg.timestamp,
        };
      }
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: "Admin conversations fetched successfully.",
      data: Object.values(conversationMap),
    });
  } catch (error) {
    console.error("Error fetching admin conversations:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admin conversations." });
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

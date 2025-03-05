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
    const { searchQuery } = req.query;

    // Get the current user's data with following/followers
    const currentUser = await User.findById(currentUserId)
      .populate('following', 'name avatar profile_image')
      .populate('followers', 'name avatar profile_image');

    // Get mutual followers (users who follow each other)
    const mutualFollowers = currentUser.followers.filter(follower =>
      currentUser.following.some(following => following._id.toString() === follower._id.toString())
    );
    const mutualFollowerIds = new Set(mutualFollowers.map(user => user._id.toString()));

    // Get admin users and extract their IDs
    const adminUsers = await User.find({ role: "admin" }).select("_id name avatar profile_image");
    const adminIds = adminUsers.map(admin => admin._id.toString());

    // Combine mutual follower IDs and admin IDs into one set
    const conversationParticipants = Array.from(new Set([...mutualFollowerIds, ...adminIds]));

    // Query messages with conversation participants (either as sender or receiver)
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: { $in: conversationParticipants } },
        { receiver: currentUserId, sender: { $in: conversationParticipants } }
      ]
    })
      .sort({ timestamp: -1 })
      .populate("sender receiver", "name avatar profile_image");

    // Build a conversation map: one conversation per other user
    const conversationMap = {};

    messages.forEach(msg => {
      const otherUser = msg.sender._id.toString() === currentUserId.toString() ? msg.receiver : msg.sender;
      const otherUserId = otherUser._id.toString();

      // Prepare a preview of the last message
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

      // Keep the most recent message per conversation
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

    // Ensure that all conversation participants are included,
    // even if there are no messages yet.
    conversationParticipants.forEach(participantId => {
      if (!conversationMap[participantId]) {
        // Try to find the participant in mutual followers or adminUsers.
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
      results = results.filter(conv =>
        conv.name.toLowerCase().includes(query)
      );
    }

    // Sort the results: conversations with messages (by timestamp) first,
    // then the rest alphabetically.
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

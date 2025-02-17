const crypto = require("crypto");
const User = require("../models/userSchema");
const Message = require("../models/messageSchema");
const Post = require("../models/postSchema"); // For handling post messages
const { sendFirebaseNotification } = require("./firebaseController");
const { io } = require("../app");

// Convert the hex string from .env to a 32-byte Buffer.
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const IV_LENGTH = 16; // AES block size

/**
 * Encrypts a given text (expects a string) using AES-256-CBC.
 * Returns a string in the format: iv:encryptedData (both in hex)
 */
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const encryptedBuffer = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return iv.toString("hex") + ":" + encryptedBuffer.toString("hex");
};

/**
 * Decrypts an encrypted text (expects the colon-separated string format)
 * and returns the decrypted text.
 */
const decrypt = (encryptedText) => {
  const textParts = encryptedText.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encrypted = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  const decryptedBuffer = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decryptedBuffer.toString("utf8");
};

/**
 * Checks if two users can message each other.
 * Both users must follow each other.
 */
const canMessage = async (userId1, userId2) => {
  const user1 = await User.findById(userId1);
  const user2 = await User.findById(userId2);

  // Check if both users follow each other
  const user1FollowsUser2 = user1.following.includes(userId2);
  const user2FollowsUser1 = user2.followers.includes(userId1);

  return user1FollowsUser2 && user2FollowsUser1;
};

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user?.id;
    const { receiverId, content, messageType, postId } = req.body;

    console.log("SenderId:", senderId);
    console.log("ReceiverId:", receiverId);
    console.log("MessageType:", messageType);
    console.log("Content:", content);

    if (!receiverId || !messageType) {
      return res
        .status(400)
        .json({ error: "Receiver ID and message type are required." });
    }

    let encryptedContent = content; // Initialize with content as-is
    let media = []; // Store uploaded media if message type is 'image'

    // Handle text message
    if (messageType === "text") {
      if (!content || typeof content !== "string") {
        return res
          .status(400)
          .json({ error: "Text content is required for text messages." });
      }
      encryptedContent = encrypt(content);
    }

    // Handle image messages (similar to post media processing)
    if (messageType === "image") {
      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one image file is required." });
      }

      // Process uploaded media files
      media = req.files.map((file) => ({
        media_path: `/uploads/messages/${file.filename}`,
        media_type: file.mimetype,
      }));
    }

    // Create and save the message
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType,
      content: messageType === "image" ? null : encryptedContent, // Store null if it's an image message
      media: messageType === "image" ? media : [], // Store media array for image messages
      post: messageType === "post" ? postId : null,
    });

    await message.save();

    // Send message via WebSocket if receiver is online
    if (io && io.sockets.adapter.rooms.has(receiverId)) {
      io.to(receiverId).emit("newMessage", { senderId, message });
      console.log(`Message sent to Receiver: ${receiverId}`);
    } else {
      console.log(`Receiver ${receiverId} is not connected to WebSocket.`);
    }

    res.status(200).json({
      success: true,
      message: "Message sent successfully.",
      data: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res
      .status(500)
      .json({ error: "An error occurred while sending the message." });
  }
};


const getMessages = async (req, res) => {
  try {
    const receiverId = req.user.id;
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({
        success: false,
        message: "Sender ID is required.",
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: receiverId, receiver: senderId },
        { sender: senderId, receiver: receiverId },
      ],
    })
      .sort({ timestamp: 1 })
      .populate("sender receiver", "name avatar profile_image")
      .populate("post");

    const formattedMessages = messages.map((message) => {
      let decryptedContent = null;
      if (message.messageType === "text" && message.content) {
        try {
          decryptedContent = decrypt(message.content);
        } catch (err) {
          console.error("Decryption error:", err.message);
          decryptedContent = "Unable to decrypt message.";
        }
      } else if (message.messageType === "image" && message.image) {
        try {
          // Convert the stored Buffer to a string and then decrypt.
          const encryptedImageStr = message.image.toString("utf8");
          const decryptedHex = decrypt(encryptedImageStr);
          const imageBuffer = Buffer.from(decryptedHex, "hex");
          // Convert to base64 so the client can render it as an image.
          decryptedContent = imageBuffer.toString("base64");
        } catch (err) {
          console.error("Decryption error for image:", err.message);
          decryptedContent = "Unable to decrypt image.";
        }
      }

      return {
        _id: message._id,
        sender: {
          _id: message.sender._id,
          name:
            message.sender._id.toString() === receiverId
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
        // For text and image messages, use the decrypted content.
        content:
          message.messageType === "text" || message.messageType === "image"
            ? decryptedContent
            : message.content,
        post: message.post
          ? {
              _id: message.post._id,
              title: message.post.title,
              image: message.post.image,
            }
          : null,
        timestamp: message.timestamp,
        readByReceiver: message.readByReceiver,
      };
    });

    res.status(200).json({
      success: true,
      message: "Messages fetched successfully.",
      data: formattedMessages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages.",
    });
  }
};

/**
 * Controller for retrieving a list of conversation partners along with
 * the last message exchanged with each.
 */
const getAllMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("user id:", userId);

    // Find messages where the user is either the sender or receiver.
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .sort({ timestamp: -1 })
      .populate("sender receiver", "name avatar profile_image");

    if (!messages.length) {
      return res.status(200).json({
        success: true,
        message: "No messages found.",
        data: [],
      });
    }

    // Build a unique map of conversation partners with their last message details.
    const uniqueUsers = messages.reduce((acc, message) => {
      // Determine the conversation partner.
      const otherUser =
        message.sender._id.toString() === userId.toString()
          ? message.receiver
          : message.sender;

      // Prepare a preview for the last message based on its type.
      let lastMessagePreview = "";
      if (message.messageType === "text" && message.content) {
        try {
          lastMessagePreview = decrypt(message.content);
        } catch (err) {
          console.error("Decryption error in preview:", err.message);
          lastMessagePreview = "Encrypted message";
        }
      } else if (message.messageType === "image") {
        lastMessagePreview = "Image";
      } else if (message.messageType === "post") {
        lastMessagePreview = "Post";
      }

      if (!acc[otherUser._id]) {
        acc[otherUser._id] = {
          userId: otherUser._id,
          name: otherUser.name,
          avatar: otherUser.avatar || otherUser.profile_image,
          lastMessage: lastMessagePreview,
          timestamp: message.timestamp,
        };
      }
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: "Messages fetched successfully.",
      data: Object.values(uniqueUsers),
    });
    console.log("Message sent from the backend");
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

module.exports = { canMessage, sendMessage, getMessages, getAllMessages };

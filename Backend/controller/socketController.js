const User = require("../models/userSchema");
const { sendExpoPushNotification } = require("./pushTokenController"); // Assuming you have this
let onlineUsers = new Map(); // Track online users
let ioInstance; // Store the Socket.IO instance

const handleConnection = (io, socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", (userId) => {
    if (!userId) {
      console.error(`⚠️ Join event received without userId for socket: ${socket.id}`);
      return;
    }

    try {
      // Remove any existing socket connection for this user (handle device switching)
      const existingSocket = onlineUsers.get(userId);
      if (existingSocket && existingSocket !== socket.id) {
        console.log(`🔄 User ${userId} switched devices. Removing old socket: ${existingSocket}`);
        const oldSocket = io.sockets.sockets.get(existingSocket);
        if (oldSocket) oldSocket.disconnect(true); // Force disconnect old socket
      }

      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      console.log(`✅ User ${userId} joined with socket ID: ${socket.id}`);
      io.emit("updateOnlineUsers", Array.from(onlineUsers.keys())); // Notify all clients of online users
      socket.emit("joinAcknowledged", { success: true, userId, socketId: socket.id });
      updateUserLastActivity(userId); // Update last activity

    } catch (error) {
      console.error(`❌ Error in join handler for user ${userId}:`, error);
      socket.emit("joinAcknowledged", { success: false, error: error.message });
    }
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      console.log(`❌ User ${socket.userId} disconnected from socket ${socket.id}`);
      onlineUsers.delete(socket.userId);
      io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
    }
  });

  socket.on("sendMessage", async (data, callback) => {
    try {
      const { senderId, receiverId, ...rest } = data;
      const roomId = getRoomId(senderId, receiverId); // Helper function (see below)
      ioInstance.to(roomId).emit("receiveMessage", { ...rest, senderId, receiverId });
      console.log(`✅ Message sent to room: ${roomId}`);
      if (callback) callback({ status: "sent" });
    } catch (error) {
      console.error("❌ Error sending message:", error);
      if (callback) callback({ status: "error", error: error.message });
    }
  });

  socket.on("startTyping", (data) => {
    const { receiverId, senderId } = data;
    const recSocketId = onlineUsers.get(receiverId);
    if (recSocketId) ioInstance.to(recSocketId).emit("userTyping", senderId);
  });

  socket.on("stopTyping", (data) => {
    const { receiverId, senderId } = data;
    const recSocketId = onlineUsers.get(receiverId);
    if (recSocketId) ioInstance.to(recSocketId).emit("userStoppedTyping", senderId);
  });

  socket.on("messageRead", async (data) => {
    try {
      const { messageId, senderId } = data;
      const recSocketId = onlineUsers.get(senderId);
      if (recSocketId) ioInstance.to(recSocketId).emit("messageReadAck", messageId);
    } catch (error) {
      console.error("Error in messageRead:", error);
    }
  });

  socket.on("sendFollowNotification", ({ recipientId, followerId }) => {
    sendRealTimeNotification(recipientId, { message: `User ${followerId} followed you!` });
  });

  socket.on("sendLikeNotification", ({ recipientId, likerId, postId }) => {
    sendRealTimeNotification(recipientId, { message: `User ${likerId} liked your post!`, postId });
  });

  socket.on("sendCommentNotification", ({ recipientId, commenterId, commentText, postId }) => {
    sendRealTimeNotification(recipientId, {
      message: `User ${commenterId} commented on your post: "${commentText}"`,
      postId,
    });
  });

  socket.on("error", (error) => {
    console.error(`❌ Socket error for user ${socket.userId}:`, error);
  });
};

const sendRealTimeNotification = (userId, payload) => {
  const recipientSocketId = onlineUsers.get(userId);
  if (recipientSocketId) {
    ioInstance.to(recipientSocketId).emit("receiveNotification", payload);
    console.log(`📩 Notification sent to user ${userId} (Socket: ${recipientSocketId})`);
  } else {
    console.log(`⚠️ User ${userId} is offline. Notification stored.`);
  }
};

const sendRealTimeMessage = (senderId, receiverId, payload) => {
  const recipientSocketId = onlineUsers.get(receiverId);
  if (recipientSocketId) {
    ioInstance.to(recipientSocketId).emit("receiveMessage", payload);
    console.log(`✅ Message sent in real-time to user ${receiverId} (Socket: ${recipientSocketId})`);
  } else {
    console.log(`⚠️ User ${receiverId} is offline. Message will be stored.`);
  }
};

const updateUserLastActivity = async (userId) => {
  try {
    const user = await User.findByIdAndUpdate(userId, { last_activity: new Date(), status: "Active" });
    if (!user) {
      console.warn(`User ${userId} not found for last activity update.`);
    }
  } catch (error) {
    console.error("❌ Error updating user last activity:", error);
  }
};

const getRoomId = (userId1, userId2) => {
  const ids = [userId1, userId2].sort(); // Sort to ensure consistent room name
  return `chat-${ids[0]}-${ids[1]}`;
};

const initSocket = (io) => {
  ioInstance = io; // Store the instance for use in other functions
  io.on("connection", (socket) => {
    handleConnection(io, socket);
  });

  io.on("error", (error) => {
    console.error("❌ Socket.IO server error:", error);
  });

  // Clean up stale connections every 30 seconds
  setInterval(() => {
    onlineUsers.forEach((socketId, userId) => {
      if (!io.sockets.sockets.get(socketId)) {
        console.log(`🗑️ Cleaning up stale connection for user ${userId}`);
        onlineUsers.delete(userId);
        io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
      }
    });
  }, 30000);
};

module.exports = { initSocket, sendRealTimeNotification, sendRealTimeMessage };

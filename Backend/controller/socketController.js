let onlineUsers = new Map(); // Track online users

const handleConnection = (io, socket) => {
  console.log("A user connected:", socket.id);

  // Handle user joining with better error handling
  socket.on("join", (userId) => {
    console.log("Join event received for user:", userId, "Socket ID:", socket.id);
    
    if (!userId) {
      console.error("Join event received without userId for socket:", socket.id);
      return;
    }

    try {
      // Remove any existing socket for this user
      const existingSocket = onlineUsers.get(userId);
      if (existingSocket && existingSocket !== socket.id) {
        console.log(`User ${userId} has a new connection. Removing old socket: ${existingSocket}`);
        const oldSocket = io.sockets.sockets.get(existingSocket);
        if (oldSocket) {
          oldSocket.disconnect();
        }
      }
      
      // Store both socket ID and user ID
      onlineUsers.set(userId, socket.id);
      socket.userId = userId;
      
      console.log(`✅ User ${userId} is online with socket ID: ${socket.id}`);
      console.log("Current online users:", Array.from(onlineUsers.entries()));
      
      // Broadcast updated online users
      io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));

      // Acknowledge successful join
      socket.emit("joinAcknowledged", { 
        success: true, 
        userId, 
        socketId: socket.id 
      });

      // Update user's last_activity in the database
      updateUserLastActivity(userId);
    } catch (error) {
      console.error(`Error in join handler for user ${userId}:`, error);
      socket.emit("joinAcknowledged", { 
        success: false, 
        error: error.message 
      });
    }
  });

  // Handle heartbeat to keep track of active users
  socket.on("heartbeat", async (userId) => {
    try {
      if (userId && socket.userId === userId) {
        await updateUserLastActivity(userId);
        socket.emit("heartbeatAck");
      }
    } catch (error) {
      console.error("Error processing heartbeat:", error);
    }
  });

  // Handle Follow Notification
  socket.on("sendFollowNotification", ({ recipientId, followerId }) => {
    try {
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveNotification", {
          message: `User ${followerId} followed you!`,
        });
      }
    } catch (error) {
      console.error("Error in sendFollowNotification:", error);
    }
  });

  // Handle Like Notification
  socket.on("sendLikeNotification", ({ recipientId, likerId, postId }) => {
    try {
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveNotification", {
          message: `User ${likerId} liked your post!`,
          postId,
        });
      }
    } catch (error) {
      console.error("Error in sendLikeNotification:", error);
    }
  });

  // Enhanced message handling with delivery confirmation
  socket.on("sendMessage", async (data, callback) => {
    try {
      const { senderId, receiverId, content, messageType, media, postId } = data;
      
      console.log("Received message data:", { senderId, receiverId, messageType });
      
      if (!senderId || !receiverId) {
        throw new Error("Missing sender or receiver ID");
      }

      if (!onlineUsers.has(senderId)) {
        console.log(`Sender ${senderId} is not in online users map. Attempting to add...`);
        onlineUsers.set(senderId, socket.id);
      }

      console.log(`📩 Processing message from ${senderId} to ${receiverId}`);
      console.log("Current online users:", Array.from(onlineUsers.entries()));
      
      const recipientSocketId = onlineUsers.get(receiverId);
      console.log("Recipient socket ID:", recipientSocketId);
      
      const messagePayload = {
        senderId,
        receiverId,
        content,
        messageType,
        media,
        postId: postId || null,
        timestamp: Date.now(),
      };

      // Always attempt to emit the message
      if (recipientSocketId) {
        const recipientSocket = io.sockets.sockets.get(recipientSocketId);
        if (recipientSocket && recipientSocket.connected) {
          console.log(`✅ Attempting to deliver message to socket: ${recipientSocketId}`);
          io.to(recipientSocketId).emit("receiveMessage", messagePayload);
          console.log(`✅ Message delivered to socket: ${recipientSocketId}`);
          
          if (callback) callback({ 
            status: "delivered", 
            timestamp: messagePayload.timestamp,
            recipientOnline: true 
          });
        } else {
          console.log(`⚠️ Recipient socket ${recipientSocketId} exists but is not connected`);
          onlineUsers.delete(receiverId); // Clean up stale socket
          if (callback) callback({ 
            status: "stored", 
            timestamp: messagePayload.timestamp,
            recipientOnline: false 
          });
        }
      } else {
        console.log(`⚠️ Recipient ${receiverId} is offline. Message will be stored.`);
        if (callback) callback({ 
          status: "stored", 
          timestamp: messagePayload.timestamp,
          recipientOnline: false 
        });
      }
    } catch (error) {
      console.error("Error in sendMessage handler:", error);
      if (callback) callback({ 
        status: "error", 
        error: error.message 
      });
    }
  });

  // Handle Listening for Messages
  socket.on("receiveMessageRequest", (userId) => {
    console.log(`User ${userId} is listening for messages.`);
    socket.emit("receiveMessageAcknowledged", { message: "Listening for messages..." });
  });

  // Handle user disconnection with cleanup
  socket.on("disconnect", () => {
    if (socket.userId) {
      // Only remove if this socket still owns the user
      if (onlineUsers.get(socket.userId) === socket.id) {
        console.log(`User ${socket.userId} disconnected from socket ${socket.id}`);
        onlineUsers.delete(socket.userId);
        io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
      } else {
        console.log(`Socket ${socket.id} disconnected but was not the active socket for user ${socket.userId}`);
      }
    }
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("Socket error for user", socket.userId, ":", error);
  });
};

// Helper function to update user's last activity
const updateUserLastActivity = async (userId) => {
  try {
    const User = require("../models/userSchema"); // Import User model
    await User.findByIdAndUpdate(userId, {
      last_activity: new Date(),
      status: "Active"
    });
  } catch (error) {
    console.error("Error updating user last activity:", error);
  }
};

// Initialize Socket.IO with error handling
const initSocket = (io) => {
  io.on("connection", (socket) => {
    handleConnection(io, socket);
  });

  io.on("error", (error) => {
    console.error("Socket.IO server error:", error);
  });

  // Periodic cleanup of stale connections
  setInterval(() => {
    onlineUsers.forEach((socketId, userId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (!socket) {
        console.log(`Cleaning up stale connection for user ${userId}`);
        onlineUsers.delete(userId);
        io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
      }
    });
  }, 30000); // Run every 30 seconds
};

module.exports = { initSocket, onlineUsers };

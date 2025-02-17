let onlineUsers = new Map(); // Track online users

// Function to handle user connection
const handleConnection = (io, socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} is online with socket ID: ${socket.id}`);
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

  // Handle Sending Messages
  socket.on("sendMessage", (data, callback) => {
    const { senderId, receiverId, content, messageType, postId } = data;
    console.log(`Sending message from ${senderId} to ${receiverId}...`);
  
    const recipientSocketId = onlineUsers.get(receiverId);
    console.log(`Recipient Socket ID: ${recipientSocketId}`);
  
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", {
        senderId,
        content,
        messageType,
        postId: postId || null,
        timestamp: Date.now(),
      });
  
      if (callback) callback({ status: "delivered", timestamp: Date.now() });
    } else {
      if (callback) callback({ status: "offline", timestamp: Date.now() });
    }
  });
  

  // Handle Receiving Messages
  socket.on("receiveMessageRequest", (userId) => {
    console.log(`User ${userId} is listening for messages.`);
    socket.emit("receiveMessageAcknowledged", { message: "Listening for messages..." });
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log(`User ${socket.userId} is offline.`);
    }
  });
};

// Initialize Socket.IO and attach event handlers
const initSocket = (io) => {
  io.on("connection", (socket) => {
    handleConnection(io, socket);
  });
};

module.exports = { initSocket };

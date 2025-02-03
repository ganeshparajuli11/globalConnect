let onlineUsers = new Map(); // Track online users

// Function to handle user connection
const handleConnection = (io, socket) => {
  console.log("A user connected:", socket.id);

  // When a user joins
  socket.on("join", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} is online.`);
  });

  // Handle Follow Notification
  socket.on("sendFollowNotification", ({ recipientId, followerId }) => {
    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveNotification", {
        message: `User ${followerId} followed you!`,
      });
    }
  });

  // Handle Like Notification
  socket.on("sendLikeNotification", ({ recipientId, likerId, postId }) => {
    const recipientSocketId = onlineUsers.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveNotification", {
        message: `User ${likerId} liked your post!`,
        postId,
      });
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    onlineUsers.forEach((value, key) => {
      if (value === socket.id) {
        onlineUsers.delete(key);
        console.log(`User ${key} is offline.`);
      }
    });
  });
};

// Initialize socket.io and attach event handlers
const initSocket = (io) => {
  io.on("connection", (socket) => {
    handleConnection(io, socket);
  });
};

module.exports = { initSocket };

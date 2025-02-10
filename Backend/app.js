const express = require('express');
const http = require('http'); // Required for integrating socket.io
const socketIo = require('socket.io'); // Socket.io library
const socketController = require('./controller/socketController'); // Socket controller
const mongoose = require('mongoose');
const notificationRoutes = require('./routes/notificationRoutes');
const cors = require('cors');
require('dotenv').config();
const multer = require('multer');
const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
}); 

// Middleware
app.use(cors());
app.use(express.json()); 

const port = 3000;

// Import routes
const userRoutes = require('./routes/userAuthenticationRoute');
const adminUserRoute = require('./routes/adminUserRoute');
const adminSelfRoute = require('./routes/adminSelfRoutes');
const userReportRoute = require('./routes/userReportRoute');
const adminCategoryRoute = require('./routes/adminCategoryRoutes');
const userPostRoute = require('./routes/userPostRoute');
const userCommentRoute = require('./routes/userCommentRoute');
const getUserProfileRoute = require('./routes/userSelfroutes');
const userMessagingRoute = require('./routes/userMessagingRoute');
const userFollowRoute = require('./routes/userFollowRoute');
const adminPolicyRoutes = require('./routes/adminPrivacyPolicy')
const { initSocket } = require('./controller/userFollowController');
initSocket(io);


// API Routes
app.use('/api/users', userRoutes);
app.use('/api/dashboard', adminUserRoute);
app.use('/api/dashboard', adminSelfRoute);
app.use('/api/report', userReportRoute);
app.use('/api/category', adminCategoryRoute);
app.use('/api/post', userPostRoute);
app.use('/api/profile', getUserProfileRoute);
app.use('/api/comment', userCommentRoute);
app.use('/api/notifications', notificationRoutes);
app.use('/api', userMessagingRoute);
app.use('/api', userFollowRoute);
app.use('/api', adminPolicyRoutes);

app.use('/uploads', express.static("uploads")); 

// MongoDB Connection
mongoose
  .connect('mongodb://127.0.0.1:27017/GlobalConnect')
  .then(() => console.log('Connected to MongoDB!'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// Real-time Notification System
let onlineUsers = new Map(); // Track online users

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // User joins with their ID
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

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    onlineUsers.forEach((value, key) => {
      if (value === socket.id) {
        onlineUsers.delete(key);
      }
    });
  });
});

// Start the server and listen on all network interfaces
server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running at http://0.0.0.0:${port}`);
  console.log(`Access it on your local network at http://192.168.18.105:${port}`);
});

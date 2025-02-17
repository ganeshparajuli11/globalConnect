const express = require('express');
const socketIo = require('socket.io');
const multer = require('multer');
const http = require('http'); 
const socketController = require('./controller/socketController'); 
const mongoose = require('mongoose');
const notificationRoutes = require('./routes/notificationRoutes');
const cors = require('cors');
require('dotenv').config();
const app = express();
const server = http.createServer(app); 
const io = socketIo(server);

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



  // Listen for connection events
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Export `io` for use in other parts of your application
module.exports = { io };

// Start the server and listen on all network interfaces
server.listen(port, '0.0.0.0', () => {
  console.log(`Access it on your local network at http://192.168.18.105:${port}`);
});

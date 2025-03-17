const express = require("express");
const socketIo = require("socket.io");
const multer = require("multer");
const http = require("http");
const { initSocket } = require("./controller/socketController"); // Correct usage
const mongoose = require("mongoose");
const notificationRoutes = require("./routes/notificationRoutes");
const pushTokenRoute = require("./routes/pushTokenRoute");
const logoController = require('./controller/logoController');
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Change to your frontend URL if necessary
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Socket.IO properly
initSocket(io); 

const port = 3000;

// Import routes
const userRoutes = require("./routes/userAuthenticationRoute");
const adminUserRoute = require("./routes/adminUserRoute");
const adminSelfRoute = require("./routes/adminSelfRoutes");
const userReportRoute = require("./routes/userReportRoute");
const adminCategoryRoute = require("./routes/adminCategoryRoutes");
const userPostRoute = require("./routes/userPostRoute");
const userCommentRoute = require("./routes/userCommentRoute");
const getUserProfileRoute = require("./routes/userSelfroutes");
const userMessagingRoute = require("./routes/userMessagingRoute")(io);

const userFollowRoute = require("./routes/userFollowRoute");
const adminPolicyRoutes = require("./routes/adminPrivacyPolicy");

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/dashboard", adminUserRoute);
app.use("/api/dashboard", adminSelfRoute);
app.use("/api/report", userReportRoute);
app.use("/api/category", adminCategoryRoute);
app.use("/api/post", userPostRoute);
app.use("/api/profile", getUserProfileRoute);
app.use("/api/comment", userCommentRoute);
app.use("/api/notifications", notificationRoutes);
app.use("/api", userMessagingRoute);
app.use("/api", userFollowRoute);
app.use("/api", adminPolicyRoutes);
app.use("/api", pushTokenRoute);
app.use('/api', logoController);

app.use("/uploads", express.static("uploads"));

// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/GlobalConnect")
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Start the server and listen on all network interfaces
server.listen(port, "0.0.0.0", () => {
  console.log(
    `Access it on your local network at http://192.168.18.105:${port}`
  );
});

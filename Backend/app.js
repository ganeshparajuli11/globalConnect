const express = require("express");
const socketIo = require("socket.io");
const multer = require("multer");
const http = require("http");
const { initSocket } = require("./controller/socketController"); // Correct usage
const mongoose = require("mongoose");
const notificationRoutes = require("./routes/notificationRoutes");
const pushTokenRoute = require("./routes/pushTokenRoute");
const logoController = require('./controller/logoController');
const cron = require("node-cron");
const cors = require("cors");
require("dotenv").config();

// Import your models (make sure these paths are correct)
const User = require("./models/userSchema");
const Post = require("./models/postSchema");

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

// Define checkSuspensions to check and update suspension statuses
const checkSuspensions = async () => {
  console.log("Running suspension check at", new Date().toLocaleString());

  // Check suspended users – assuming a suspended user has a 'suspended_until' field.
  try {
    // Find users with status Suspended and a defined suspended_until value.
    const suspendedUsers = await User.find({ status: "Suspended", suspended_until: { $ne: null } });
    for (const user of suspendedUsers) {
      if (user.suspended_until && new Date() > user.suspended_until) {
        user.status = "Active";
        // Optionally clear the suspension field if needed.
        user.suspended_until = null;
        console.log(`User ${user._id} suspension expired, setting status to Active.`);
        await user.save();
      }
    }
  } catch (err) {
    console.error("Error checking user suspensions:", err);
  }

  // Check suspended posts
  try {
    // Find posts with status Suspended and a defined suspended_until value.
    const suspendedPosts = await Post.find({ status: "Suspended", suspended_until: { $ne: null } });
    for (const post of suspendedPosts) {
      if (post.suspended_until && new Date() > post.suspended_until) {
        post.status = "Active";
        post.isSuspended = false;
        post.suspended_from = null;
        post.suspended_until = null;
        post.suspension_reason = "";
        console.log(`Post ${post._id} suspension expired, setting status to Active.`);
        await post.save();
      }
    }
  } catch (err) {
    console.error("Error checking post suspensions:", err);
  }
};

// Schedule checkSuspensions to run at the start of every hour
cron.schedule("0 * * * *", checkSuspensions);

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

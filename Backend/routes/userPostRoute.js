const express = require("express");
const router = express.Router();
const {
  checkAuthentication,
  checkIsUser,
} = require("../middleware/middleware");
const { createPost, getAllPost } = require("../controller/userPostController");
const { uploadPostMedia } = require("../middleware/uploadMiddleware"); // Correct import

// Define a POST route for creating posts with file upload
router.post(
  "/create",
  checkAuthentication,  // Ensure the user is authenticated first
  checkIsUser,          // Ensure the user is valid (check if user is active)
  uploadPostMedia.array("media", 5), // Upload a maximum of 5 media files
  createPost            // Create the post after authentication, validation, and file upload
);

// Define a GET route to fetch all posts
router.get("/all", getAllPost);

module.exports = router;

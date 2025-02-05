const express = require("express");
const router = express.Router();
const {
  checkAuthentication,
  checkIsUser,
} = require("../middleware/middleware");
const { createPost, getAllPost, likeUnlikePost } = require("../controller/userPostController");
const { uploadPostMedia } = require("../middleware/uploadMiddleware"); // Correct import

// Define a POST route for creating posts with file upload
router.post(
  "/create",
  checkAuthentication,  
  checkIsUser,          
  uploadPostMedia.array("media", 5), 
  createPost           
);

// Define a GET route to fetch all posts
router.get("/all",checkAuthentication, getAllPost);
router.put("/like-unlike/:postId",checkAuthentication, likeUnlikePost);

module.exports = router;

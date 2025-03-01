const express = require("express");
const router = express.Router();
const {
  checkAuthentication,
  checkIsUser,
  checkIsAdmin,
} = require("../middleware/middleware");
const { 
  createPost, 
  getAllPost, 
  likeUnlikePost, 
  getPostById, 
  updatePostStatus, 
  getAllPostAdmin, 
  getPostStatsAdmin,
  searchPosts // <-- added searchPosts controller
} = require("../controller/userPostController");
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
router.get("/all", checkAuthentication, getAllPost);
router.get("/admin/all", checkAuthentication, checkIsAdmin, getAllPostAdmin);
router.get("/admin/stats", checkAuthentication, checkIsAdmin, getPostStatsAdmin);

router.get("/:postId", checkAuthentication, getPostById);
router.put("/status/:postId", checkAuthentication, checkIsAdmin, updatePostStatus);

router.put("/like-unlike/:postId", checkAuthentication, likeUnlikePost);

// New route for searching posts
router.get("/search", checkAuthentication, searchPosts);

module.exports = router;

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
  searchPosts,
  editPost,
  deletePost
} = require("../controller/userPostController");
const { uploadPostMedia } = require("../middleware/uploadMiddleware");
const { sharePost } = require("../controller/userShareController");

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
router.post("/share", checkAuthentication,  sharePost);


// Edit post route - must be placed before /:postId to avoid route conflicts
router.put(
  "/edit/:postId",
  checkAuthentication,
  checkIsUser,
  uploadPostMedia.array("media", 4),
  editPost
);

// Delete post route
router.delete(
  "/:postId",
  checkAuthentication,
  checkIsUser,
  deletePost
);

router.get("/:postId", checkAuthentication, getPostById);
router.put("/status/:postId", checkAuthentication, checkIsAdmin, updatePostStatus);

router.put("/like-unlike/:postId", checkAuthentication, likeUnlikePost);

// New route for searching posts
router.get("/search", checkAuthentication, searchPosts);

module.exports = router;

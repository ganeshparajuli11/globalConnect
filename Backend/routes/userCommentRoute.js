const express = require("express");
const router = express.Router();
const { checkAuthentication, bothUser, checkIsUser } = require("../middleware/middleware");
const { 
  getCommentsByPost, 
  addComment, 
  editComment, 
  deleteComment 
} = require("../controller/userCommentController");

// Route to add a comment to a post
router.post("/create", checkAuthentication, checkIsUser, addComment);

// Route to get all comments for a post
router.get("/all/:postId", checkAuthentication, bothUser, getCommentsByPost);

// Route to edit a comment (only the comment owner can edit)
router.put("/edit/:commentId", checkAuthentication, checkIsUser, editComment);

// Route to delete a comment (only post owner or comment owner can delete)
router.delete("/delete/:commentId", checkAuthentication, bothUser, deleteComment);

module.exports = router;

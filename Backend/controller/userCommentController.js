const Comment = require("../models/commentSchema");
const {Post } = require("../models/postSchema"); 


const User = require("../models/userSchema"); // Import User model

// Function to get all comments for a specific post (Admin only)
async function getCommentsByPost(req, res) {
  try {
    const { postId } = req.params;

    // Validate post existence
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Get all comments for the post
    const comments = await Comment.find({ postId })
      .populate("userId", "name email") // Include user details
      .populate("postId", "text_content") // Include post details
      .exec();

    res.status(200).json({
      message: "Comments retrieved successfully.",
      data: comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      message: "An error occurred while fetching comments.",
      error: error.message,
    });
  }
}

// Function to add a comment to a post
async function addComment(req, res) {
    try {
      const userId = req.user.id; // Get the authenticated user's ID
      const { postId, text } = req.body;
  
      // Validate post existence
      const postExists = await Post.findById(postId);
      if (!postExists) {
        return res.status(400).json({ message: "Invalid post ID." });
      }
  
      // Create the comment
      const comment = await Comment.create({
        userId,
        postId,
        text,
      });
  
      // Add comment reference to the post
      postExists.comments.push(comment._id);
      postExists.comments_count += 1; // Increment comments count
      await postExists.save();
  
      res.status(201).json({
        message: "Comment added successfully.",
        data: comment,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({
        message: "An error occurred while adding the comment.",
        error: error.message,
      });
    }
  }

module.exports = {
  addComment,
  getCommentsByPost,
};

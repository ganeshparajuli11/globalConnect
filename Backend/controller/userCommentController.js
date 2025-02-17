const Comment = require("../models/commentSchema");
const  Post = require("../models/postSchema");
const User = require("../models/userSchema");
const { sendCommentNotification } = require("./notificationController");

// Function to get all comments for a specific post (Admin only)
async function getCommentsByPost(req, res) {
  try {
    const { postId } = req.params;
    const currentUserId = req.user && req.user.id ? req.user.id : null;

    // Validate post existence
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Get all comments for the post
    let comments = await Comment.find({ postId })
      .populate("userId", "name email profile_image") // Include user details
      .populate("postId", "text_content") // Include post details
      .exec();

    // If a current user exists, move their comments to the top
    if (currentUserId) {
      const userComments = comments.filter(
        (c) => c.userId._id.toString() === currentUserId
      );
      const otherComments = comments.filter(
        (c) => c.userId._id.toString() !== currentUserId
      );
      comments = [...userComments, ...otherComments];
    }

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
    const userId = req.user.id;
    const { postId, text } = req.body;

    // Validate input fields
    if (!postId || !text) {
      return res.status(400).json({ message: "Post ID and text are required." });
    }

    // Validate post existence
    const postExists = await Post.findById(postId);
    if (!postExists) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Create the comment
    const comment = new Comment({
      userId,
      postId,
      text,
    });

    await comment.save(); // Save the comment

    // Add comment reference to the post and update comment count
    postExists.comments.push(comment._id);
    postExists.comments_count = (postExists.comments_count || 0) + 1; // Ensure count is initialized
    await postExists.save();

    // Send notification only if the commenter is not the post owner
    if (postExists.user_id && postExists.user_id.toString() !== userId.toString()) {
      await sendCommentNotification({
        commenterId: userId,
        postId,
        postOwnerId: postExists.user_id, // Corrected field
        commentText: text,
      });
    }

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
// Function to edit a comment (only the comment owner can edit)
async function editComment(req, res) {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;
    const { text } = req.body;

    // Fetch the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    // Ensure only the comment owner can edit
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ message: "You are not allowed to edit this comment." });
    }

    // Update the comment text and timestamp
    comment.text = text;
    comment.updatedAt = new Date();
    await comment.save();

    res.status(200).json({
      message: "Comment updated successfully.",
      data: comment,
    });
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json({
      message: "An error occurred while editing the comment.",
      error: error.message,
    });
  }
}

// Function to delete a comment (allowed for comment owner or post owner)
async function deleteComment(req, res) {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;

    // Fetch the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    // Fetch the associated post
    const post = await Post.findById(comment.postId);
    if (!post) {
      return res.status(404).json({ message: "Associated post not found." });
    }

    // Check permission: allow deletion if requester is comment owner or post owner
    if (
      comment.userId.toString() !== userId &&
      post.userId.toString() !== userId
    ) {
      return res.status(403).json({ message: "You are not allowed to delete this comment." });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // Remove the comment reference from the post and update count
    post.comments.pull(commentId);
    post.comments_count = post.comments.length;
    await post.save();

    res.status(200).json({ message: "Comment deleted successfully." });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      message: "An error occurred while deleting the comment.",
      error: error.message,
    });
  }
}

module.exports = {
  addComment,
  getCommentsByPost,
  editComment,
  deleteComment,
};

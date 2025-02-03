const { Post } = require("../models/postSchema"); 

const { comment } = require("../models/commentSchema");
const Category = require("../models/categorySchema"); 
const User = require("../models/userSchema");

// Function to create a post
async function createPost(req, res) {
  try {
    const user_id = req.user.id;
    const { category_id, text_content, tags, location, visibility, metadata } = req.body;

    // Validate category existence
    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    // Process uploaded images
    const media = req.files
      ? req.files.map((file) => ({
          media_path: `/uploads/posts/${file.filename}`,
          media_type: file.mimetype,
          description: "",
        }))
      : [];

    // Create and save the post
    const post = await Post.create({
      user_id,
      category_id,
      text_content,  // Now a simple string
      media,
      tags,
      location,
      visibility,
      metadata,
    });

    res.status(201).json({
      message: "Post created successfully.",
      data: post,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      message: "An error occurred while creating the post.",
      error: error.message,
    });
  }
}

const getAllPost = async (req, res) => {
  try {
    // Parse query parameters with default values
    let { page = 1, limit = 5, category = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Build query: if a category is specified, filter by it
    let query = {};
    if (category) {
      query.category_id = category;
    }

    // Retrieve posts with pagination and sorting (newest first)
    const posts = await Post.find(query)
      .populate("user_id", "name profilePic")
      .populate("category_id")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const formattedPosts = posts.map((post) => ({
      id: post._id,
      user: post.user_id ? post.user_id.name : "Unknown User", // Populated user name
      userImage: post.user_id?.profilePic || "https://via.placeholder.com/40", // Default if missing
      type: post.category_id ? post.category_id.name : "Unknown Category", // Populated category name
      time: post.createdAt ? post.createdAt.toDateString() : "Unknown Date",
      content: post.text_content || "No content provided", // Use text_content
      image: post.media.length > 0 ? post.media[0].media_path : "", // Use first media if available
      comments: post.comments || [],
      liked: false, // Modify later to reflect user likes if needed
    }));

    res.status(200).json({
      message: "Posts retrieved successfully.",
      data: formattedPosts,
    });
  } catch (error) {
    console.error("Error retrieving posts:", error);
    res.status(500).json({ message: "Failed to retrieve posts." });
  }
};

// Controller to like or unlike a post
const likeUnlikePost = async (req, res) => {
  try {
    // Extract user ID and post ID from request
    const { postId } = req.params; // Assuming postId is passed as a URL parameter
    const userId = req.user.id; // Assuming the user ID is set in req.user from authentication middleware

    // Find the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user has already liked the post
    if (post.likes.includes(userId)) {
      // If the user already liked it, remove the like (unlike the post)
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      // If the user hasn't liked it yet, add the like
      post.likes.push(userId);
    }

    // Save the updated post
    await post.save();

    // Respond with the updated post and the number of likes
    res.status(200).json({
      message: "Post liked/unliked successfully",
      likesCount: post.likes.length,
      likedByUser: post.likes.includes(userId),
    });
  } catch (error) {
    console.error("Error liking/unliking post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = { createPost, getAllPost };
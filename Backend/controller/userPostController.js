const { Post } = require("../models/postSchema"); // Import Post and Comment models


const { comment} = require("../models/commentSchema");
const Category = require("../models/categorySchema"); // Import the Category model
const userSchema = require("../models/userSchema");

// Function to create a post
async function createPost(req, res) {
  try {
    const user_id = req.user.id; // Authenticated user's ID
    const {
      category_id,
      text_content,
      media,
      tags,
      location,
      visibility,
      metadata,
    } = req.body;

    // Validate category existence
    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    // Create and save the post
    const post = await Post.create({
      user_id,
      category_id,
      text_content,
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



// get all posts with pagination
async function getAllPost(req, res) {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 5; // Default to 5 posts per page
    const skip = (page - 1) * limit; // Calculate how many posts to skip
    const categoryId = req.query.category; // Get category from query

    // Build the query object
    const query = categoryId ? { category_id: categoryId } : {};

    // Fetch posts with pagination and populated fields
    const posts = await Post.find(query)
      .populate("category_id", "name")
      .populate({
        path: "comments",
        populate: { path: "userId", select: "name profile_image" },
      })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalPosts = await Post.countDocuments(query); // Get total filtered post count

    // Add user details for each post
    const postsWithUserDetails = await Promise.all(
      posts.map(async (post) => {
        try {
          if (!post.user_id) {
            console.warn(`Post with ID ${post._id} has no user_id.`);
            return { ...post.toObject(), user: null };
          }
          const user = await userSchema.findById(post.user_id).select("name profile_image");

          return {
            ...post.toObject(),
            user: user || null,
          };
        } catch (error) {
          console.error("Error fetching user for post:", error);
          return { ...post.toObject(), user: null };
        }
      })
    );

    res.status(200).json({
      message: "Posts retrieved successfully.",
      data: postsWithUserDetails,
      total: totalPosts,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      message: "An error occurred while fetching posts.",
      error: error.message,
    });
  }
}







module.exports = { createPost, getAllPost };

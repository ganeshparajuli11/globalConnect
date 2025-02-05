const Post = require("../models/postSchema"); 

const { comment } = require("../models/commentSchema");
const Category = require("../models/categorySchema"); 
const User = require("../models/userSchema");


async function createPost(req, res) {
  try {
    const user_id = req.user.id;
    const { category_id, text_content, tags, location, visibility } = req.body;

    // Validate category existence
    const categoryExists = await Category.findById(category_id);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category ID." });
    }

    // Optionally, ensure that the post contains either text or media
    if (!text_content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ message: "Post must have text content or media." });
    }

    // Process uploaded media files (if any)
    const media = req.files
      ? req.files.map((file) => ({
          media_path: `/uploads/posts/${file.filename}`,
          media_type: file.mimetype,
          description: "", // Optionally, you can extend this to accept a description per media file
        }))
      : [];

    // Process tags: if tags are provided as a comma-separated string, convert them to an array.
    let postTags = tags;
    if (typeof tags === "string") {
      postTags = tags.split(",").map((tag) => tag.trim());
    }


    // Create and save the post (other fields like status, views, shares, etc. use default values from the schema)
    const post = await Post.create({
      user_id,
      category_id,
      text_content,
      media,
      tags: postTags,
      location,
    });

    return res.status(201).json({
      message: "Post created successfully.",
      data: post,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      message: "An error occurred while creating the post.",
      error: error.message,
    });
  }
}




const getAllPost = async (req, res) => {
  try {
    // Get pagination and category filter from query parameters
    let { page = 1, limit = 5, category = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Ensure the user is authenticated
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    // Fetch user details (only need preferred_categories and following)
    const user = await User.findById(userId).select("preferred_categories following");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Base query for active posts only
    let baseQuery = { status: "Active" };

    // If a specific category is requested, add that filter
    if (category) {
      baseQuery.category_id = category;

      const posts = await Post.find(baseQuery)
        .populate("user_id", "name profile_image") // Using updated field names
        .populate("category_id")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return res.status(200).json({
        message: "Posts retrieved successfully.",
        data: formatPosts(posts),
      });
    } else {
      // Build an interest-based query for posts in user's preferred categories or from followed users
      const interestQuery = {
        ...baseQuery,
        $or: [
          { category_id: { $in: user.preferred_categories } },
          { user_id: { $in: user.following } },
        ],
      };

      // Determine if the user is new (has no preferences and follows no one)
      const isNewUser = user.preferred_categories.length === 0 && user.following.length === 0;

      // If the user is not new, fetch a mix of interest-based and general posts
      if (!isNewUser) {
        // Calculate limits for interest-based and general posts
        const interestLimit = Math.ceil(limit * 0.7);
        const generalLimit = limit - interestLimit;

        // Fetch interest-based posts
        const interestBasedPosts = await Post.find(interestQuery)
          .populate("user_id", "name profile_image")
          .populate("category_id")
          .sort({ createdAt: -1 })
          .limit(interestLimit);

        // Fetch general posts
        const generalPosts = await Post.find(baseQuery)
          .populate("user_id", "name profile_image")
          .populate("category_id")
          .sort({ createdAt: -1 })
          .limit(generalLimit);

        // Combine the results and shuffle them to mix the order
        const combinedPosts = [...interestBasedPosts, ...generalPosts].sort(() => Math.random() - 0.5);

        return res.status(200).json({
          message: "Posts retrieved successfully.",
          data: formatPosts(combinedPosts),
        });
      }
    }

    // Fallback for new users or if no interest-based logic applies: simply fetch posts with pagination
    const posts = await Post.find(baseQuery)
      .populate("user_id", "name profile_image")
      .populate("category_id")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      message: "Posts retrieved successfully.",
      data: formatPosts(posts),
    });
  } catch (error) {
    console.error("Error retrieving posts:", error);
    return res.status(500).json({ message: "Failed to retrieve posts." });
  }
};


// Function to format posts
const formatPosts = (posts) => {
  return posts.map((post) => ({
    id: post._id,
    user: {
      _id: post.user_id ? post.user_id._id : null,
      name: post.user_id ? post.user_id.name : "Unknown User",  // Fallback value
      profile_image: post.user_id && post.user_id.profile_image ? post.user_id.profile_image : "https://via.placeholder.com/40",
    },
    type: post.category_id?.name || "Unknown Category",
    time: post.createdAt,
    content: post.text_content || "No content available",
    image: post.image || "",
    liked: post.likes.includes(post.user_id._id),  // Check if the user liked the post
    likeCount: post.likes.length || 0,
    commentCount: post.comments.length || 0,
    shareCount: post.shares?.length || 0,  // If shares are stored, include them
    comments: post.comments.map((comment) => ({
      user: comment.user_id.name,
      text: comment.text,
      time: comment.createdAt,
    })),
  }));
};





// Controller to like or unlike a post
const likeUnlikePost = async (req, res) => {
  try {

    const { postId } = req.params; 
    const userId = req.user.id; 

    // Find the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.likes.includes(userId)) {

      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {

      post.likes.push(userId);
    }


    await post.save();

    
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
module.exports = { createPost, getAllPost,likeUnlikePost };
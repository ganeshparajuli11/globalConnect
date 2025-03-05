const Post = require("../models/postSchema");

const { comment } = require("../models/commentSchema");
const Category = require("../models/categorySchema");
const User = require("../models/userSchema");
const fs = require('fs');
const path = require('path');

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
      return res
        .status(400)
        .json({ message: "Post must have text content or media." });
    }

    // Process uploaded media files (if any)
    const media = req.files
      ? req.files.map((file) => ({
          media_path: `/uploads/posts/${file.filename}`,
          media_type: file.mimetype,
          description: "", 
        }))
      : [];

    let postTags = tags;
    if (typeof tags === "string") {
      postTags = tags.split(",").map((tag) => tag.trim());
    }


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
    let { page = 1, limit = 5, category = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const user = await User.findById(userId).select("preferred_categories following");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const currentDate = new Date();
    // Base query: exclude blocked, under review posts, and ensure suspension (if any) has expired.
    // Also filter out posts that have 5 or more reports.
    let baseQuery = {
      isBlocked: false,
      isUnderReview: false,
      "reports.4": { $exists: false }, // if 5th report exists then skip this post
      $or: [
        { isSuspended: false },
        {
          isSuspended: true,
          $and: [
            { suspended_until: { $ne: null } },
            { suspended_until: { $lte: currentDate } },
          ],
        },
      ],
    };

    // Apply category filtering if provided (and not "All")
    if (category && category !== "All") {
      // If the category value contains a comma, assume multiple IDs are provided
      if (category.includes(",")) {
        const categoryArray = category.split(","); // e.g. "cat1,cat2,cat3"
        baseQuery.category_id = { $in: categoryArray };
      } else {
        baseQuery.category_id = category;
      }
    }

    // For queries with a category filter (i.e. user selected one or more categories other than "All")
    if (category && category !== "All") {
      let posts = await Post.find(baseQuery)
        .populate({
          path: "user_id",
          select: "name profile_image reported_count",
          match: { reported_count: { $lt: 4 } }, // filter out posts from users with reported_count >= 4
        })
        .populate("category_id")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      // Remove posts whose populated user is null (i.e. user reported_count was too high)
      posts = posts.filter(post => post.user_id);
      return res.status(200).json({
        message: "Posts retrieved successfully.",
        data: formatPosts(posts),
      });
    } else {
      // If no category filter is applied or "All" is selected,
      // then use your existing interest-based logic.
      const interestQuery = {
        ...baseQuery,
        $or: [
          { category_id: { $in: user.preferred_categories } },
          { user_id: { $in: user.following } },
        ],
      };

      const isNewUser = user.preferred_categories.length === 0 && user.following.length === 0;
      if (!isNewUser) {
        // Split the limit for interest-based and general posts
        const interestLimit = Math.ceil(limit * 0.7);
        const generalLimit = limit - interestLimit;

        let interestBasedPosts = await Post.find(interestQuery)
          .populate({
            path: "user_id",
            select: "name profile_image reported_count",
            match: { reported_count: { $lt: 4 } },
          })
          .populate("category_id")
          .sort({ createdAt: -1 })
          .skip((page - 1) * interestLimit)
          .limit(interestLimit);

        interestBasedPosts = interestBasedPosts.filter(post => post.user_id);

        const interestPostIds = interestBasedPosts.map(post => post._id);

        let generalPosts = await Post.find({
          ...baseQuery,
          _id: { $nin: interestPostIds }
        })
          .populate({
            path: "user_id",
            select: "name profile_image reported_count",
            match: { reported_count: { $lt: 4 } },
          })
          .populate("category_id")
          .sort({ createdAt: -1 })
          .skip((page - 1) * generalLimit)
          .limit(generalLimit);

        generalPosts = generalPosts.filter(post => post.user_id);

        // Combine and sort the two sets of posts
        const combinedPosts = [...interestBasedPosts, ...generalPosts];
        const uniquePosts = combinedPosts.filter((post, index, self) =>
          index === self.findIndex(p => p._id.toString() === post._id.toString())
        ).sort((a, b) => b.createdAt - a.createdAt);

        return res.status(200).json({
          message: "Posts retrieved successfully.",
          data: formatPosts(uniquePosts),
        });
      }

      // Fallback for new users: simply fetch posts with baseQuery.
      let posts = await Post.find(baseQuery)
        .populate({
          path: "user_id",
          select: "name profile_image reported_count",
          match: { reported_count: { $lt: 4 } },
        })
        .populate("category_id")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      posts = posts.filter(post => post.user_id);
      return res.status(200).json({
        message: "Posts retrieved successfully.",
        data: formatPosts(posts),
      });
    }
  } catch (error) {
    console.error("Error retrieving posts:", error);
    return res.status(500).json({ message: "Failed to retrieve posts." });
  }
};

// function to search for posts

const searchPosts = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required." });
    }

    // Optional pagination parameters
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Aggregation pipeline to join posts with users and match on text_content or user name.
    const posts = await Post.aggregate([
      {
        $lookup: {
          from: "users", // collection name in MongoDB (make sure it's correct)
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $match: {
          $or: [
            { text_content: { $regex: query, $options: "i" } },
            { "user.name": { $regex: query, $options: "i" } }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    // Format posts to match your existing structure
    const formattedPosts = posts.map((post) => ({
      id: post._id,
      user: {
        _id: post.user._id,
        name: post.user.name,
        profile_image: post.user.profile_image
          ? `http://${req.headers.host}/${post.user.profile_image}`
          : "https://via.placeholder.com/40"
      },
      type: post.category_id ? post.category_id.name : "Unknown Category",
      time: post.createdAt,
      content: post.text_content || "No content available",
      media:
        post.media && post.media.length > 0
          ? post.media.map((m) => `${m.media_path}`)
          : [],
      liked: post.likes && post.likes.includes(req.user.id),
      likeCount: post.likes ? post.likes.length : 0,
      commentCount: post.comments ? post.comments.length : 0,
      shareCount: post.shares ? post.shares.length : 0,
      comments: post.comments // Format further if needed
    }));

    return res.status(200).json({
      message: "Posts retrieved successfully.",
      data: formattedPosts
    });
  } catch (error) {
    console.error("Error searching posts:", error);
    return res.status(500).json({ message: "Search failed", error: error.message });
  }
};

// Function to format posts
const formatPosts = (posts) => {
  return posts.map((post) => ({
    id: post._id,
    user: {
      _id: post.user_id ? post.user_id._id : null,
      name: post.user_id ? post.user_id.name : "Unknown User",
      profile_image:
        post.user_id && post.user_id.profile_image
          ? `${post.user_id.profile_image}`
          : "https://via.placeholder.com/40",
    },
    type: post.category_id?.name || "Unknown Category",
    time: post.createdAt,
    content: post.text_content || "No content available",
    media:
      post.media && post.media.length > 0
        ? post.media.map((m) => `${m.media_path}`)
        : [],
    liked: post.likes && post.user_id ? post.likes.includes(post.user_id._id) : false,
    likeCount: post.likes ? post.likes.length : 0,
    commentCount: post.comments ? post.comments.length : 0,
    shareCount: post.shares ? post.shares.length : 0,
    comments: post.comments.map((comment) => ({
      user: comment.user_id ? comment.user_id.name : "Unknown",
      text: comment.text,
      time: comment.createdAt,
    })),
  }));
};


const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    // Fetch post with necessary details
    const post = await Post.findById(postId)
      .populate("user_id", "name profile_image")
      .populate("category_id");

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Format media array to match `getAllPost`
    const formattedMedia = post.media.map(media => media.media_path);

    // Construct response in the same structure as `getAllPost`
    const formattedPost = {
      id: post._id,
      user: {
        _id: post.user_id._id,
        name: post.user_id.name,
        profile_image: post.user_id.profile_image,
      },
      type: post.category_id.name,
      time: post.createdAt,
      content: post.text_content,
      media: formattedMedia,
      liked: post.likes.includes(req.user.id), // Check if the user liked it
      likeCount: post.likes.length,
      commentCount: post.comments.length,
      shareCount: post.shares,
      comments: post.comments, // You may need to format comments separately if needed
    };

    return res.status(200).json({
      message: "Post retrieved successfully.",
      data: formattedPost,
    });
  } catch (error) {
    console.error("Error retrieving post:", error);
    return res.status(500).json({ message: "Failed to retrieve post." });
  }
};


// post for admin
const getAllPostAdmin = async (req, res) => {
  try {
    // Extract pagination, category, and status filters from the query parameters.
    let { page = 1, limit = 5, category = "", status = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Build the query object
    const query = {};
    if (category) {
      query.category_id = category;
    }
    if (status) {
      query.status = status;
    }

    // Fetch posts with pagination.
    const posts = await Post.find(query)
      .populate("user_id", "name profile_image")
      .populate("category_id")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Get the total count of posts (for pagination).
    const totalCount = await Post.countDocuments(query);

    // Optionally format the posts if needed.
    const formattedPosts =
      typeof formatPosts === "function" ? formatPosts(posts) : posts;

    return res.status(200).json({
      message: "Posts retrieved successfully.",
      data: formattedPosts,
      totalCount,
    });
  } catch (error) {
    console.error("Error retrieving posts for admin:", error);
    return res.status(500).json({ message: "Failed to retrieve posts." });
  }
};

const getPostStatsAdmin = async (req, res) => {
  try {
    const total = await Post.countDocuments();
    const active = await Post.countDocuments({ status: "Active" });
    const suspended = await Post.countDocuments({ status: "Suspended" });
    const blocked = await Post.countDocuments({ status: "Blocked" });
    const underReview = await Post.countDocuments({ status: "Under Review" });
    const deleted = await Post.countDocuments({ status: "Deleted" });

    return res.status(200).json({
      total,
      active,
      suspended,
      blocked,
      underReview,
      deleted,
    });
  } catch (error) {
    console.error("Error retrieving post stats:", error);
    return res.status(500).json({ message: "Failed to retrieve post stats." });
  }
};

// Function to format posts


// Get posts that have been reported (i.e. at least one report exists)
const getReportedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const posts = await Post.find({ "reports.0": { $exists: true } })
      .populate("user_id", "name profile_image email")
      .populate("category_id", "name")
      .populate("reports.reported_by", "name profile_image")
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.status(200).json({
      message: "Reported posts retrieved successfully",
      data: posts,
    });
  } catch (error) {
    console.error("Error retrieving reported posts:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get posts with status "Suspended"
const getSuspendedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    // Here we filter on the status field (which is updated in our status updates)
    const posts = await Post.find({ status: "Suspended" })
      .populate("user_id", "name profile_image email")
      .populate("category_id", "name")
      .populate("moderation_history.admin", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.status(200).json({
      message: "Suspended posts retrieved successfully",
      data: posts,
    });
  } catch (error) {
    console.error("Error retrieving suspended posts:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Get posts with status "Blocked"
const getBlockedPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    // We filter on the status field for blocked posts.
    const posts = await Post.find({ status: "Blocked" })
      .populate("user_id", "name profile_image email")
      .populate("category_id", "name")
      .populate("moderation_history.admin", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    return res.status(200).json({
      message: "Blocked posts retrieved successfully",
      data: posts,
    });
  } catch (error) {
    console.error("Error retrieving blocked posts:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
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
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
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

const updatePostStatus = async (req, res) => {
  try {
    const { postId } = req.params;
    const { status, reason, suspended_from, suspended_until } = req.body;

    // Define allowed statuses.
    const allowedStatuses = [
      "Active",
      "Suspended",
      "Blocked",
      "Under Review",
      "Deleted",
    ];

    // Validate the provided status.
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    // For statuses that require a reason, enforce its presence.
    if (
      (status === "Suspended" ||
        status === "Blocked" ||
        status === "Under Review") &&
      !reason
    ) {
      return res
        .status(400)
        .json({ message: "A reason is required for the selected status." });
    }

    // Find the post by its ID.
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // If status is "Suspended", validate and update suspension dates.
    if (status === "Suspended") {
      if (!suspended_from || !suspended_until) {
        return res.status(400).json({
          message:
            "Both 'suspended_from' and 'suspended_until' dates are required for suspension.",
        });
      }
      const suspendedFromDate = new Date(suspended_from);
      const suspendedUntilDate = new Date(suspended_until);
      const now = new Date();

      if (suspendedFromDate < now || suspendedUntilDate < now) {
        return res
          .status(400)
          .json({ message: "Suspension dates must be in the future." });
      }

      post.suspended_from = suspendedFromDate;
      post.suspended_until = suspendedUntilDate;
      post.isSuspended = true;
    } else {
      // Clear suspension details if status is not "Suspended".
      post.suspended_from = null;
      post.suspended_until = null;
      post.isSuspended = false;
    }

    // Set additional boolean flags based on the status.
    post.isBlocked = status === "Blocked";
    post.isUnderReview = status === "Under Review";

    // Update the main status.
    post.status = status;

    // For statuses that require a reason, update the schema's reason field.
    // (Assuming the schema uses 'suspension_reason' as the field to store the reason.)
    if (["Suspended", "Blocked", "Under Review"].includes(status)) {
      post.suspension_reason = reason;
    } else {
      post.suspension_reason = "";
    }

    // Save the updated post.
    await post.save();

    return res.status(200).json({
      message: "Post status updated successfully.",
      data: post,
    });
  } catch (error) {
    console.error("Error updating post status:", error);
    return res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

/**
 * Controller: Edit an existing post
 */
const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const { category_id, text_content, removed_media } = req.body;

    // Find the post and verify ownership
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Verify post ownership
    if (post.user_id.toString() !== userId) {
      return res.status(403).json({ message: "You can only edit your own posts." });
    }

    // Validate category if provided
    if (category_id) {
      const categoryExists = await Category.findById(category_id);
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category ID." });
      }
      post.category_id = category_id;
    }

    // Update text content if provided
    if (text_content !== undefined) {
      post.text_content = text_content;
    }

    // Handle media removal if specified
    if (removed_media) {
      const removedMediaIds = JSON.parse(removed_media);
      if (Array.isArray(removedMediaIds) && removedMediaIds.length > 0) {
        // Filter out the media that should be removed
        const remainingMedia = post.media.filter(media => {
          const shouldRemove = removedMediaIds.includes(media._id.toString());
          if (shouldRemove) {
            // Delete the file from the server
            try {
              const filePath = path.join(__dirname, '..', 'public', media.media_path);
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
              }
            } catch (err) {
              console.error(`Error deleting file: ${err.message}`);
            }
          }
          return !shouldRemove;
        });
        post.media = remainingMedia;
      }
    }

    // Handle new media files
    if (req.files && req.files.length > 0) {
      // Process new media files
      const newMedia = req.files.map(file => ({
        media_path: `/uploads/posts/${file.filename}`,
        media_type: file.mimetype,
        description: ""
      }));

      // Combine with remaining media
      post.media = [...post.media, ...newMedia];
    }

    // Update timestamp
    post.updatedAt = new Date();

    // Save the updated post
    await post.save();

    // Return the updated post with populated fields
    const updatedPost = await Post.findById(postId)
      .populate("user_id", "name profile_image")
      .populate("category_id");

    return res.status(200).json({
      message: "Post updated successfully.",
      data: formatPosts([updatedPost])[0]
    });

  } catch (error) {
    console.error("Error updating post:", error);
    return res.status(500).json({
      message: "An error occurred while updating the post.",
      error: error.message
    });
  }
};

/**
 * Controller: Delete a post by ID (only by post owner)
 */
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Find the post
    const post = await Post.findById(postId);
    
    // Check if post exists
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: "Post not found." 
      });
    }

    // Verify post ownership
    if (post.user_id.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: "You can only delete your own posts." 
      });
    }

    // Delete the post
    await Post.findByIdAndDelete(postId);

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully."
    });

  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the post.",
      error: error.message
    });
  }
};

module.exports = {
  createPost,
  getAllPost,
  likeUnlikePost,
  getPostById,
  updatePostStatus,
  getBlockedPosts,
  getSuspendedPosts,
  getReportedPosts,
  getAllPostAdmin,
  getPostStatsAdmin,
  searchPosts,
  editPost,
  deletePost
};

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
      return res
        .status(400)
        .json({ message: "Post must have text content or media." });
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

    // Base query to exclude blocked/under-review/suspended posts
    const currentDate = new Date();
    let baseQuery = {
      isBlocked: false,
      isUnderReview: false,
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

    // If a specific category is requested, simply filter and use pagination
    if (category) {
      baseQuery.category_id = category;

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
    } else {
      // Build interest-based query for preferred categories or followed users
      const interestQuery = {
        ...baseQuery,
        $or: [
          { category_id: { $in: user.preferred_categories } },
          { user_id: { $in: user.following } },
        ],
      };

      // Determine if the user is new (no preferences/following)
      const isNewUser = user.preferred_categories.length === 0 && user.following.length === 0;

      if (!isNewUser) {
        // Split limit: 70% interest-based, 30% general
        const interestLimit = Math.ceil(limit * 0.7);
        const generalLimit = limit - interestLimit;

        // Use pagination for both parts:
        const interestBasedPosts = await Post.find(interestQuery)
          .populate("user_id", "name profile_image")
          .populate("category_id")
          .sort({ createdAt: -1 })
          .skip((page - 1) * interestLimit)
          .limit(interestLimit);

        // Exclude any posts already returned by interest-based query.
        const interestPostIds = interestBasedPosts.map(post => post._id);

        // For general posts, exclude posts already fetched in interest-based query.
        const generalPosts = await Post.find({
          ...baseQuery,
          _id: { $nin: interestPostIds }
        })
          .populate("user_id", "name profile_image")
          .populate("category_id")
          .sort({ createdAt: -1 })
          .skip((page - 1) * generalLimit)
          .limit(generalLimit);

        // Combine the results
        const combinedPosts = [...interestBasedPosts, ...generalPosts];

        // Remove duplicates (if any) based on post._id
        const uniquePosts = combinedPosts.filter((post, index, self) =>
          index === self.findIndex(p => p._id.toString() === post._id.toString())
        ).sort((a, b) => b.createdAt - a.createdAt);

        return res.status(200).json({
          message: "Posts retrieved successfully.",
          data: formatPosts(uniquePosts),
        });
      }
    }

    // Fallback for new users: fetch general posts with pagination
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

module.exports = { updatePostStatus };

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
};

const Post = require("../models/postSchema");
const mongoose = require("mongoose");
const { comment } = require("../models/commentSchema");
const Category = require("../models/categorySchema");
const User = require("../models/userSchema");
const fs = require('fs');
const path = require('path');
const nodemailer = require("nodemailer");
const { sendLikeNotification } = require("./notificationController");

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

const getDestinationPosts = async (req, res) => {
  try {
    // Master toggle controlled by admin. Set in your environment variables.
    const adminToggle = process.env.ADMIN_FILTER_TOGGLE === "true"; 

    const currentUserId = req.user.id;
    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    // Fetch the current user's destination and setting
    const user = await User.findById(currentUserId).select("destination_country showGlobalContent blocked_users liked_posts");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Pagination and filter parameters from query
    let { page = 1, limit = 5, category = "", search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const currentDate = new Date();

    // Build the aggregation pipeline; similar to getAllPost
    const pipeline = [
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' },
      {
        $match: {
          status: 'Active',
          isBlocked: false,
          isUnderReview: false,
          "reports.4": { $exists: false },
          $or: [
            { isSuspended: false },
            { isSuspended: true, suspended_until: { $lt: currentDate } }
          ],
          'author.is_blocked': false,
          'author.is_deactivate': false,
          'author.is_deleted': false,
          $or: [
            { 'author.is_suspended': false },
            { 'author.is_suspended': true, 'author.suspended_until': { $lt: currentDate } }
          ],
          // Exclude posts authored by users this user has blocked:
          'author._id': { $nin: user.blocked_users },
          // Exclude posts if the current user has reported them
          reports: { $not: { $elemMatch: { reported_by: mongoose.Types.ObjectId(currentUserId) } } }
        }
      }
    ];

    // If admin master toggle is ON and user setting is false then filter by destination
    if (adminToggle && !user.showGlobalContent && user.destination_country) {
      pipeline.push({
        $match: {
          // assuming that the author's destination is stored in their "destination_country" field
          "author.destination_country": user.destination_country
        }
      });
    }
    
    // Apply additional category and search filters if provided
    if (category || search) {
      const additionalMatch = {};
      if (category && category !== "All") {
        const catArray = category.split(",").map(c => new mongoose.Types.ObjectId(c.trim()));
        additionalMatch.category_id = catArray.length > 1 ? { $in: catArray } : catArray[0];
      }
      if (search && search.trim() !== "") {
        additionalMatch.$or = [
          { text_content: { $regex: search, $options: "i" } },
          { "author.name": { $regex: search, $options: "i" } }
        ];
      }
      pipeline.push({ $match: additionalMatch });
    }

    // Sorting and pagination
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    );

    const posts = await Post.aggregate(pipeline);

    // Populate category and comments if needed
    await Post.populate(posts, [
      { path: "category_id", select: "name" },
      { path: "comments", select: "text user_id createdAt" }
    ]);

    // Format posts to include whether the post is liked by the current user
    const formattedPosts = posts.map(post => ({
      id: post._id,
      user: {
        id: post.author._id,
        name: post.author.name,
        profile_image: post.author.profile_image || "https://via.placeholder.com/40",
        verified: post.author.verified
      },
      type: post.category_id?.name || "Unknown Category",
      time: post.createdAt,
      content: post.text_content || "No content available",
      media: post.media?.map(m => m.media_path) || [],
      liked: (user.liked_posts || []).some(likedId => likedId.toString() === post._id.toString()),
      likeCount: post.likes?.length || 0,
      commentCount: post.comments?.length || 0,
      shareCount: post.shares || 0
    }));

    return res.status(200).json({
      message: "Posts retrieved successfully.",
      data: formattedPosts,
      pagination: { page, limit, total: formattedPosts.length }
    });
  } catch (error) {
    console.error("Error fetching destination posts:", error);
    return res.status(500).json({ message: "Failed to retrieve posts." });
  }
};

// controller to set the is_destinationPost flag
const toggleDestinationPost = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Toggle the is_destinationPost flag
    user.is_destinationPost = !user.is_destinationPost;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Destination post mode ${user.is_destinationPost ? 'enabled' : 'disabled'} successfully`,
      is_destinationPost: user.is_destinationPost
    });

  } catch (error) {
    console.error("Error toggling destination post:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle destination post mode",
      error: error.message
    });
  }
};

// Add this new controller function
const getDestinationPostState = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the user and select only the is_destinationPost field
    const user = await User.findById(userId).select('is_destinationPost');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      is_destinationPost: user.is_destinationPost
    });

  } catch (error) {
    console.error("Error fetching destination post state:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch destination post state",
      error: error.message
    });
  }
};

// Get all posts based on query/interest/search logic
const getAllPost = async (req, res) => {
  try {
    let { page = 1, limit = 5, category = "", search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    // Retrieve the current user with fields required for filtering
    const user = await User.findById(userId).select(
      "preferred_categories following liked_posts blocked_users destination_country current_location is_destinationPost"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const currentDate = new Date();

    // Start building the aggregation pipeline
    const pipeline = [
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "author",
        },
      },
      { $unwind: "$author" },
      {
        $match: {
          status: "Active",
          isBlocked: false,
          isUnderReview: false,
          "reports.4": { $exists: false },
          $or: [
            { isSuspended: false },
            { isSuspended: true, suspended_until: { $lt: currentDate } },
          ],
          "author.is_blocked": false,
          "author.is_deactivate": false,
          "author.is_deleted": false,
          $or: [
            { "author.is_suspended": false },
            { "author.is_suspended": true, "author.suspended_until": { $lt: currentDate } },
          ],
          // Exclude posts from authors that this user has blocked
          "author._id": { $nin: user.blocked_users },
          // Exclude posts that the user has reported
          reports: {
            $not: { $elemMatch: { reported_by: new mongoose.Types.ObjectId(userId) } },
          },
        },
      },
    ];

    // If destination mode is enabled, filter posts by the user's destination_country.
    if (user.is_destinationPost === true) {
      if (!user.destination_country) {
        return res.status(400).json({ message: "Please set your destination country first" });
      }
      pipeline.push({
        $match: {
          $and: [
            { "author.destination_country": user.destination_country },
            { "author.destination_country": { $exists: true, $ne: null, $ne: "" } },
          ],
        },
      });
      console.log("Filtering posts for destination:", user.destination_country);
    }

    // Add search filter if a search query is provided
    if (search && search.trim() !== "") {
      pipeline.push({
        $match: {
          $or: [
            { text_content: { $regex: search, $options: "i" } },
            { "author.name": { $regex: search, $options: "i" } },
            { tags: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Apply category filter if provided and not set to "All"
    if (category && category !== "All") {
      const catArray = category.split(",").map((c) => new mongoose.Types.ObjectId(c.trim()));
      pipeline.push({
        $match: {
          category_id: catArray.length > 1 ? { $in: catArray } : catArray[0],
        },
      });
    }

    // Apply sorting (default: descending by creation date) and pagination
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    );

    const posts = await Post.aggregate(pipeline);
    console.log("Found posts count:", posts.length);

    // Populate the category and comments fields after aggregation
    await Post.populate(posts, [
      { path: "category_id", select: "name" },
      { path: "comments", select: "text user_id createdAt" }
    ]);

    // Format the posts response
    const formattedPosts = posts.map((post) => ({
      id: post._id,
      user: {
        id: post.author._id,
        name: post.author.name,
        profile_image: post.author.profile_image || "https://via.placeholder.com/40",
        verified: post.author.verified,
        destination: post.author.destination_country || null,
        flag: post.author.flag || null,
        city: (post.author.current_location && post.author.current_location.city) || null,
      },
      type: post.category_id?.name || "Unknown Category",
      time: post.createdAt,
      content: post.text_content || "No content available",
      media: post.media?.map((m) => m.media_path) || [],
      liked: (user.liked_posts || []).some(
        (likedId) => likedId.toString() === post._id.toString()
      ),
      likeCount: post.likes?.length || 0,
      commentCount: post.comments?.length || 0,
      shareCount: post.shares || 0,
    }));

    return res.status(200).json({
      message: "Posts retrieved successfully.",
      data: formattedPosts,
      destination: {
        country: user.destination_country,
        city: user.current_location?.city || null,
      },
    });
  } catch (error) {
    console.error("Error retrieving posts:", error);
    return res.status(500).json({ message: "Failed to retrieve posts." });
  }
};




// function to search for posts
const formatPosts = (posts, user, req) => {
  return posts.map(post => ({
    id: post._id,
    user: {
      id: post.user_id ? post.user_id._id : post.author._id,
      name: post.user_id ? post.user_id.name : post.author.name,
      profile_image: post.user_id ? post.user_id.profile_image || "https://via.placeholder.com/40" : post.author.profile_image || "https://via.placeholder.com/40",
      verified: post.user_id ? post.user_id.verified : post.author.verified
    },
    type: post.category_id?.name || "Unknown Category",
    time: post.createdAt,
    content: post.text_content || "No content available",
    media: post.media?.map(m => m.media_path) || [],
    liked: (user?.liked_posts || []).some(likedId => likedId.toString() === post._id.toString()),
    likeCount: post.likes?.length || 0,
    commentCount: post.comments?.length || 0,
    shareCount: post.shares || 0
  }));
};



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

// get all liked user
const getLikedUsers = async (req, res) => {
  try {
    const { postId } = req.params;

    // Find the post and populate the likes field with user details
    const post = await Post.findById(postId)
      .populate('likes', 'name profile_image')
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Format the response to include only necessary user details
    const likedUsers = post.likes.map(user => ({
      _id: user._id,
      name: user.name,
      profile_image: user.profile_image || "https://via.placeholder.com/40"
    }));

    return res.status(200).json({
      success: true,
      message: "Liked users retrieved successfully",
      data: likedUsers
    });

  } catch (error) {
    console.error("Error fetching liked users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch liked users",
      error: error.message
    });
  }
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

    // Format media array to include each media item's id and url
    const formattedMedia = post.media.map(media => ({
      id: media._id,
      url: media.media_path
    }));

    // Construct response including additional fields from postSchema.js
    const formattedPost = {
      id: post._id,
      user: {
        id: post.user_id._id,
        name: post.user_id.name,
        profile_image: post.user_id.profile_image,
      },
      category: {
        id: post.category_id._id,
        name: post.category_id.name,
      },
      time: post.createdAt,
      content: post.text_content,
      media: formattedMedia,
      liked: post.likes.includes(req.user.id), // Check if the user liked it
      likeCount: post.likes.length,
      commentCount: post.comments.length,
      shareCount: post.shares,
      comments: post.comments,
      // Additional postSchema fields
      status: post.status,
      isSuspended: post.isSuspended,
      suspended_from: post.suspended_from,
      suspended_until: post.suspended_until,
      suspension_reason: post.suspension_reason,
      isBlocked: post.isBlocked,
      is_deleted: post.is_deleted,
      deletedAt: post.deletedAt,
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



const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
});

// Helper function to send email
const sendEmail = (to, subject, text, html = "") => {
  const mailOptions = {
    from: process.env.EMAIL, // e.g., '"globalConnect" <no-reply@globalconnect.com>'
    to,
    subject,
    text
  };
  if (html) {
    mailOptions.html = html;
  }
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

const handlePostAdminAction = async (req, res) => {
  try {
    const { postId, action, resetReports, reason } = req.body;
    if (!postId || !action) {
      return res.status(400).json({ message: "postId and action are required." });
    }

    // For actions other than "delete", get the post first.
    const post = await Post.findById(postId).populate("user_id", "email name");
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    let emailSubject = "";
    let emailText = "";
    const defaultReason = "Violation of our policies";
    const finalReason = reason || defaultReason;

    switch (action) {
      case "resetReports":
        // Reset reports: clear the reports array.
        post.reports = [];
        await post.save();
        emailSubject = "Your post's report count has been reset";
        emailText = `Hello ${post.user_id.name},\n\nYour post's report count has been reset after review.\n\nRegards,\nAdmin Team`;
        break;

      case "suspend": {
        const { suspended_from, suspended_until } = req.body;
        if (!suspended_from || !suspended_until) {
          return res.status(400).json({ message: "suspended_from and suspended_until are required for suspension." });
        }
        post.status = "Suspended";
        post.suspended_from = new Date(suspended_from);
        post.suspended_until = new Date(suspended_until);
        post.isSuspended = true;
        // Optionally, you can store the finalReason in a suspension_reason field:
        post.suspension_reason = finalReason;
        await post.save();
        emailSubject = "Your post has been suspended";
        emailText = `Hello ${post.user_id.name},\n\nYour post has been suspended for the following reason:\n\n"${finalReason}"\n\nSuspension period: ${suspended_from} to ${suspended_until}.\n\nRegards,\nAdmin Team`;
        break;
      }

      case "unsuspend":
        if (post.status !== "Suspended") {
          return res.status(400).json({ message: "Post is not suspended." });
        }
        // Reinstate the post
        post.status = "Active";
        post.isSuspended = false;
        post.suspended_from = null;
        post.suspended_until = null;
        post.suspension_reason = "";
        await post.save();
        emailSubject = "Your post has been reinstated";
        // Use finalReason if provided or default to a generic message
        emailText = `Hello ${post.user_id.name},\n\nYour post has been unsuspended.${reason ? "\nReason: " + finalReason + "." : ""}\n\nRegards,\nAdmin Team`;
        break;

      case "block":
        post.status = "Blocked";
        post.isBlocked = true;
        await post.save();
        emailSubject = "Your post has been blocked";
        emailText = `Hello ${post.user_id.name},\n\nYour post has been blocked.\nReason: ${finalReason}.\n\nRegards,\nAdmin Team`;
        break;

      case "unblock":
        if (post.status !== "Blocked") {
          return res.status(400).json({ message: "Post is not blocked." });
        }
        // Unblock the post by marking it as active
        post.status = "Active";
        post.isBlocked = false;
        await post.save();
        emailSubject = "Your post has been unblocked";
        emailText = `Hello ${post.user_id.name},\n\nYour post has been unblocked.\nReason: ${finalReason}.\n\nRegards,\nAdmin Team`;
        break;

      case "delete":
        // For deletion, we remove the post entirely.
        await Post.findByIdAndDelete(postId);
        emailSubject = "Your post has been deleted";
        emailText = `Hello ${post.user_id.name},\n\nYour post has been deleted.\nReason: ${finalReason}.\n\nRegards,\nAdmin Team`;
        break;

      default:
        return res.status(400).json({ message: "Invalid action." });
    }

    // Send email notification to post owner.
    sendEmail(post.user_id.email, emailSubject, emailText);

    return res.status(200).json({
      message: `Post ${action} action completed successfully.`
    });
  } catch (error) {
    console.error("Error handling admin post action:", error);
    return res.status(500).json({
      message: "Failed to perform admin post action.",
      error: error.message
    });
  }
};

// post for admin
const getAllPostAdmin = async (req, res) => {
  try {
    // Extract all query parameters
    let {
      page = 1,
      limit = 5,
      status = "",
      search = "",
      type = "all",
      sort = "newest",
      from = "",
      to = ""
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // Build the query object
    const query = {};

    // Status filter
    if (status) {
      query.status = status;
    }

    // Type filter
    if (type !== "all") {
      if (type === "text") {
        query["media.0"] = { $exists: false };
      } else if (type === "image" || type === "video") {
        query["media.media_type"] = { $regex: new RegExp(type, "i") };
      }
    }

    // Date range filter
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to + "T23:59:59.999Z");
    }

    // Search functionality
    if (search) {
      query.$or = [
        { text_content: { $regex: search, $options: "i" } },
        { "user_id.name": { $regex: search, $options: "i" } }
      ];
    }

    // Determine sort order
    let sortOption = {};
    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "mostReported":
        sortOption = { reported_count: -1, createdAt: -1 };
        break;
      case "mostLiked":
        sortOption = { "likes.length": -1, createdAt: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
        break;
    }

    // Fetch posts with all applied filters
    const posts = await Post.find(query)
      .populate("user_id", "name profile_image email")
      .populate("category_id", "name")
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await Post.countDocuments(query);

    // Format the response with additional fields from postSchema.js
    const formattedPosts = posts.map(post => ({
      _id: post._id,
      id: post._id,
      user: {
        _id: post.user_id?._id,
        name: post.user_id?.name || "Unknown User",
        profile_image: post.user_id?.profile_image || null,
        email: post.user_id?.email || ""
      },
      type: post.category_id?.name || "Uncategorized",
      status: post.status || "Active",
      createdAt: post.createdAt,
      content: post.text_content,
      media: post.media,
      reports: post.reports,
      // For reported count, you could use the length of the reports array.
      reported_count: post.reports?.length || 0,
      likes: post.likes?.length || 0,
      isSuspended: post.isSuspended,
      suspended_from: post.suspended_from,
      suspended_until: post.suspended_until,
      suspension_reason: post.suspension_reason,
      isBlocked: post.isBlocked,
      is_deleted: post.is_deleted,
      deletedAt: post.deletedAt
    }));

    return res.status(200).json({
      message: "Posts retrieved successfully.",
      data: formattedPosts,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error("Error retrieving posts for admin:", error);
    return res.status(500).json({
      message: "Failed to retrieve posts.",
      error: error.message
    });
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




// Get posts that have been reported (i.e. at least one report exists)
const getReportedPostsAdmin = async (req, res) => {
  try {
    // Extract query parameters with defaults.
    let {
      page = 1,
      limit = 10,
      search = "",
      sort = "mostReported",
      from = "",
      to = "",
      status = ""
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    // Build base match stage: ensure at least one report exists.
    const matchStage = { "reports.0": { $exists: true } };
    if (status) {
      matchStage.status = status;
    }
    if (from || to) {
      matchStage.createdAt = {};
      if (from) matchStage.createdAt.$gte = new Date(from);
      if (to) matchStage.createdAt.$lte = new Date(to + "T23:59:59.999Z");
    }
    // If a search term is provided, match on text_content.
    if (search) {
      matchStage.text_content = { $regex: search, $options: "i" };
    }

    // Build the aggregation pipeline.
    const pipeline = [
      { $match: matchStage },
      // Lookup and unwind the post's author details.
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      // Optionally, if a search term exists, match on the author's name too.
      ...(search ? [{
        $match: {
          $or: [
            { "user.name": { $regex: search, $options: "i" } },
            { text_content: { $regex: search, $options: "i" } }
          ]
        }
      }] : []),
      // Unwind the reports array to join details for each report.
      { $unwind: { path: "$reports", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "reports.reported_by",
          foreignField: "_id",
          as: "reporter"
        }
      },
      { $unwind: { path: "$reporter", preserveNullAndEmptyArrays: true } },
      // Replace the reported_by field with the reporter's details.
      {
        $addFields: {
          "reports.reported_by": {
            _id: "$reporter._id",
            name: "$reporter.name",
            profile_image: "$reporter.profile_image"
          }
        }
      },
      // Group back the post with a reports array.
      {
        $group: {
          _id: "$_id",
          text_content: { $first: "$text_content" },
          media: { $first: "$media" },
          status: { $first: "$status" },
          createdAt: { $first: "$createdAt" },
          user: { $first: "$user" },
          reports: { $push: "$reports" }
        }
      },
      // Add computed field "reportCount".
      { $addFields: { reportCount: { $size: "$reports" } } },
      // Sort by reportCount descending (for "mostReported") or by newest.
      {
        $sort: sort === "mostReported"
          ? { reportCount: -1, createdAt: -1 }
          : { createdAt: -1 }
      },
      // Implement pagination.
      { $skip: (page - 1) * limit },
      { $limit: limit },
      // Project only the necessary fields.
      {
        $project: {
          _id: 1,
          text_content: 1,
          media: 1,
          status: 1,
          createdAt: 1,
          reportCount: 1,
          reports: 1,
          "user._id": 1,
          "user.name": 1,
          "user.profile_image": 1
        }
      }
    ];

    const posts = await Post.aggregate(pipeline);

    // Calculate total count using a similar match (ignoring pagination).
    const totalCount = await Post.countDocuments({
      "reports.0": { $exists: true },
      ...(status && { status })
    });

    return res.status(200).json({
      message: "Reported posts retrieved successfully.",
      data: posts,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error("Error fetching reported posts:", error);
    return res.status(500).json({
      message: "Failed to retrieve reported posts.",
      error: error.message
    });
  }
};


const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'Resolved', 'Blocked'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: Pending, Resolved, Blocked"
      });
    }

    // Update report status
    const report = await ReportPost.findByIdAndUpdate(
      reportId,
      {
        status,
        resolvedAt: status === 'Resolved' ? new Date() : undefined,
        resolvedBy: status === 'Resolved' ? req.user.id : undefined
      },
      { new: true }
    ).populate('post');

    if (!report) {
      return res.status(404).json({
        message: "Report not found"
      });
    }

    // If status is 'Blocked', also update the post status
    if (status === 'Blocked' && report.post) {
      await Post.findByIdAndUpdate(report.post._id, {
        status: 'Blocked',
        isBlocked: true
      });
    }

    return res.status(200).json({
      message: "Report status updated successfully",
      data: report
    });

  } catch (error) {
    console.error('Error updating report status:', error);
    return res.status(500).json({
      message: "Failed to update report status",
      error: error.message
    });
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

    // Find the user document
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let liked = false;
    if (post.likes.includes(userId)) {
      // Unlike scenario
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
      user.liked_posts = user.liked_posts.filter(
        (id) => id.toString() !== postId.toString()
      );
      liked = false;
      user.likes_given = Math.max((user.likes_given || 0) - 1, 0);

      // Update post owner's likes_received if needed.
      const postOwner = await User.findById(post.user_id);
      if (postOwner) {
        postOwner.likes_received = Math.max(
          (postOwner.likes_received || 0) - 1,
          0
        );
        await postOwner.save();
      }
    } else {
      // Like scenario
      post.likes.push(userId);
      if (!user.liked_posts.includes(postId)) {
        user.liked_posts.push(postId);
      }
      liked = true;
      user.likes_given = (user.likes_given || 0) + 1;

      // Update post owner's likes_received.
      const postOwner = await User.findById(post.user_id);
      if (postOwner) {
        postOwner.likes_received = (postOwner.likes_received || 0) + 1;
        await postOwner.save();

        // Send like notification if the liker is not the post owner
        if (post.user_id.toString() !== userId.toString()) {

          await sendLikeNotification({
            likerId: userId,
            postId,
            postOwnerId: post.user_id,
          });
        }
      }
    }

    // Save changes to post and user documents.
    await post.save();
    await user.save();

    // Update preferred categories based on liked posts.
    const likedPostIds = user.liked_posts;
    const likedPosts = await Post.find({ _id: { $in: likedPostIds } });
    const categoryCount = {};
    likedPosts.forEach((p) => {
      if (p.category_id) {
        const catId = p.category_id.toString();
        categoryCount[catId] = (categoryCount[catId] || 0) + 1;
      }
    });
    const threshold = 7;
    for (const [catId, count] of Object.entries(categoryCount)) {
      if (
        count >= threshold &&
        !user.preferred_categories.map(String).includes(catId)
      ) {
        user.preferred_categories.push(catId);
      }
    }
    await user.save();

    return res.status(200).json({
      message: "Post liked/unliked successfully",
      likesCount: post.likes.length,
      likedByUser: liked,
    });
  } catch (error) {
    console.error("Error liking/unliking post:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};



const updatePostStatus = async (req, res) => {
  try {
    const { postId, action, resetReports, reason } = req.body;
    if (!postId || !action) {
      return res.status(400).json({ message: "postId and action are required." });
    }

    // Fetch the post for every action
    const post = await Post.findById(postId).populate("user_id", "email name");
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    let emailSubject = "";
    let emailText = "";
    const actionReason = reason ? reason : "Violation of our policies";

    switch (action) {
      case "resetReports":
        // Reset reports: clear the reports array.
        post.reports = [];
        await post.save();
        emailSubject = "Your post's report count has been reset";
        emailText = `Your post's report count has been reset. Reason: ${actionReason}.`;
        break;

      case "suspend": {
        const { suspended_from, suspended_until } = req.body;
        if (!reason || !suspended_from || !suspended_until) {
          return res.status(400).json({ message: "A reason, suspended_from, and suspended_until are required for suspension." });
        }
        post.status = "Suspended";
        post.suspended_from = new Date(suspended_from);
        post.suspended_until = new Date(suspended_until);
        post.isSuspended = true;
        await post.save();
        emailSubject = "Your post has been suspended";
        emailText = `Your post has been suspended.\nReason: ${actionReason}.\nSuspension period: ${suspended_from} to ${suspended_until}.`;
        break;
      }

      case "unsuspend":
        if (post.status !== "Suspended") {
          return res.status(400).json({ message: "Post is not suspended." });
        }
        post.status = "Active";
        post.isSuspended = false;
        post.suspended_from = null;
        post.suspended_until = null;
        post.suspension_reason = "";
        await post.save();
        emailSubject = "Your post has been reinstated";
        emailText = `Your post has been unsuspended.\nReason: ${actionReason}.`;
        break;

      case "block":
        post.status = "Blocked";
        post.isBlocked = true;
        await post.save();
        emailSubject = "Your post has been blocked";
        emailText = `Your post has been blocked.\nReason: ${actionReason}.`;
        break;

      case "unblock":
        if (post.status !== "Blocked") {
          return res.status(400).json({ message: "Post is not blocked." });
        }
        post.status = "Active";
        post.isBlocked = false;
        await post.save();
        emailSubject = "Your post has been unblocked";
        emailText = `Your post has been unblocked.\nReason: ${actionReason}.`;
        break;

      case "activate":
        // Reset the post to active state.
        post.status = "Active";
        post.isBlocked = false;
        post.isSuspended = false;
        post.suspended_from = null;
        post.suspended_until = null;
        post.suspension_reason = "";
        post.reports = [];
        await post.save();
        emailSubject = "Your post has been reactivated";
        emailText = `Your post has been reactivated and all issues have been cleared.`;
        break;

      case "delete":
        post.is_deleted = true;
        post.deletedAt = new Date();
        post.status = "Deleted";
        await post.save();
        emailSubject = "Your post has been deleted";
        emailText = `Your post has been deleted.\nReason: ${actionReason}.`;
        break;

      case "permanentDelete":
        await Post.findByIdAndDelete(postId);
        emailSubject = "Your post has been permanently deleted";
        emailText = `Your post has been permanently deleted.\nReason: ${actionReason}.`;
        break;

      default:
        return res.status(400).json({ message: "Invalid action." });
    }

    // Create a beautiful HTML email similar to the one in userSelfController.js.
    const emailHtml = `
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${emailSubject}</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f4f4f4;">
        <div style="max-width:600px; margin:20px auto; background-color:#fff; padding:20px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="text-align:center; color:#4F46E5;">globalConnect</h2>
          <p style="font-size:16px; color:#333;">Hello ${post.user_id.name},</p>
          ${emailText.split('\n').map(line => `<p style="font-size:16px; color:#333;">${line.trim()}</p>`).join('')}
          <p style="margin-top:20px; font-size:16px; color:#333;">Regards,<br/>Admin Team</p>
        </div>
      </body>
      </html>
    `;

    // Send email notification to post owner using both text and HTML.
    sendEmail(post.user_id.email, emailSubject, emailText, emailHtml);

    return res.status(200).json({
      message: `Post ${action} action completed successfully.`
    });
  } catch (error) {
    console.error("Error handling admin post action:", error);
    return res.status(500).json({
      message: "Failed to perform admin post action.",
      error: error.message
    });
  }
};


const editPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;
    const { category_id, text_content, removed_media } = req.body;
    console.log("checking all data", req.body);

    // Find the post and verify ownership
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    // Verify post ownership
    if (post.user_id.toString() !== userId) {
      return res.status(403).json({ message: "You can only edit your own posts." });
    }

    // Update category only if a valid category_id is provided.
    // If category_id is undefined or an empty string, leave the category unchanged.
    if (typeof category_id !== "undefined" && category_id.trim() !== "") {
      if (mongoose.isValidObjectId(category_id)) {
        post.category_id = new mongoose.Types.ObjectId(category_id);
      } else {
        console.warn("Provided category_id is invalid. Leaving category unchanged.");
        // Optionally, you could return an error instead:
        // return res.status(400).json({ message: "Invalid category ID format." });
      }
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
  getReportedPostsAdmin,
  getAllPostAdmin,
  getPostStatsAdmin,
  searchPosts,
  editPost,
  deletePost,
  updateReportStatus,
  handlePostAdminAction,
  getLikedUsers,
  getDestinationPosts,
  toggleDestinationPost,
  getDestinationPostState
};

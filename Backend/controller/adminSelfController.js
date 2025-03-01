const mongoose = require("mongoose");
const User = require("../models/userSchema");
const Post = require("../models/postSchema");

const getUserDetails = async (req, res) => {
  try {
    // Get the decoded user from the token (set by your auth middleware)
    const userFromToken = req.user;
    console.log("Decoded user from token:", userFromToken);

    if (!userFromToken || !userFromToken.id) {
      return res.status(404).json({ message: "User not found in request data." });
    }

    const userId = userFromToken.id;

    // Fetch the user document (so we can update posts_count if needed)
    const userDoc = await User.findById(userId);
    if (!userDoc) {
      return res.status(404).json({ message: "User not found in database." });
    }

    // Count posts for this user and update posts_count if it differs
    const postsCount = await Post.countDocuments({ user_id: userId });
    if (userDoc.posts_count !== postsCount) {
      userDoc.posts_count = postsCount;
      await userDoc.save();
    }

    // Convert the document to a plain object and remove sensitive fields
    const userDetails = userDoc.toObject();
    delete userDetails.password;
    delete userDetails.reported_by;
    delete userDetails.moderation_history;
    delete userDetails.warnings;
    // (Optionally, remove other sensitive fields)

    // Fetch posts by this user; select only required fields, sort by creation date (most recent first),
    // and populate the user reference (adjust "user_id" if needed)
    const userPosts = await Post.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .select("text_content media likes comments createdAt")
      .populate("user_id", "name profile_image")
      .lean();

    // Format the posts for the frontend
    const formattedPosts = userPosts.map((post) => ({
      id: post._id,
      content: post.text_content,
      media: post.media,
      likesCount: post.likes ? post.likes.length : 0,
      commentsCount: post.comments ? post.comments.length : 0,
      createdAt: new Date(post.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      // Map the populated user to a 'user' key so that the frontend can access item.user.name
      user: post.user_id ? {
        name: post.user_id.name,
        profile_image: post.user_id.profile_image,
      } : {},
    }));

    // Build the user response
    const userResponse = {
      id: userDetails._id,
      username: userDetails.username,
      name: userDetails.name,
      email: userDetails.email,
      bio: userDetails.bio,
      profile_image: userDetails.profile_image,
      dob: userDetails.dob,
      gender: userDetails.gender,
      location: userDetails.current_location,
      destination: userDetails.destination_country,
      followersCount: userDetails.followers ? userDetails.followers.length : 0,
      followingCount: userDetails.following ? userDetails.following.length : 0,
      postsCount: userDetails.posts_count || 0,
      likesReceived: userDetails.likes_received || 0,
      status: userDetails.status,
      isBlocked: userDetails.is_blocked,
      isSuspended: userDetails.status === "Suspended",
    };

    res.status(200).json({
      data: {
        user: userResponse,
        posts: formattedPosts,
      },
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getUserDetails };

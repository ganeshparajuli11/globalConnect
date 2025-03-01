const User = require("../models/userSchema");
const Post = require("../models/postSchema");
const Comment = require("../models/commentSchema")
const nodemailer = require("nodemailer");
const crypto = require("crypto"); // To generate a random OTP
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const getUserProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.id) {
      return res
        .status(404)
        .json({ message: "User not found in request data." });
    }

    const userDetails = await User.findById(user.id);
    if (!userDetails) {
      return res.status(404).json({ message: "User not found in database." });
    }

    const userPosts = await Post.find({ user_id: user.id }).sort({
      created_at: -1,
    });

    // Format createdAt for each post
    const formattedPosts = userPosts.map((post) => {
      const createdAt = new Date(post.createdAt);
      const formattedDate = createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      return {
        ...post.toObject(),
        createdAt: formattedDate,
      };
    });

    res.status(200).json({
      data: {
        user: userDetails,
        posts: formattedPosts,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// for admin
const getUserProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("Received userId:", userId);

    if (!userId || userId === "undefined") {
      return res.status(400).json({ message: "Invalid or missing User ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    const userDetails = await User.findById(userId).select("-password");
    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    const userPosts = await Post.find({ user_id: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      data: {
        user: userDetails,
        posts: userPosts.map((post) => ({
          ...post.toObject(),
          createdAt: new Date(post.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("Step 1: Email from request body:", email);

    // Step 1: Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    console.log("Step 2: User found:", user);

    // Step 2: Generate a random OTP and expiration time
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    console.log("Step 3: Generated OTP:", otp);

    // Step 3: Save OTP and expiry in the user's record
    user.reset_otp = otp;
    user.otp_expiry = otpExpiry;
    await user.save();

    console.log("Step 4: OTP saved to user record.");

    // Step 4: Configure Nodemailer and send the email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log("Step 5: Transporter configured.");

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your Password Reset OTP",
      html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 20px;">
                      <h2 style="color: #4CAF50;">Password Reset Request</h2>
                  </div>
                  <p style="font-size: 16px; color: #333;">
                      Hello,
                  </p>
                  <p style="font-size: 16px; color: #333;">
                      You requested to reset your password. Use the OTP below to complete the process. This OTP is valid for <strong>15 minutes</strong>.
                  </p>
                  <div style="text-align: center; margin: 20px 0;">
                      <p style="font-size: 24px; font-weight: bold; color: #4CAF50;">${otp}</p>
                  </div>
                  <p style="font-size: 16px; color: #333;">
                      If you did not request this, please ignore this email or contact our support team.
                  </p>
                  <p style="font-size: 16px; color: #333;">
                      Thank you,<br />
                      <strong>GlobalConnect</strong>
                  </p>
              </div>
          `,
    };

    // Step 5: Send the email
    await transporter.sendMail(mailOptions);

    console.log("Step 6: OTP email sent successfully.");

    // Step 6: Respond to the client
    res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Step 1: Find the user by email
    const user = await User.findOne({ email });
    if (!user || user.reset_otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Step 2: Check if the OTP has expired
    if (user.otp_expiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    // Step 3: OTP is valid
    res
      .status(200)
      .json({ message: "OTP verified. You can now reset your password." });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    console.log("New Password:", newPassword);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update the user's password directly without hashing
    user.password = newPassword;
    await user.save(); // This will trigger the pre-save middleware to hash the password

    console.log("Password after reset:", user.password); // Log the hashed password (after save)
    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Step 1: Find the authenticated user using req.user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Step 2: Verify the current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });
    }

    // Step 3: Update the password
    user.password = newPassword; // No need to hash manually; schema middleware will handle it
    await user.save();

    res.status(200).json({
      message:
        "Password changed successfully. Please login with your new password for security reasons.",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const updateProfileImage = async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Unauthorized: User not authenticated." });
    }

    // Ensure file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // Fetch user details from DB
    const userDetails = await User.findById(req.user.id);
    if (!userDetails) {
      return res
        .status(404)
        .json({ message: "User not found in the database." });
    }

    // Update profile image path
    userDetails.profile_image = req.file.path.replace(/\\/g, "/"); // Ensure cross-platform compatibility
    await userDetails.save();

    return res.status(200).json({
      message: "Profile image updated successfully.",
      profileImage: userDetails.profile_image,
    });
  } catch (error) {
    console.error("Error updating profile image:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getFollowCounts = async (req, res) => {
  try {
    const userId = req.user.id; // Extract userId from the authenticated request

    // Fetch user by userId and populate followers and following counts
    const user = await User.findById(userId)
      .select("followers following") // Select only the relevant fields
      .populate("followers") // Optional, if you want to get follower details as well
      .populate("following"); // Optional, if you want to get following details as well

    if (!user) {
      return res.status(404).send({ message: "User not found!" });
    }

    // Get the count of followers and following
    const followerCount = user.followers.length;
    const followingCount = user.following.length;

    res.status(200).send({
      followerCount,
      followingCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error!" });
  }
};

// Get the users you follow or your followers
const getFollowingOrFollowers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, search } = req.query;

    if (!type || (type !== "followers" && type !== "following")) {
      return res.status(400).json({
        message: "Invalid type parameter! Use 'followers' or 'following'.",
      });
    }

    // Fetch user data and populate the relevant field
    const user = await User.findById(userId).populate({
      path: type,
      match: search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { username: { $regex: search, $options: "i" } },
            ],
          }
        : {}, // Search by name or username if provided
      select: "name username profile_image",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.status(200).json(user[type]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error!" });
  }
};

// update name, bio, email
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, bio, otp } = req.body;
    const userId = req.user.id;

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update email if provided and if it's different from the current email
    if (typeof email !== "undefined" && email !== user.email) {
      // Ensure the new email is not an empty string
      if (!email.trim()) {
        return res.status(400).json({ message: "Email cannot be empty." });
      }

      // Check if the email is already taken by another user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already in use." });
      }

      // Require OTP for email update
      if (!otp) {
        return res
          .status(400)
          .json({ message: "OTP is required to update email." });
      }
      if (user.reset_otp !== otp || user.otp_expiry < new Date()) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
      }

      // Update email and clear OTP fields
      user.email = email;
      user.reset_otp = null;
      user.otp_expiry = null;
    }

    // Update name if provided (even if it is an empty string)
    if (typeof name !== "undefined") {
      user.name = name;
    }

    // Update bio if provided
    if (typeof bio !== "undefined") {
      user.bio = bio;
    }

    await user.save();

    res.status(200).json({ message: "Profile updated successfully.", user });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// get Blocked users from a user
// Get blocked users with name and profile image
const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate(
      "blocked_users",
      "name profile_image"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "Successfully fetched blocked users.",
      blocked_users: user.blocked_users,
    });
  } catch (error) {
    console.error("Error getting blocked users:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Block or Unblock a user
const blockUnblockUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.body; // User to block/unblock

    if (!targetUserId) {
      return res.status(400).json({ message: "Target user ID is required." });
    }

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const isBlocked = user.blocked_users.includes(targetUserId);

    if (isBlocked) {
      // Unblock user
      user.blocked_users = user.blocked_users.filter(
        (id) => id.toString() !== targetUserId
      );
      await user.save();
      return res.status(200).json({ message: "User unblocked successfully." });
    } else {
      // Block user
      user.blocked_users.push(targetUserId);
      await user.save();
      return res.status(200).json({ message: "User blocked successfully." });
    }
  } catch (error) {
    console.error("Error blocking/unblocking user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const sendProfileUpdateOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate OTP and set expiry for 15 minutes
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
    user.reset_otp = otp;
    user.otp_expiry = otpExpiry;
    await user.save();

    // Create a transporter using Gmail (adjust if using a different service)
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
    });

    // Create the email HTML with a custom design and logo
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your Email Update OTP",
      html: `
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Email Update OTP</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Logo/Header -->
                <tr>
                  <td align="center" style="padding: 20px;">
                    <h1 style="margin: 0; font-size: 28px;">
                      <span style="color: #4F46E5;">global</span><span style="color: #000000;">Connect</span>
                    </h1>
                  </td>
                </tr>
                <!-- OTP Message -->
                <tr>
                  <td align="center" style="padding: 30px;">
                    <p style="font-size: 18px; margin: 0 0 20px;">Your OTP for updating your email is:</p>
                    <p style="font-size: 32px; font-weight: bold; margin: 0 0 20px; letter-spacing: 4px;">${otp}</p>
                    <p style="font-size: 14px; color: #777777; margin: 0;">This OTP is valid for 15 minutes.</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td align="center" style="background-color: #f4f4f4; padding: 20px; font-size: 12px; color: #999999;">
                    &copy; ${new Date().getFullYear()} globalConnect. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const searchUser = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id; // Get the logged-in user’s ID

    // Search for users based on name (case-insensitive regex)
    const users = await User.find({ name: { $regex: query, $options: "i" } })
      .limit(10)
      .lean(); // Use .lean() to return plain objects instead of Mongoose documents

    // Fetch the authenticated user's following list
    const authUser = await User.findById(userId).select("following").lean();
    const followingSet = new Set(authUser.following.map(id => id.toString())); // Convert to a Set for fast lookup

    // Add isFollowing field to each user in the response
    const usersWithFollowStatus = users.map(user => ({
      ...user,
      isFollowing: followingSet.has(user._id.toString()),
    }));

    res.status(200).json({ data: usersWithFollowStatus });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Search failed" });
  }
};


const getUserProfileForMobile = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("Fetching profile for userId:", userId);

    if (!userId || userId === "undefined") {
      return res.status(400).json({ message: "Invalid or missing User ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    // Fetch user details and exclude sensitive data
    const userDetails = await User.findById(userId)
      .select("-password -reported_by -moderation_history -warnings")
      .lean();

    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure followers array exists before calling map()
    const currentUserId = req.user.id;
    const isFollowing = userDetails.followers?.some(
      (follower) => follower.toString() === currentUserId.toString()
    ) || false;

    // Fetch posts by this user
    const userPosts = await Post.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .select("text_content media likes comments createdAt")
      .lean();

    const formattedPosts = userPosts.map((post) => ({
      ...post,
      createdAt: new Date(post.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));

    res.status(200).json({
      data: {
        user: {
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
          followersCount: userDetails.followers?.length || 0,
          followingCount: userDetails.following?.length || 0,
          postsCount: userDetails.posts_count || 0,
          likesReceived: userDetails.likes_received || 0,
          status: userDetails.status,
          isBlocked: userDetails.is_blocked,
          isSuspended: userDetails.status === "Suspended",
          isFollowing, // ✅ Now correctly returns true/false
        },
        posts: formattedPosts,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// update dob.
const updateDOB = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dob } = req.body; // Expecting a date string in a valid format

    if (!dob) {
      return res.status(400).json({ message: "Date of birth is required." });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // If the DOB is already set, prevent updating again
    if (user.dob) {
      return res
        .status(400)
        .json({ message: "Date of birth has already been updated." });
    }

    // Update the user's DOB
    user.dob = dob;
    await user.save();

    res.status(200).json({
      message: "Date of birth updated successfully.",
      dob: user.dob,
    });
  } catch (error) {
    console.error("Error updating DOB:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};



const getSelfProfileForMobile = async (req, res) => {
  try {
    // Use the authenticated user's ID from req.user
    const userId = req.user.id;
    console.log("Fetching self profile for userId:", userId);

    if (!userId) {
      return res.status(400).json({ message: "Invalid or missing User ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID format" });
    }

    // Fetch user details and exclude sensitive data
    const userDetails = await User.findById(userId)
      .select("-password -reported_by -moderation_history -warnings")
      .lean();

    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch posts created by this user
    const userPosts = await Post.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .select("text_content media likes comments createdAt")
      .lean();

    // Extract post IDs for bulk comment lookup
    const postIds = userPosts.map((post) => post._id);

    // Fetch comments for these posts and populate commenter info
    const comments = await Comment.find({ postId: { $in: postIds } })
      .populate("userId", "name profile_image")
      .lean();

    // Map each post to include formatted date, counts, and comment details
    const formattedPosts = userPosts.map((post) => {
      // Filter comments belonging to the current post
      const postComments = comments
        .filter(
          (comment) =>
            comment.postId.toString() === post._id.toString()
        )
        .map((comment) => ({
          _id: comment._id,
          text: comment.text,
          createdAt: new Date(comment.createdAt).toLocaleDateString(
            "en-US",
            { year: "numeric", month: "long", day: "numeric" }
          ),
          user: {
            id: comment.userId._id,
            name: comment.userId.name,
            profile_image: comment.userId.profile_image,
          },
        }));

      return {
        ...post,
        createdAt: new Date(post.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        likesCount: post.likes.length,
        commentsCount: postComments.length,
        comments: postComments,
      };
    });

    res.status(200).json({
      data: {
        user: {
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
          followersCount: userDetails.followers?.length || 0,
          followingCount: userDetails.following?.length || 0,
          postsCount: userDetails.posts_count || 0,
          likesReceived: userDetails.likes_received || 0,
          status: userDetails.status,
          isBlocked: userDetails.is_blocked,
          isSuspended: userDetails.status === "Suspended",
        },
        posts: formattedPosts,
      },
    });
  } catch (error) {
    console.error("Error fetching self profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};




module.exports = {
  getUserProfile,
  searchUser,
  sendOTP,
  verifyOTP,
  resetPassword,
  changePassword,
  updateProfileImage,
  getFollowCounts,
  getUserProfileById,
  getFollowingOrFollowers,
  updateUserProfile,
  sendProfileUpdateOTP,
  getBlockedUsers,
  blockUnblockUser,
  getUserProfileForMobile,
  getSelfProfileForMobile,
  updateDOB
};

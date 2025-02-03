const User = require("../models/userSchema");
const { Post } = require("../models/postSchema");
const nodemailer = require("nodemailer");
const crypto = require("crypto"); // To generate a random OTP
const bcrypt = require("bcrypt");
const getUserProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user || !user.id) {
      return res.status(404).json({ message: "User not found in request data." });
    }

    const userDetails = await User.findById(user.id);
    if (!userDetails) {
      return res.status(404).json({ message: "User not found in database." });
    }

    const userPosts = await Post.find({ user_id: user.id }).sort({ created_at: -1 });

    // Format createdAt for each post
    const formattedPosts = userPosts.map(post => {
      const createdAt = new Date(post.createdAt);
      const formattedDate = createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
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

    res
      .status(200)
      .json({
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
    userDetails.profileImage = req.file.path.replace(/\\/g, "/"); // Ensure cross-platform compatibility
    await userDetails.save();

    return res.status(200).json({
      message: "Profile image updated successfully.",
      profileImage: userDetails.profileImage,
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
      .select('followers following') // Select only the relevant fields
      .populate('followers') // Optional, if you want to get follower details as well
      .populate('following'); // Optional, if you want to get following details as well

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


module.exports = {
  getUserProfile,
  sendOTP,
  verifyOTP,
  resetPassword,
  changePassword,
  updateProfileImage,getFollowCounts
};

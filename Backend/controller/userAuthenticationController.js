const User = require("../models/userSchema");
const jwt = require("jsonwebtoken");
const Post = require("../models/postSchema");
const DeviceDetector = require("device-detector-js");

// Signup Function
async function signup(req, res) {
  const {
    name,
    email,
    password,
    dob,
    profile_image,
    role,
    destination_country,
  } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    if (!dob) {
      return res.status(400).json({ message: "Date of birth is required." });
    }

    const currentDate = new Date();
    const birthDate = new Date(dob);
    const age = currentDate.getFullYear() - birthDate.getFullYear();
    const month = currentDate.getMonth() - birthDate.getMonth();

    if (age < 18 || (age === 18 && month < 0)) {
      return res
        .status(400)
        .json({ message: "You must be at least 18 years old to register." });
    }

    const user = new User({
      name,
      email,
      password,
      dob,
      profile_image: profile_image || "",
      role: role || "user",
      destination_country: destination_country || "",
    });

    await user.save();

    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "default_secret";
    const authToken = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    const userResponse = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      bio: user.bio,
      profile_image: user.profile_image,
      dob: user.dob,
      gender: user.gender,
      location: user.current_location,
      destination: user.destination_country,
      followersCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0,
      postsCount: 0, // New user, so no posts yet
      likesReceived: 0,
      status: user.status,
      isBlocked: user.is_blocked,
      isSuspended: user.status === "Suspended",
    };

    res.status(201).json({
      message: "Signup successful!",
      authToken,
      data: { user: userResponse, posts: [] }, // No posts initially
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({
      message: "An error occurred during signup.",
      error: error.message,
    });
  }
}

// admin signup
async function adminSignup(req, res) {
  // Extract required fields from the request body
  const { name, email, password, dob } = req.body;

  // Use the uploaded file information from multer if provided
  let profileImageUrl = "";
  if (req.file) {
    // Construct the file URL based on your storage destination.
    // For example, if the storage destination is "./uploads/profile/", then:
    profileImageUrl = `/uploads/profile/${req.file.filename}`;
  }

  try {
    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Ensure date of birth is provided
    if (!dob) {
      return res.status(400).json({ message: "Date of birth is required." });
    }

    // Calculate age and enforce a minimum age of 18 (optional)
    const currentDate = new Date();
    const birthDate = new Date(dob);
    const age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    if (age < 18 || (age === 18 && monthDiff < 0)) {
      return res
        .status(400)
        .json({ message: "You must be at least 18 years old to register." });
    }

    // Create a new admin with the required fields and explicitly set role to "admin"
    const admin = new User({
      name,
      email,
      password, // The pre-save hook in the User model should hash this password.
      dob,
      profile_image: profileImageUrl, // Use the URL from the uploaded file
      role: "admin",
    });

    await admin.save();

    // Generate a JWT token for the new admin
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "default_secret";
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      JWT_SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );

    res.status(201).json({
      message: "Admin signup successful!",
      token,
    });
  } catch (error) {
    console.error("Error during admin signup:", error);
    res.status(500).json({
      message: "An error occurred during admin signup.",
      error: error.message,
    });
  }
}

// Login

async function login(req, res) {
  const { email, password } = req.body;
  const userIp =
    req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const deviceDetector = new DeviceDetector();
  const deviceInfo = deviceDetector.parse(req.headers["user-agent"]);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found. Please sign up first." });
    }

    if (user.status === "Inactive") {
      user.status = "Active";
    }

    if (user.is_blocked) {
      return res
        .status(403)
        .json({
          message: "Your account is currently blocked. Please contact support.",
        });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const authToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY || "default_secret",
      { expiresIn: "7d" }
    );

    user.last_login = new Date();
    user.login_history.push({
      date: new Date(),
      ip_address: userIp,
      device: deviceInfo.client ? deviceInfo.client.name : "Unknown Device",
    });

    if (user.login_history.length > 10) {
      user.login_history = user.login_history.slice(-10);
    }

    user.moderation_history.push({
      admin: user._id,
      action: "Login",
      note: `User logged in from ${
        deviceInfo.client ? deviceInfo.client.name : "Unknown Device"
      } (${userIp})`,
      date: new Date(),
    });

    user.markModified("login_history");
    user.markModified("moderation_history");
    await user.save();

    const userResponse = {
      id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      bio: user.bio,
      profile_image: user.profile_image,
      dob: user.dob,
      gender: user.gender,
      location: user.current_location,
      destination: user.destination_country,
      followersCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0,
      postsCount: user.posts_count || 0,
      likesReceived: user.likes_received || 0,
      status: user.status,
      isBlocked: user.is_blocked,
      isSuspended: user.status === "Suspended",
    };

    const userPosts = await Post.find({ user_id: user._id })
      .sort({ createdAt: -1 })
      .select("text_content media likes comments createdAt")
      .populate("user_id", "name profile_image")
      .lean();

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
      user: post.user_id
        ? {
            name: post.user_id.name,
            profile_image: post.user_id.profile_image,
          }
        : {},
    }));

    res.status(200).json({
      message: "Login successful!",
      authToken,
      data: { user: userResponse, posts: formattedPosts },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res
      .status(500)
      .json({
        message: "An error occurred during login.",
        error: error.message,
      });
  }
}

async function loginAdmin(req, res) {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found. Please sign up first." });
    }

    // Check if the user has an admin role
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Check if the user is active
    if (user.status !== "Active") {
      return res.status(403).json({
        message: "Your account is currently blocked. Please contact support.",
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    console.log("Password Validity:", isPasswordValid); // Log result
    if (!isPasswordValid) {
      console.error("Invalid password");
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET_KEY || "default_secret", // Use an environment variable or fallback to default
      { expiresIn: "7d" }
    );

    // Update last login timestamp
    user.last_login = new Date();
    await user.save();

    // Return success response
    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        profile_image: user.profile_image,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error("Login Error:", error); // Log full error for debugging
    res.status(500).json({
      message: "An error occurred during login.",
      error: error.message,
    });
  }
}

// get all admin
async function getAllAdmins(req, res) {
  try {
    const admins = await User.find({ role: "admin" });

    res.status(200).json({
      message: "All admins retrieved successfully.",
      admins: admins.map((admin) => ({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        location: admin.location,
        profile_image: admin.profile_image,
        verified: admin.verified,
      })),
    });
  } catch (error) {
    console.error("Error retrieving admins:", error);
    res
      .status(500)
      .json({ message: "An error occurred while retrieving admins." });
  }
}

// Remove admin
async function removeAdmin(req, res) {
  const user = req.user.role;
  try {
    // Check if the authenticated user is an admin
    if (user !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Get the adminId from the URL parameter
    const adminId = req.params.adminId;

    // Optionally, you could add logic here to prevent deleting the last admin.

    // Delete the admin with the given adminId
    await User.findByIdAndDelete(adminId);

    res.status(200).json({ message: "Admin deleted successfully." });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting admin." });
  }
}

// Edit admin details
async function editAdminDetails(req, res) {
  const user = req.user.role;
  try {
    // Check if the authenticated user is an admin
    if (user !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Get the adminId from the URL parameter
    const adminId = req.params.adminId;
    const { name, email, password, profile_image, location } = req.body;
    const updatedFields = { name, email, location, profile_image };

    // If a new password is provided, include it (ensure that it gets hashed in the model's pre-save hook)
    if (password) {
      updatedFields.password = password;
    }

    // Update the admin's details
    const updatedUser = await User.findByIdAndUpdate(adminId, updatedFields, {
      new: true,
    });
    if (!updatedUser) {
      return res.status(404).json({ message: "Admin not found." });
    }
    res.status(200).json({
      message: "Admin details updated successfully.",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        location: updatedUser.location,
        profile_image: updatedUser.profile_image,
        verified: updatedUser.verified,
      },
    });
  } catch (error) {
    console.error("Error updating admin details:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating admin details." });
  }
}

// selecting the destination country:
async function updateDestinationCountry(req, res) {
  try {
    // Retrieve the user ID from the authenticated token
    const userId = req.user.id;
    const { destination_country } = req.body;

    // Validate input
    if (!destination_country) {
      return res
        .status(400)
        .json({ message: "Destination country is required." });
    }

    // Update the user's destination country
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { destination_country },
      { new: true } // Return the updated user document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // Return the updated user data
    res.status(200).json({
      message: "Destination country updated successfully.",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        destination_country: updatedUser.destination_country,
      },
    });
  } catch (error) {
    console.error("Error updating destination country:", error);
    res
      .status(500)
      .json({ message: "An error occurred.", error: error.message });
  }
}

module.exports = {
  login,
  signup,
  loginAdmin,
  updateDestinationCountry,
  adminSignup,
  getAllAdmins,
  removeAdmin,
  editAdminDetails,
};

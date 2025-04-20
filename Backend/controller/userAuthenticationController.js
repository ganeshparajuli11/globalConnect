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

  // Basic validation checks
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email address." });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long.",
    });
  }

  if (!name) {
    return res.status(400).json({ message: "Name is required." });
  }

  if (!dob) {
    return res.status(400).json({ message: "Date of birth is required." });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
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
      { expiresIn: "7d" }
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

  const { name, email, password, dob } = req.body;

  // Use the uploaded file information from multer if provided
  let profileImageUrl = "";
  if (req.file) {
    // Construct the file URL based on your storage destination.
    profileImageUrl = `uploads/profile/${req.file.filename}`;
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


    // Explicitly set role to "admin" and verified to true
    const admin = new User({
      name,
      email,
      password, // The pre-save hook in the User model should hash this password.
      dob,
      profile_image: profileImageUrl, // Use the URL from the uploaded file
      role: "admin",
      verified: true 
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
  const userIp = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const deviceDetector = new DeviceDetector();
  const deviceInfo = deviceDetector.parse(req.headers["user-agent"]);

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please sign up first." });
    }

    // Check account suspension
    if (user.is_suspended) {
      if (user.suspended_until && user.suspended_until > new Date()) {
        return res.status(403).json({
          message: `Your account is suspended until ${user.suspended_until.toLocaleDateString()}. Please contact support.`,
          code: "ACCOUNT_SUSPENDED"
        });
      } else {
        // If suspension period is over, remove suspension
        user.is_suspended = false;
        user.suspended_until = null;
      }
    }

    // Check if account is blocked
    if (user.is_blocked) {
      return res.status(403).json({
        message: "Your account is currently blocked. Please contact support.",
        code: "ACCOUNT_BLOCKED"
      });
    }

    // Check for permanently deleted account
    if (user.is_deleted && user.deleted_at && user.deleted_at < new Date()) {
      return res.status(401).json({
        message: "This account has been permanently deleted. Please create a new account.",
        code: "ACCOUNT_DELETED"
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Handle account reactivation
    if (user.is_deactivate) {
      user.is_deactivate = false;
      user.deactivate_date = null;
      user.moderation_history.push({
        admin: user._id,
        action: "Login",
        note: "Account reactivated through login",
        date: new Date()
      });
    }

    // Handle deletion cancellation within 15-day period
    if (user.is_deleted && user.deleted_at && user.deleted_at > new Date()) {
      user.is_deleted = false;
      user.deleted_at = null;
      user.moderation_history.push({
        admin: user._id,
        action: "Login",
        note: "Account deletion cancelled through login",
        date: new Date()
      });
    }

    // Update login history and activity
    user.last_login = new Date();
    user.last_activity = new Date();
    user.login_history.push({
      date: new Date(),
      ip_address: userIp,
      device: deviceInfo.client ? deviceInfo.client.name : "Unknown Device"
    });

    // Keep only last 10 login records
    if (user.login_history.length > 10) {
      user.login_history = user.login_history.slice(-10);
    }

    // Add login to moderation history
    user.moderation_history.push({
      admin: user._id,
      action: "Login",
      note: `User logged in from ${deviceInfo.client ? deviceInfo.client.name : "Unknown Device"} (${userIp})`,
      date: new Date()
    });

    user.markModified("login_history");
    user.markModified("moderation_history");
    await user.save();

    // Generate auth token
    const authToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY || "default_secret",
      { expiresIn: "7d" }
    );

    // Prepare user response
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
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      postsCount: user.posts_count || 0,
      likesReceived: user.likes_received || 0,
      status: user.status,
      isBlocked: user.is_blocked,
      isSuspended: user.is_suspended,
      isDeactivated: user.is_deactivate,
      isDeleted: user.is_deleted
    };

    // Fetch user posts if account is active
    const userPosts = await Post.find({ user_id: user._id })
      .sort({ createdAt: -1 })
      .select("text_content media likes comments createdAt")
      .populate("user_id", "name profile_image")
      .lean();

    const formattedPosts = userPosts.map(post => ({
      id: post._id,
      content: post.text_content,
      media: post.media,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      createdAt: new Date(post.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }),
      user: post.user_id ? {
        name: post.user_id.name,
        profile_image: post.user_id.profile_image
      } : {}
    }));

    // Return appropriate success message based on account state
    let message = "Login successful!";
    if (user.is_deactivate === false && user.deactivate_date === null) {
      message = "Welcome back! Your account has been reactivated.";
    } else if (user.is_deleted === false && user.deleted_at === null) {
      message = "Welcome back! Your account deletion has been cancelled.";
    }

    res.status(200).json({
      message,
      authToken,
      data: { user: userResponse, posts: formattedPosts }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      message: "An error occurred during login.",
      error: error.message
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
    if (user.role !== "admin" && user.role !== "superadmin") {
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
    const { destination_country, destination_flag } = req.body;

    // Validate input: destination_country and destination_flag must be provided
    if (!destination_country || !destination_flag) {
      return res
        .status(400)
        .json({ message: "Both destination country and flag code are required." });
    }

    // Ensure the ISO code is in lowercase (flagcdn requires lowercase)
    const isoCode = destination_flag.toLowerCase();

    // Construct the flag URL using the ISO code
    const flagUrl = `https://flagcdn.com/48x36/${isoCode}.png`;

    // Update the user's destination country and flag in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        destination_country,
        flag: flagUrl, // New field storing the computed flag URL
      },
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
        flag: updatedUser.flag, // Include the flag URL in the response
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

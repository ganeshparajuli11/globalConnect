const User = require("../models/userSchema");
const jwt = require("jsonwebtoken");
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
    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Check if date of birth is provided and calculate age (user must be at least 18)
    if (!dob) {
      return res.status(400).json({ message: "Date of birth is required." });
    }

    const currentDate = new Date();
    const birthDate = new Date(dob);
    const age = currentDate.getFullYear() - birthDate.getFullYear();
    const month = currentDate.getMonth() - birthDate.getMonth();

    // If the user's age is less than 18
    if (age < 18 || (age === 18 && month < 0)) {
      return res
        .status(400)
        .json({ message: "You must be at least 18 years old to register." });
    }

    // Create a new user instance
    const user = new User({
      name,
      email,
      password, // Password will be hashed by the pre-save hook in the User model
      dob, // Storing the date of birth
      profile_image: profile_image || "",
      role: role || "user",
      destination_country: destination_country || "",
    });

    // Save the new user to the database
    await user.save();

    // Generate JWT token
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "default_secret";
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    // Return success response with token
    res.status(201).json({
      message: "Signup successful!",
      token,
    });
  } catch (error) {
    console.error("Error during signup:", error);

    // Handle server errors
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
      return res.status(400).json({ message: "You must be at least 18 years old to register." });
    }

    // Create a new admin with the required fields and explicitly set role to "admin"
    const admin = new User({
      name,
      email,
      password, // The pre-save hook in the User model should hash this password.
      dob,
      profile_image: profileImageUrl, // Use the URL from the uploaded file
      role: "admin"
    });

    await admin.save();

    // Generate a JWT token for the new admin
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "default_secret";
    const token = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

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
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please sign up first." });
    }

    // If user status is inactive, activate account
    if (user.status === "Inactive") {
      user.status = "Active";
    }

    // Check if user is blocked
    if (user.is_blocked) {
      return res.status(403).json({ message: "Your account is currently blocked. Please contact support." });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY || "default_secret",
      { expiresIn: "7d" }
    );

    // ✅ Update last login timestamp
    user.last_login = new Date();

    // ✅ Save login history with user IP & device details
    user.login_history.push({
      date: new Date(),
      ip_address: userIp,
      device: deviceInfo.client ? deviceInfo.client.name : "Unknown Device",
    });

    // ✅ Keep only the last 10 login records
    if (user.login_history.length > 10) {
      user.login_history = user.login_history.slice(-10);
    }

    // ✅ Track login in moderation history
    user.moderation_history.push({
      admin: user._id, // Self-tracking (optional: replace with an admin if needed)
      action: "Login",
      note: `User logged in from ${deviceInfo.client ? deviceInfo.client.name : "Unknown Device"} (${userIp})`,
      date: new Date(),
    });

    // ✅ Explicitly mark fields as modified
    user.markModified("login_history");
    user.markModified("moderation_history");

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
        profile_image: user.profile_image,
        verified: user.verified,
        last_login: user.last_login,
        login_history: user.login_history,
        moderation_history: user.moderation_history,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "An error occurred during login.", error: error.message });
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
      return res
        .status(403)
        .json({
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
    res
      .status(500)
      .json({
        message: "An error occurred during login.",
        error: error.message,
      });
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

module.exports = { login, signup, loginAdmin, updateDestinationCountry,adminSignup };

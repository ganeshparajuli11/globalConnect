const User = require("../models/userSchema");
const jwt = require("jsonwebtoken");

// Signup Function
async function signup(req, res) {
  const {
    name,
    email,
    password,
    age,
    profile_image,
    location,
    role,
    destination_country,
  } = req.body;

  try {
    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Check if age is valid
    if (!age || age < 18) {
      return res.status(400).json({
        message: "You must be at least 18 years old to register.",
      });
    }

    // Create a new user instance
    const user = new User({
      name,
      email,
      password, // Password will be hashed by the pre-save hook in the User model
      age,
      profile_image: profile_image || "",
      location: location || "",
      is_blocked: false,
      role: role || "user",
      destination_country : destination_country || "",
    });

    // Save the new user to the database
    await user.save();

    // Generate JWT token
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "default_secret";
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Return success response with token
    res.status(201).json({
      message: "Signup successful!",
      token,
    });
  } catch (error) {
    console.error("Error during signup:", error);

    // Handle server errors
    res
      .status(500)
      .json({ message: "An error occurred during signup.", error: error.message });
  }
}

// Login

async function login(req, res) {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please sign up first." });
    }

    // If user status is inactive, set it to active
    if (user.status === "Inactive") {
      user.status = "Active";
      await user.save(); // Save the updated status
    }

    // Check if the user is blocked
    if (user.is_blocked) {
      return res.status(403).json({ message: "Your account is currently blocked. Please contact support." });
    }

    // Log the password and stored hashed password
    console.log("Login Attempt - Password:", password);
    console.log("Stored Password Hash:", user.password);

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
    res.status(500).json({ message: "An error occurred during login.", error: error.message });
  }
}



async function loginAdmin(req, res) {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please sign up first." });
    }

    // Check if the user has an admin role
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    // Check if the user is active
    if (user.status !== "Active") {
      return res.status(403).json({ message: "Your account is currently blocked. Please contact support." });
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
    res.status(500).json({ message: "An error occurred during login.", error: error.message });
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
      return res.status(400).json({ message: "Destination country is required." });
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
    res.status(500).json({ message: "An error occurred.", error: error.message });
  }
}


  module.exports = {login, signup,loginAdmin,updateDestinationCountry};

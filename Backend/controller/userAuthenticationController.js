const User = require("../models/userSchema");
const jwt = require("jsonwebtoken");

// Signup Function
async function signup(req, res) {
  const { name, email, password, age, profile_image, location } = req.body;

  try {
    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Check if age is valid
    if (!age || age < 18) {
      return res.status(400).json({ message: "You must be at least 18 years old to register." });
    }

    // Create a new user instance
    const user = new User({
      name,
      email,
      password, // Password will be hashed by the pre-save hook in the User model
      age,
      profile_image: profile_image || "", // Default to empty string if not provided
      location: location || "", // Default to empty string if not provided
    });

    // Save the new user to the database
    await user.save();

    // Return success response
    res.status(201).json({
      message: "Signup successful!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        profile_image: user.profile_image,
        location: user.location,
        verified: user.verified,
        status: user.status,
        date_created: user.date_created,
      },
    });
  } catch (error) {
    // Handle server errors
    res.status(500).json({ message: "An error occurred during signup.", error });
  }
};


// Login

async function login(req, res) {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please sign up first." });
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


  module.exports = {login, signup};

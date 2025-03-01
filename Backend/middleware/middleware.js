const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
// Middleware to check authentication
const checkAuthentication = (req, res, next) => {
  try {
    console.log("Authenticating user...");

    // Extract token from the Authorization header
    const token = req.headers.authorization?.replace("Bearer ", "");
    console.log("token: ", token);
    if (!token) {
      return res.status(401).json({ msg: "No token provided. Unauthorized." });
    }

    // Verify the token
    const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || "default_secret";
    const decoded = jwt.verify(token, JWT_SECRET_KEY);
    console.log("decoded data", decoded);

    // Check if decoded token contains necessary user data
    if (!decoded || !decoded.id || !decoded.role) {
      return res
        .status(401)
        .json({ msg: "Token is missing required information." });
    }

    // Attach user data to the request object
    req.user = decoded;
    console.log("User data from token: ", req.user); // Log the decoded token data

    next();
  } catch (error) {
    console.error("Authentication error: ", error);
    return res.status(401).json({ msg: "Invalid token. Unauthorized.", error });
  }
};

// console.log("User role in checkIsAdmin outside:", req.user?.role);
// Middleware to check if the user is an admin
const checkIsAdmin = (req, res, next) => {
  console.log("User role in checkIsAdmin:", req.user?.role);
  if (req.user?.role === "admin") {
    next();
  } else {
    res.status(403).json({ msg: "Access denied: Admins only." });
  }
};

// Middleware to check if the user is a normal user
const checkIsUser = (req, res, next) => {
  if (req.user?.role === "user") {
    next();
  } else {
    res.status(403).json({ msg: "Access denied: Users only." });
  }
};

// Middleware to allow both admin and user access
const bothUser = (req, res, next) => {
  if (req.user?.role === "admin" || req.user?.role === "user") {
    next();
  } else {
    res.status(403).json({ msg: "Access denied: Admins or Users only." });
  }
};

const checkUserStatus = async (req, res, next) => {
  try {
    // Assume req.user is already set after token verification
    const user = await User.findById(req.user.id);
    if (user.is_blocked || user.is_suspended) {
      return res.status(403).json({
        message:
          "Your account has been blocked or suspended. Please contact support.",
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

const checkDOBUpdated = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("dob");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    req.dobUpdated = !!user.dob; 

    // or send a response if you want to block access until DOB is set.
    next();
  } catch (error) {
    console.error("Error checking DOB:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  checkAuthentication,
  checkIsAdmin,
  checkIsUser,
  bothUser,
  checkUserStatus,
  checkDOBUpdated,
};

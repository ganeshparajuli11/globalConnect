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

const checkIsSuperAdmin = (req, res, next) => {
  console.log("User role in checkIsSuperAdmin:", req.user?.role);
  if (req.user?.role === "superadmin") {
    next();
  } else {
    res.status(403).json({ 
      success: false,
      message: "Access denied: Super Admins only.",
      code: "UNAUTHORIZED_ACCESS" 
    });
  }
};

const checkUserStatus = async (req, res, next) => {
  try {
    // Assume req.user is already set after token verification
    const user = await User.findById(req.user.id);
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if account is marked for deletion and past deletion date
    if (user.is_deleted && user.deleted_at && user.deleted_at < new Date()) {
      return res.status(401).json({
        message: "Account has been permanently deleted. Please create a new account.",
        code: "ACCOUNT_DELETED"
      });
    }

    // Check if account was marked for deletion but user logged in before deletion date
    if (user.is_deleted && user.deleted_at && user.deleted_at > new Date()) {
      // Reactivate account
      user.is_deleted = false;
      user.deleted_at = null;
      user.status = "Active";
      user.moderation_history.push({
        action: "Login",
        note: "Account deletion cancelled by user login",
        date: new Date(),
        admin: user._id
      });
      await user.save();
    }

    // Check for blocked or suspended status
    if (user.is_blocked || user.is_suspended) {
      return res.status(403).json({
        message: "Your account has been blocked or suspended. Please contact support."
      });
    }

    // Check deactivation status
    if (user.is_deactivate) {
      // Reactivate account on login
      user.is_deactivate = false;
      user.deactivate_date = null;
      await user.save();
    }

    next();
  } catch (error) {
    console.error("Error checking user status:", error);
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
  checkIsSuperAdmin
};

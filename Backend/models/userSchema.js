const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Schema for logging moderation actions on a user account
const moderationHistorySchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: {
    type: String,
    enum: ["Suspended", "Banned", "Reinstated", "Warning Issued"],
    required: true,
  },
  note: { type: String },
  date: { type: Date, default: Date.now },
});

// Schema for recording warnings issued to a user
const warningSchema = new mongoose.Schema({
  warning: { type: String, required: true },
  issued_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    // Basic profile details
    username: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    bio: { type: String, maxlength: 500, default: "" },
    password: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    verified: { type: Boolean, default: false },
    profile_image: { type: String, default: null },
    profile_views: { type: Number, default: 0 },

    // Location and travel details
    reached_destination: { type: Boolean, default: false },
    destination_country: { type: String, default: null },
    current_location: {
      country: { type: String, default: "Nepal" },
      city: { type: String, default: "Kathmandu" },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    in_destination: { type: Boolean, default: false },

    // Account and moderation status
    is_blocked: { type: Boolean, default: false },
    reported_count: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Under Review", "Suspended", "Banned"],
      default: "Active",
    },
    suspended_until: { type: Date, default: null }, // Suspend the account until this date

    // Interests and personalized recommendations
    interests: [{ type: String }],
    preferred_categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],

    // Social connections
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    blocked_users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Engagement metrics
    posts_count: { type: Number, default: 0 },
    comments_count: { type: Number, default: 0 },
    likes_given: { type: Number, default: 0 },
    likes_received: { type: Number, default: 0 },

    // Authentication and security fields
    reset_otp: { type: String, default: null },
    otp_expiry: { type: Date, default: null },
    otp_attempts: { type: Number, default: 0 },
    otp_blocked_until: { type: Date, default: null },

    // Notification settings
    notifications_enabled: { type: Boolean, default: true },
    notification_preferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },

    // Login activity log
    login_history: [
      {
        date: { type: Date },
        ip_address: { type: String },
        device: { type: String },
      },
    ],

    // Moderation and warning history for audit purposes
    moderation_history: [moderationHistorySchema],
    warnings: [warningSchema],
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

// Middleware to hash the password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  console.log("Hashed Password:", this.password);
  next();
});

// Instance method to compare provided password with hashed password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Check if OTP is currently blocked
userSchema.methods.isOTPBlocked = function () {
  if (!this.otp_blocked_until) return false;
  return this.otp_blocked_until > new Date();
};

// Add a follower if not already following
userSchema.methods.addFollower = function (followerId) {
  if (!this.followers.includes(followerId)) {
    this.followers.push(followerId);
    return this.save();
  }
};

// Add a following if not already following
userSchema.methods.addFollowing = function (userId) {
  if (!this.following.includes(userId)) {
    this.following.push(userId);
    return this.save();
  }
};

module.exports = mongoose.model("User", userSchema);

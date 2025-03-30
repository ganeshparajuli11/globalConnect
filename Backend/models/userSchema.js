const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;

// Schema for logging moderation actions on a user account
const moderationHistorySchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: {
    type: String,
    enum: ["Suspended", "Banned", "Reinstated", "Warning Issued", "Login"],
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
    is_suspended: { type: Boolean, default: false },
    is_deactivate: { type: Boolean, default: false },
    deactivate_date: { type: Date, default: null },
    reported_count: { type: Number, default: 0 },
    reported_by: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["Active", "Inactive", "Under Review", "Suspended", "Banned", "Long-term Inactive"],
      default: "Active",
    },
    suspended_until: { type: Date, default: null },
    unblock_date: { type: Date, default: null },

    // Interests
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

    // Authentication and security
    reset_otp: { type: String, default: null },
    otp_expiry: { type: Date, default: null },
    otp_attempts: { type: Number, default: 0 },
    otp_blocked_until: { type: Date, default: null },

    // Notifications
    notifications_enabled: { type: Boolean, default: true },
    notification_preferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
    // NEW: Store Expo push token for notifications
    expoPushToken: { type: String, default: null },

    last_activity: { type: Date, default: null },
    last_login: { type: Date, default: null },
    // Add this field (for example, after “following”)
    liked_posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    // Login activity log
    login_history: [
      {
        date: { type: Date },
        ip_address: { type: String },
        device: { type: String },
      },
    ],

    // Moderation and warning history
    moderation_history: [moderationHistorySchema],
    warnings: [warningSchema],

    // Soft delete
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Middleware to hash the password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Methods for blocking/unblocking users
userSchema.methods.blockUser = function (userId) {
  if (!this.blocked_users.includes(userId)) {
    this.blocked_users.push(userId);
    return this.save();
  }
};

userSchema.methods.unblockUser = function (userId) {
  this.blocked_users = this.blocked_users.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Track last login
userSchema.methods.updateLastLogin = function () {
  this.last_login = new Date();
  return this.save();
};

module.exports = mongoose.model("User", userSchema);

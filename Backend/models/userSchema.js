const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    verified: { type: Boolean, default: false },
    profile_image: { type: String, default: null },
    cover_image: { type: String, default: null }, // Optional cover image for profile
    destination_country: { type: String, default: null },
    current_location: {
      country: { type: String, default: "Nepal" },
      city: { type: String, default: "Kathmandu" },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    is_blocked: { type: Boolean, default: false },
    reported_count: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Under Review"],
      default: "Active",
    },
    date_created: { type: Date, default: Date.now },
    last_login: { type: Date, default: null },
    in_destination: { type: Boolean, default: false }, // If user is in their destination country

    // Interests and preferences for personalized recommendations
    interests: [{ type: String }], // User's interests (e.g., "Jobs", "Rentals", "Travel")
    preferred_categories: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    ],

    // Social and activity data
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users following this user
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users this user follows
    blocked_users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users blocked by this user

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

    // Activity logs
    login_history: [
      {
        date: { type: Date },
        ip_address: { type: String },
        device: { type: String },
      },
    ],
  },
  {
    timestamps: true, // Automatically create `createdAt` and `updatedAt`
  }
);

// Middleware to hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  console.log("Hashed Password:", this.password);
  next();
});

// Compare the provided password with the hashed password
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Method to check if OTP is blocked
userSchema.methods.isOTPBlocked = function () {
  if (!this.otp_blocked_until) return false;
  return this.otp_blocked_until > new Date();
};

// Increment follower count
userSchema.methods.addFollower = function (followerId) {
  if (!this.followers.includes(followerId)) {
    this.followers.push(followerId);
    return this.save();
  }
};

// Increment following count
userSchema.methods.addFollowing = function (userId) {
  if (!this.following.includes(userId)) {
    this.following.push(userId);
    return this.save();
  }
};

module.exports = mongoose.model("User", userSchema);

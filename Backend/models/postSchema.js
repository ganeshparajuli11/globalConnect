const mongoose = require("mongoose");

// Define a dedicated media schema with its own _id.
const mediaSchema = new mongoose.Schema(
  {
    media_path: { type: String, required: true },
    media_type: { type: String },
    description: { type: String, maxlength: 200 },
  },
  { _id: true }
);

// Schema for individual reports on a post
const reportSchema = new mongoose.Schema({
  reported_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, required: true },
  reported_at: { type: Date, default: Date.now }
});

// Schema for logging moderation actions on a post
const moderationHistorySchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: {
    type: String,
    enum: ["Suspended", "Blocked", "Reviewed", "Reinstated"],
    required: true
  },
  reason: { type: String },
  date: { type: Date, default: Date.now }
});

// Main post schema with soft delete fields added
const postSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    text_content: { type: String, maxlength: 500 },
    media: [mediaSchema],
    tags: [{ type: String }],
    location: { type: String, maxlength: 100 },
    visibility: {
      type: String,
      enum: ["public", "private", "friends"],
      default: "public"
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
      }
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    // Analytics and Engagement
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    // Moderation / Administrative Fields
    status: {
      type: String,
      enum: ["Active", "Suspended", "Blocked", "Under Review", "Deleted"],
      default: "Active"
    },
    isSuspended: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isUnderReview: { type: Boolean, default: false },
    suspended_from: { type: Date, default: null },
    suspended_until: { type: Date, default: null },
    suspension_reason: { type: String },
    reports: [reportSchema],
    moderation_history: [moderationHistorySchema],
    pinned: { type: Boolean, default: false },
    // Edit tracking
    edited: { type: Boolean, default: false },
    edited_at: { type: Date },
    // Soft Delete Fields
    is_deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);

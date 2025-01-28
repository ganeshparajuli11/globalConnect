const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User model
      required: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // Reference to the Category model
      required: true,
    },
    text_content: {
      type: String, // Optional text content of the post
      maxlength: 500, // Limit text content length to 500 characters
    },
    media: [
      {
        media_path: { type: String }, // URL or path of the media file
        media_type: { type: String }, // MIME type of the media file
        description: { type: String, maxlength: 200 }, // Optional media description
      },
    ],
    tags: {
      type: [String], // Tags associated with the post
    },
    location: {
      type: String, // Location tag for the post
      maxlength: 100,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "friends"], // Visibility options
      default: "public",
    },
    likes: [
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to users who liked the post
      },
    ],
    likes_count: {
      type: Number,
      default: 0, // Default number of likes is 0
    },
    share_count: {
      type: Number,
      default: 0, // Default number of shares is 0
    },
    comments_count: {
      type: Number,
      default: 0, // Default number of comments is 0
    },
    reported_count: {
      type: Number,
      default: 0, // Default number of reports is 0
    },
    reports: [
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Users who reported the post
        reason: { type: String }, // Reason for reporting
        timestamp: { type: Date, default: Date.now },
      },
    ],
    is_featured: {
      type: Boolean,
      default: false, // By default, posts are not featured
    },
    status: {
      type: String,
      enum: ["active", "archived", "under review"], // Post status options
      default: "active",
    },
    is_blocked: { type: Boolean, default: false }, // To block a post if flagged
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment", // Reference to the Comment model
      },
    ],
    created_at: {
      type: Date,
      default: Date.now, // Default to the current timestamp
    },
    updated_at: {
      type: Date, // Optional field for the last edit timestamp
    },
    metadata: {
      device: { type: String }, // Device from which post was created
      browser: { type: String }, // Browser used
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, // Automatically handle timestamps
  }
);

const Post = mongoose.model("Post", postSchema);

module.exports = { Post };

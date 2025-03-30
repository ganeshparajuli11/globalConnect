const mongoose = require("mongoose");

const deletedUserSchema = new mongoose.Schema({
  originalUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userData: {
    name: String,
    email: String,
    username: String,
    profile_image: String,
    bio: String,
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    posts_count: Number,
    likes_received: Number,
    reported_count: Number
  },
  posts: [{
    text_content: String,
    media: [String],
    likes: Number,
    comments: Number,
    created_at: Date
  }],
  deletion_date: {
    type: Date,
    default: Date.now
  },
  deletion_reason: String,
  moderation_history: [{
    action: String,
    note: String,
    date: Date,
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('DeletedUser', deletedUserSchema);
const mongoose = require("mongoose");
const postSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  text_content: { type: String, maxlength: 500 },
  media: [
    {
      media_path: { type: String },
      media_type: { type: String },
      description: { type: String, maxlength: 200 },
    },
  ],
  tags: {
    type: [String],
  },
  location: {
    type: String,
    maxlength: 100,
  },
  visibility: {
    type: String,
    enum: ["public", "private", "friends"],
    default: "public",
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
}, { timestamps: true });

const Post = mongoose.model("Post", postSchema);
module.exports = { Post };
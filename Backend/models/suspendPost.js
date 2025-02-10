// Also add the post Id too

const mongoose = require("mongoose");
const suspensionSchema = new mongoose.Schema({
// add post id to schema
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: mongoose.Schema.Types.ObjectId, ref: "ReportCategory", required: true },
  suspended_from: { type: Date, required: true },
  suspended_until: { type: Date, required: true },
  reason: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Suspension", suspensionSchema);
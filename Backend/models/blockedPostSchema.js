// Blocked post schema 
// postID 
// Blocked Reason
// Blocked Type : for a date like from jan1 to jan 13 or permamanent block

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blockedPostSchema = new Schema({
  postID: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  blockedReason: {
    type: String,
    required: true,
  },
  blockedType: {
    type: String,
    required: true,
    enum: ['date', 'permanent'],
  },
});

module.exports = mongoose.model('BlockedPost', blockedPostSchema);
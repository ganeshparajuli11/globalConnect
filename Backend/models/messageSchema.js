const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    messageType: { type: String, enum: ['text', 'image', 'post'], required: true },
    content: { type: String, required: function () { return this.messageType === 'text'; } },
    image: { type: Buffer, required: function () { return this.messageType === 'image'; } },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: function () { return this.messageType === 'post'; } },
    timestamp: { type: Date, default: Date.now, index: true },
    readByReceiver: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);

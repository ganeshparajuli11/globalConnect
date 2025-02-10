//Suspend User schema 
// userId, reason, suspended from, suspended till, reportType

const mongoose = require('mongoose');

const suspendUserSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  suspendedFrom: { type: Date, required: true },
  suspendedTill: { type: Date, required: true },
  type: { type: mongoose.Schema.Types.ObjectId, ref: "ReportCategory", required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SuspendUser', suspendUserSchema);


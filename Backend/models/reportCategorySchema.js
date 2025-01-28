const mongoose = require('mongoose');

const reportCategorySchema = new mongoose.Schema({
  report_title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

reportCategorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ReportCategory = mongoose.model('ReportCategory', reportCategorySchema);

module.exports = ReportCategory;

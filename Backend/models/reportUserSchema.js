const mongoose = require('mongoose');


const reportUserSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reported_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    report_category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReportCategory",
      required: true,
    },
    report_count: {
      type: Number,
      default: 1,  
    },

    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

reportUserSchema.statics.updateReportCount = async function (userId, reporterId, categoryId, postId) {
  // Check if the report already exists
  const report = await this.findOne({ user_id: userId, reported_by: reporterId, report_category: categoryId });

  if (report) {
    // If a report exists, increment the report_count
    report.report_count += 1;
    await report.save();
  } else {
    // If no report exists, create a new one
    const newReport = new this({
      user_id: userId,
      reported_by: reporterId,
      report_category: categoryId,
      post_id: postId,
    });
    await newReport.save();
  }

  // Check if the reported user has been reported 5 or more times
  const reports = await this.aggregate([
    { $match: { user_id: userId } },
    { $group: { _id: "$user_id", totalReports: { $sum: "$report_count" } } },
  ]);

  if (reports[0] && reports[0].totalReports >= 5) {
    // Block the user if 5 or more reports are accumulated
    await mongoose.model('User').findByIdAndUpdate(userId, { is_blocked: true });
    await mongoose.model('Post').updateMany({ user_id: userId }, { is_blocked: true });
  }
};

module.exports = mongoose.model('ReportUser', reportUserSchema);

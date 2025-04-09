const ReportUser = require('../models/reportUserSchema');
const User = require('../models/userSchema');
const Post = require('../models/postSchema');
const ReportCategory = require('../models/reportCategorySchema');
const mongoose = require('mongoose');

// Controller to report a user
const reportUser = async (req, res) => {
  try {
    const { reportedUserId, reportCategoryId } = req.body;
    const reportingUserId = req.user?.id;

    // Check if reporting user is trying to report themselves.
    if (reportedUserId.toString() === reportingUserId.toString()) {
      return res.status(400).json({ message: "You cannot report yourself." });
    }

    if (
      !mongoose.Types.ObjectId.isValid(reportedUserId) ||
      !mongoose.Types.ObjectId.isValid(reportCategoryId)
    ) {
      return res.status(400).json({
        message: "Invalid user or report category ID provided.",
      });
    }

    // Validate the reported user
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ message: "Reported user not found." });
    }

    // Check if the user has already been reported by the reporting user
    if (reportedUser.reported_by && reportedUser.reported_by.includes(reportingUserId)) {
      return res.status(200).json({ message: "You have already reported this user." });
    }

    // Validate the report category
    const reportCategory = await ReportCategory.findById(reportCategoryId);
    if (!reportCategory) {
      return res.status(404).json({ message: "Invalid report category." });
    }

    // Update the report count (for logging/reporting history)
    await ReportUser.updateReportCount(
      reportedUserId,
      reportingUserId,
      reportCategoryId || null
    );

    // Increment the reported_count and log the reporting user only once
    reportedUser.reported_count += 1;
    reportedUser.reported_by.push(reportingUserId);

    // Check if the user should be blocked based on reported count threshold
    if (reportedUser.reported_count >= 5) {
      reportedUser.is_blocked = true;
    }

    // Save the updated user document
    await reportedUser.save();

    return res.status(200).json({ message: "User reported successfully." });
  } catch (error) {
    console.error("Error reporting user:", error.message);
    return res
      .status(500)
      .json({ message: "An error occurred while reporting the user." });
  }
};



// Controller to report a post
const reportPost = async (req, res) => {
  try {
    const { postId, selectedCategory } = req.body;
    const reportingUserId = req.user?.id;

    if (!reportingUserId) {
      return res.status(400).json({ message: "Reporting user is required." });
    }

    if (
      !mongoose.Types.ObjectId.isValid(postId) ||
      !mongoose.Types.ObjectId.isValid(selectedCategory)
    ) {
      return res.status(400).json({
        message: "Invalid post or report category ID provided.",
      });
    }

    // Validate the reported post
    const reportedPost = await Post.findById(postId);
    if (!reportedPost) {
      return res.status(404).json({ message: "Reported post not found." });
    }

    // Check if the user is reporting their own post
    if (reportedPost.user_id.toString() === reportingUserId.toString()) {
      return res.status(400).json({ message: "You cannot report your own post." });
    }
    
    // Check if the post has already been reported by the reporting user
    if (reportedPost.reports.some(report => report.reported_by.toString() === reportingUserId.toString())) {
      return res.status(200).json({ message: "You have already reported this post." });
    }

    // Validate the report category
    const reportCategory = await ReportCategory.findById(selectedCategory);
    if (!reportCategory) {
      return res.status(404).json({ message: "Invalid report category." });
    }

    // Add the report to the post
    reportedPost.reports.push({
      reported_by: reportingUserId,
      reason: reportCategory.report_title,
    });

    // Check if the post has been reported by 5 or more users and block if needed
    if (reportedPost.reports.length >= 5) {
      reportedPost.isBlocked = true;
      reportedPost.suspension_reason = `Blocked due to multiple reports: ${reportCategory.name}`;
    }

    // Save the updated post document
    await reportedPost.save();

    return res.status(200).json({ message: "Post reported successfully." });
  } catch (error) {
    console.error("Error reporting post:", error.message);
    return res
      .status(500)
      .json({ message: "An error occurred while reporting the post." });
  }
};
  

module.exports = {
    reportUser,
    reportPost
};

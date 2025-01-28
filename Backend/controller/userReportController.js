const ReportUser = require('../models/reportUserSchema');
const User = require('../models/userSchema');
const ReportCategory = require('../models/reportCategorySchema');
const mongoose = require('mongoose');

// Controller to report a user
const reportUser = async (req, res) => {
    try {
      const { reportedUserId, reportCategoryId } = req.body;
      const reportingUserId = req.user?.id;
  
      if (!reportingUserId) {
        return res.status(400).json({ message: "Reporting user is required." });
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
  
      // Validate the report category
      const reportCategory = await ReportCategory.findById(reportCategoryId);
      if (!reportCategory) {
        return res.status(404).json({ message: "Invalid report category." });
      }
  
      // Call the static method to update the report count
      await ReportUser.updateReportCount(
        reportedUserId,
        reportingUserId,
        reportCategoryId || null
      );
  
      // Increment the report_count in the User schema
      reportedUser.reported_count += 1;
  
      // Check if the user should be blocked
      if (reportedUser.reported_count >= 5) {
        reportedUser.is_blocked = true;
      }
  
      // Save the updated user document
      await reportedUser.save();
  
      return res
        .status(200)
        .json({ message: "User reported successfully." });
    } catch (error) {
      console.error("Error reporting user:", error.message);
      return res
        .status(500)
        .json({ message: "An error occurred while reporting the user." });
    }
  };
  
  
module.exports = {
  reportUser,
};

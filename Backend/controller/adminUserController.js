const User = require("../models/userSchema");
const Post = require("../models/postSchema");
const moment = require("moment");
const Report = require("../models/reportCategorySchema");
const ReportUser = require("../models/reportUserSchema");

const getUserStats = async (req, res) => {

  try {
    // Get current timestamps
    const now = moment().toDate();
    const thirtyMinutesAgo = moment().subtract(30, "minutes").toDate();
    const oneDayAgo = moment().subtract(1, "days").toDate();
    const sevenDaysAgo = moment().subtract(7, "days").toDate();
    const thirtyDaysAgo = moment().subtract(30, "days").toDate();

    // 🟢 Total Users
    const totalUsers = await User.countDocuments();

    // ✅ Active Users (Used the app in the last 30 mins & Active)
    const activeUsers = await User.countDocuments({
      last_activity: { $gte: thirtyMinutesAgo },
      status: "Active",
    });

    // ⚪ Inactive Users (No activity in last 30 mins but still Active)
    const inactiveUsers = await User.countDocuments({
      last_activity: { $lt: thirtyMinutesAgo },
      status: "Active",
    });

    // 🔴 Blocked Users
    const blockedUsers = await User.countDocuments({ is_blocked: true });

    // 🟠 Reported Users
    const reportedUsers = await User.countDocuments({
      reported_count: { $gt: 0 },
    });

    // 🔥 Blocked/Reported Users
    const blockedAndReportedUsers = await User.countDocuments({
      $or: [{ is_blocked: true }, { reported_count: { $gt: 0 } }],
    });

    // 🆕 New Users (Registered in the last 24 hours)
    const newUsers = await User.countDocuments({
      createdAt: { $gte: oneDayAgo },
    });

    // 🔄 Recently Active Users (Used the app in the last 7 days)
    const recentlyActiveUsers = await User.countDocuments({
      last_activity: { $gte: sevenDaysAgo },
    });

    // 📆 Users who haven't opened the app for 30+ days
    const longInactiveUsers = await User.countDocuments({
      last_activity: { $lt: thirtyDaysAgo },
      status: "Active",
    });

    // 🛑 Users Under Review
    const underReviewUsers = await User.countDocuments({
      status: "Under Review",
    });

    // ⚠️ Suspended Users
    const suspendedUsers = await User.countDocuments({ status: "Suspended" });

    // 🚨 Banned Users
    const bannedUsers = await User.countDocuments({ status: "Banned" });

    // ✅ Return response
    return res.json({
      message: "User dashboard data retrieved successfully.",
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        blockedUsers,
        reportedUsers,
        blockedAndReportedUsers,
        newUsers, // 🆕
        recentlyActiveUsers, // 🔄
        longInactiveUsers, // 📆
        underReviewUsers, // 🛑
        suspendedUsers, // ⚠️
        bannedUsers, // 🚨
      },
    });
  } catch (error) {
    console.error("Error retrieving user stats:", error);
    return res.status(500).json({ message: "Error retrieving user stats" });
  }
};

const updateUserActivity = async (req, res) => {
  try {
    const user = req.user.id;

    if (!user) {
      return res.status(400).json({ message: "User ID missing from request" });
    }

    // Update last_activity timestamp
    const updatedUser = await User.findByIdAndUpdate(
      user,
      {
        last_activity: new Date(),
        $push: {
          login_history: {
            date: new Date(),
            ip_address: req.ip, // Capture user IP
            device: req.headers["user-agent"], // Capture device info
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User activity updated" });
  } catch (error) {
    console.error("Error updating user activity:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// get all users

getAllUsers = async (req, res) => {
  try {
    // Fetch all users excluding those with the 'admin' role
    const allUsers = await User.find({ role: { $ne: "admin" } }) // Exclude 'admin' role
      .sort({ name: 1 })
      .lean();

    const userData = allUsers.map((user, index) => ({
      userId: user._id,
      s_n: index + 1,
      name: user.name,
      email: user.email,
      age: user.age,
      profile_image: user.profile_image,
      location: user.location,
      role: user.role,
      destination_country: user.destination_country,
      last_login: user.last_login
        ? moment(user.last_login).format("MMMM Do YYYY, h:mm:ss a")
        : "Not logged in",
      status: user.status,
      created_at: moment(user.date_created).format("MMMM Do YYYY, h:mm:ss a"), // Format created_at (date_created) to be more user-friendly
    }));

    res.status(200).json({
      message: "All users retrieved successfully.",
      data: userData,
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({
      message: "An error occurred while fetching all users.",
      error,
    });
  }
};

// Function to fetch user details for the dashboard
const getUserDashboard = async (req, res) => {
  try {
    // Fetch users who have 3 or more reports
    const users = await User.find(
      { reported_count: { $gte: 3 } }, // Fetch users with at least 3 reports
      "_id name email reported_count status createdAt" // Include `_id` (user ID)
    )
      .sort({ createdAt: -1 }) // Sort by most recent
      .lean(); // Convert Mongoose documents to plain objects

    const userDashboardData = await Promise.all(
      users.map(async (user, index) => {
        // Count reported posts for this user
        const reportedPosts = await Post.countDocuments({
          user_id: user._id,
          reported_count: { $gt: 0 },
        });

        return {
          user_id: user._id, // ✅ Include user ID
          s_n: index + 1, // Serial Number
          name: user.name,
          email: user.email,
          reported_count: user.reported_count,
          reported_posts: reportedPosts, // Total reported posts by this user
          blocked_status: user.status === "Blocked" ? "Blocked" : "Active",
          joined: moment(user.createdAt).format("MMMM D, YYYY, h:mm A"), // Format date for frontend
        };
      })
    );

    res.status(200).json({
      message: "User dashboard data retrieved successfully.",
      data: userDashboardData,
    });
  } catch (error) {
    console.error("Error fetching user dashboard data:", error);
    res.status(500).json({
      message: "An error occurred while fetching user dashboard data.",
      error: error.message,
    });
  }
};


// get active user

const getActiveUsers = async (req, res) => {
  try {
    // Define "active" threshold (last 30 minutes)
    const thirtyMinutesAgo = moment().subtract(30, "minutes").toDate();

    // Fetch users who have been active in the last 30 minutes
    const activeUsers = await User.find({
      last_activity: { $gte: thirtyMinutesAgo }, // 🔥 Using last_activity
      status: "Active",
      role: { $ne: "admin" }, // Exclude admins
    })
      .sort({ last_activity: -1 }) // Sort by most recent activity
      .lean(); // Convert to plain objects

    // Prepare response data
    const activeUserData = activeUsers.map((user, index) => ({
      s_n: index + 1,
      name: user.name,
      email: user.email,
      last_activity: user.last_activity, // 🔥 Last app interaction
      status: user.status,
    }));

    res.status(200).json({
      message: "Active users retrieved successfully.",
      data: activeUserData,
    });
  } catch (error) {
    console.error("Error fetching active users:", error);
    res.status(500).json({
      message: "An error occurred while fetching active users.",
      error,
    });
  }
};

const getInactiveUsers = async (req, res) => {
  try {
    // Define "inactive" threshold (30+ minutes ago)
    const thirtyMinutesAgo = moment().subtract(30, "minutes").toDate();

    console.log("🔹 Checking inactive users since:", thirtyMinutesAgo);

    // Find users inactive for 30+ mins
    const inactiveUsers = await User.find({
      last_activity: { $exists: true, $lte: thirtyMinutesAgo }, // 🔥 Using last_activity
      is_blocked: false,
      role: { $ne: "admin" },
    })
      .sort({ last_activity: 1 }) // Sort by least recent activity
      .lean();

    console.log("✅ Found Inactive Users:", inactiveUsers.length);

    if (inactiveUsers.length === 0) {
      return res.status(200).json({
        message: "No inactive users found.",
        data: [],
      });
    }

    // Prepare response data
    const inactiveUserData = inactiveUsers.map((user, index) => ({
      s_n: index + 1,
      name: user.name,
      email: user.email,
      last_active: user.last_activity,
      joined: user.createdAt, // Account creation date
      status: "Inactive",
    }));

    // 🔥 Update inactive users' status to "Inactive"
    await User.updateMany(
      { _id: { $in: inactiveUsers.map((user) => user._id) } },
      { $set: { status: "Inactive" } }
    );

    res.status(200).json({
      message: "Inactive users retrieved and status updated successfully.",
      data: inactiveUserData,
    });
  } catch (error) {
    console.error("❌ Error fetching inactive users:", error);
    res.status(500).json({
      message: "An error occurred while fetching inactive users.",
      error: error.message,
    });
  }
};

// reported user
const getReportedUsers = async (req, res) => {
  try {
    // Aggregate reports
    const reportData = await ReportUser.aggregate([
      {
        $group: {
          _id: "$user_id", // Group by the user who was reported (reported user)
          reportedCount: { $sum: 1 }, // Count the number of reports for the user
          reportedReasons: { $push: "$report_category" }, // Push all report category references for this user
          reportedBy: { $push: "$reported_by" }, // Push the users who reported this user
        },
      },
      {
        $project: {
          _id: 0,
          reportedTo: "$_id", // Rename the _id field to reportedTo
          reportedCount: 1,
          reportedReasons: 1, // All report category references
          reportedBy: 1, // Users who reported
        },
      },
      {
        $lookup: {
          from: "users", // Join with the User collection to get user details
          localField: "reportedTo",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails", // Unwind userDetails to get the user info
      },
      {
        $lookup: {
          from: "reportcategories", // Lookup the report categories using the correct field
          localField: "reportedReasons", // This refers to the report_category field in the report
          foreignField: "_id", // Reference the _id in ReportCategory
          as: "reportCategoryDetails", // Store the report category details in this field
        },
      },
      {
        $lookup: {
          from: "users", // Lookup the users who reported the reported user
          localField: "reportedBy", // This will be an array of user IDs
          foreignField: "_id", // Match to the _id in the users collection
          as: "reporterDetails", // Store the reporter details in this field
        },
      },
      {
        $project: {
          reportedTo: {
            _id: "$userDetails._id", // User ID
            name: "$userDetails.name", // User Name
            email: "$userDetails.email", // User Email
            profile_image: "$userDetails.profile_image", // Profile Image
            status: {
              $cond: {
                if: "$userDetails.is_blocked", // If the user is blocked
                then: "Blocked",
                else: "$userDetails.status", // Otherwise, keep their current status
              },
            },
          },
          reportedCount: 1,
          reportedReasons: 1, // This will hold the raw report reasons (references)
          reportCategoryDetails: {
            report_title: 1,
            description: 1,
          },
          reportedBy: { // Map each reporter to their required fields (id, name, email, profile_image, status)
            $map: {
              input: "$reporterDetails", // Array of reporters
              as: "reporter",
              in: {
                _id: "$$reporter._id", // Reporter ID
                name: "$$reporter.name", // Reporter Name
                email: "$$reporter.email", // Reporter Email
                profile_image: "$$reporter.profile_image", // Reporter Profile Image
                status: {
                  $cond: {
                    if: "$$reporter.is_blocked", // If the reporter is blocked
                    then: "Blocked",
                    else: "$$reporter.status", // Otherwise, keep their current status
                  },
                },
              },
            },
          },
        },
      },
      {
        $sort: {
          reportedCount: -1, // Sort by most reported users first
        },
      },
    ]);

    // Process the reportData to ensure all reports show reasons correctly
    const finalReport = reportData.map((report) => {
      // Handle cases where there is only one report, and reasons might be missing
      const reasonCount = report.reportedReasons.reduce((acc, reason) => {
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {});

      // If no report categories were found, assume the report reason is a string
      const processedReasons = reasonCount ? reasonCount : { "No reason provided": 1 };

      return {
        reportedTo: report.reportedTo, // Now includes ID, name, email, profile_image, status (Reported user)
        reportedCount: report.reportedCount,
        reportedReasons: processedReasons, // Handle missing reasons
        reportCategoryDetails: report.reportCategoryDetails, // All the report categories for each reason
        reportedBy: report.reportedBy, // Array of reporters with ID, name, email, profile_image, status (Reporter)
      };
    });

    // Send the response with the final report
    res.status(200).json({
      message: "Admin report fetched successfully.",
      data: finalReport,
    });

  } catch (error) {
    console.error("Error generating admin report:", error);
    res.status(500).json({
      message: "An error occurred while generating the admin report.",
      error,
    });
  }
};








// get blocked users
getBlockedUsers = async (req, res) => {
  try {
    // Fetch users who are blocked (is_blocked is true)
    const blockedUsers = await User.find({ is_blocked: true })
      .sort({ name: 1 })
      .lean();

    // Fetch the reports associated with these blocked users
    const blockedUsersWithReports = await Promise.all(
      blockedUsers.map(async (user, index) => {
        // Find reports related to this user
        const reports = await ReportUser.find({ user_id: user._id })
          .populate("report_category", "report_title")
          .lean();

        console.log("Reports for user:", user.name, reports);

        // Get the reason from the most recent report (if it exists)
        const reason =
          reports.length > 0
            ? reports[reports.length - 1].report_category.report_title
            : "No reason provided";

        // Format the created_at date to a readable format
        const formattedDate =
          reports.length > 0
            ? moment(reports[reports.length - 1].created_at).format(
                "YYYY-MM-DD HH:mm:ss"
              )
            : "N/A";

        // Ensure the status is marked as "blocked" for blocked users
        user.status = "blocked";

        return {
          s_n: index + 1,
          name: user.name,
          email: user.email,
          reason: reason,
          age: user.age,
          profile_image: user.profile_image,
          location: user.location,
          role: user.role,
          destination_country: user.destination_country,
          last_login: user.last_login,
          status: user.status,
          is_blocked: user.is_blocked,
          report_created_at: formattedDate,
        };
      })
    );

    res.status(200).json({
      message: "Blocked users retrieved successfully.",
      data: blockedUsersWithReports,
    });
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    res.status(500).json({
      message: "An error occurred while fetching blocked users.",
      error,
    });
  }
};

// Update user's current location
const updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng, country, city } = req.body;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required." });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update the location
    user.current_location = {
      country: country || user.current_location.country,
      city: city || user.current_location.city,
      coordinates: {
        lat,
        lng,
      },
    };

    await user.save();

    res.status(200).json({
      message: "Location updated successfully",
      location: user.current_location,
    });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateReachedDestination = async (req, res) => {
  try {
    // Get user ID from middleware (assuming req.user.id is set)
    const user_id = req.user.id;

    // Get the new state (true/false) from the request body
    const { reached_destination } = req.body;

    // Find the user by ID
    const user = await User.findById(user_id);

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the reached_destination field
    user.reached_destination = reached_destination;

    // Save the updated user document
    await user.save();

    // Send a success response
    return res
      .status(200)
      .json({ message: "Reached destination updated successfully", user });
  } catch (error) {
    console.error("Error updating reached destination:", error);
    return res.status(500).json({ message: "Server error, try again later" });
  }
};

// manage user status
// Utility function to send email
const sendEmail = async (email, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,  // Set your email environment variable
        pass: process.env.EMAIL_PASSWORD,  // Set your email password environment variable
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,  // Set the sender's email
      to: email,
      subject: subject,
      text: message,
    });

    console.log("Email sent successfully to", email);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};


// Controller to block/suspend/delete user
const manageUserStatus = async (req, res) => {
  try {
    const { userId, action, reason, duration } = req.body; // Action (block, suspend, delete), duration, and reason
    const validActions = ['block', 'suspend', 'delete'];
    const validDurations = ['1w', '1m', '6m', 'permanent'];

    // Validate action and duration
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: "Invalid action." });
    }

    if (!validDurations.includes(duration)) {
      return res.status(400).json({ message: "Invalid duration." });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let updatedStatus;
    let unblockDate = null;

    // Calculate unblock date based on duration
    if (duration === '1w') {
      unblockDate = moment().add(1, 'weeks').toDate();
    } else if (duration === '1m') {
      unblockDate = moment().add(1, 'months').toDate();
    } else if (duration === '6m') {
      unblockDate = moment().add(6, 'months').toDate();
    } else if (duration === 'permanent') {
      unblockDate = null; // Permanent suspension means no unblock
    }

    // Update user status and apply appropriate action
    if (action === 'block') {
      updatedStatus = 'Blocked';
      await User.findByIdAndUpdate(userId, { is_blocked: true, block_reason: reason, unblock_date: unblockDate });
    } else if (action === 'suspend') {
      updatedStatus = 'Suspended';
      await User.findByIdAndUpdate(userId, { status: 'Suspended', suspend_reason: reason, suspended_until: unblockDate });
    } else if (action === 'delete') {
      updatedStatus = 'Deleted';
      await User.findByIdAndUpdate(userId, { status: 'Deleted', delete_reason: reason });
    }

    // Send email to user with the reason
    const emailSubject = `Your account has been ${updatedStatus}`;
    const emailMessage = `
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your account status update</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f9;
                  margin: 0;
                  padding: 0;
              }
              .email-container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #ffffff;
                  border-radius: 8px;
                  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
                  padding: 30px;
              }
              h1 {
                  font-size: 22px;
                  color: #333333;
              }
              p {
                  font-size: 16px;
                  color: #555555;
                  line-height: 1.6;
              }
              .email-footer {
                  margin-top: 40px;
                  text-align: center;
              }
              .footer-logo {
                  font-size: 24px;
                  font-weight: bold;
              }
              .footer-logo span {
                  color: #4F46E5; /* Global color */
              }
              .footer-logo .black {
                  color: #000000; /* Connect color */
              }
              .email-footer p {
                  color: #888888;
                  font-size: 14px;
              }
          </style>
      </head>
      <body>

          <div class="email-container">
              <h1>Your account status has been updated</h1>

              <p>Dear <strong>${user.name}</strong>,</p>

              <p>Your account has been <strong>${updatedStatus}</strong> due to the following reason:</p>

              <blockquote style="background-color: #f9f9f9; padding: 10px; border-left: 5px solid #4F46E5; font-style: italic; margin-top: 20px;">
                  ${reason}
              </blockquote>

              <p>If you have any questions, please contact support.</p>

              <div class="email-footer">
                  <div class="footer-logo">
                      <span>Global</span><span class="black">Connect</span>
                  </div>
                  <p>&copy; 2025 GlobalConnect. All rights reserved.</p>
              </div>
          </div>

      </body>
      </html>
    `;

    await sendEmail(user.email, emailSubject, emailMessage);

    return res.status(200).json({
      message: `User has been ${updatedStatus} successfully.`,
      data: user,
    });
  } catch (error) {
    console.error("Error managing user status:", error);
    return res.status(500).json({ message: "An error occurred while managing user status." });
  }
};

const removeSuspensionOrBlock = async (req, res) => {
  try {
    const { userId, status } = req.body;  // Get status from the request body

    // Validate status input
    if (!['Suspended', 'Blocked'].includes(status)) {
      return res.status(400).json({ message: "Invalid status. It must be 'Suspended' or 'Blocked'." });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let updateData = {};

    // Check if the status is Suspended
    if (status === 'Suspended') {
      // Remove suspension and also unblock if necessary
      updateData = { 
        status: 'Active', 
        suspended_until: null, 
      };

      // If the user is also blocked, unblock them
      if (user.is_blocked) {
        updateData.is_blocked = false;
        updateData.unblock_date = null;
        updateData.block_reason = null;
      }
      
      // Send email to user
      const emailSubject = "Your account suspension has been lifted";
      const emailMessage = `
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your account status update</title>
        </head>
        <body>
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>Your account suspension has been lifted. You can now access your account.</p>
            <p>If you have any questions, please contact support.</p>
        </body>
        </html>
      `;
      await sendEmail(user.email, emailSubject, emailMessage);

    } 
    // Check if the status is Blocked
    else if (status === 'Blocked') {
      // Remove block
      updateData = { 
        is_blocked: false, 
        block_reason: null, 
        unblock_date: null 
      };

      // Send email to user
      const emailSubject = "Your account has been unblocked";
      const emailMessage = `
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your account status update</title>
        </head>
        <body>
            <p>Dear <strong>${user.name}</strong>,</p>
            <p>Your account has been unblocked. You can now access your account.</p>
            <p>If you have any questions, please contact support.</p>
        </body>
        </html>
      `;
      await sendEmail(user.email, emailSubject, emailMessage);
    }

    // Update the user's status (suspension or block removal)
    await User.findByIdAndUpdate(userId, updateData);

    return res.status(200).json({
      message: `User's ${status.toLowerCase()} has been removed successfully.`,
      data: user,
    });
  } catch (error) {
    console.error("Error removing suspension or block:", error);
    return res.status(500).json({ message: "An error occurred while removing suspension or block." });
  }
};




module.exports = {
  getUserDashboard,
  getUserStats,
  getActiveUsers,
  getInactiveUsers,
  getReportedUsers,
  getAllUsers,
  getBlockedUsers,
  updateLocation,
  updateReachedDestination,
  updateUserActivity,
  manageUserStatus,
  removeSuspensionOrBlock
};

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
    const reportData = await Report.aggregate([
      {
        $group: {
          _id: "$reportedTo", // Group by the user who was reported
          reportedCount: { $sum: 1 }, // Count the number of reports for the user
          reportedReasons: { $push: "$reason" }, // Push all reported reasons for this user
          reportedPosts: { $push: "$reportedPostId" }, // Push all reported post IDs
        },
      },
      {
        $project: {
          _id: 0,
          reportedTo: "$_id", // Rename the _id field to reportedTo
          reportedCount: 1,
          reportedReasons: 1,
          reportedPosts: { $size: { $setUnion: ["$reportedPosts", []] } }, // Remove duplicate reported posts
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
        $unwind: "$userDetails",
      },
      {
        $project: {
          reportedTo: "$userDetails.name", // Replace with the user's name
          reportedCount: 1,
          reportedReasons: 1,
          reportedPosts: 1,
        },
      },
      {
        $sort: {
          reportedCount: -1, // Sort by most reported users first
        },
      },
    ]);

    // Process the reportData to remove redundant reports of the same reason
    const finalReport = reportData.map((report) => {
      // Remove duplicate reasons and count them
      const reasonCount = report.reportedReasons.reduce((acc, reason) => {
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {});

      return {
        reportedTo: report.reportedTo,
        reportedCount: report.reportedCount,
        reportedReasons: reasonCount, // Now contains the count of each reason
        reportedPostCount: report.reportedPosts, // Count of reported posts
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
};

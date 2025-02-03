const User = require("../models/userSchema");
const {Post} = require("../models/postSchema");
const moment = require('moment');
const Report = require('../models/reportCategorySchema');  
const ReportUser = require('../models/reportUserSchema');

const getUserStats = async (req, res) => {
  try {
    // Get current time and calculate 30 minutes ago
    const thirtyMinutesAgo = moment().subtract(30, 'minutes').toDate();

    // Calculate total users
    const totalUsers = await User.countDocuments();

    // Calculate active users (users who logged in in the last 30 minutes and are 'Active')
    const activeUsers = await User.countDocuments({
      last_login: { $gte: thirtyMinutesAgo },
      status: "Active",
    });

    // Calculate inactive users (users who haven't logged in in the last 30 minutes but are 'Active')
    const inactiveUsers = await User.countDocuments({
      last_login: { $lt: thirtyMinutesAgo },
      status: "Active",
    });

    // Calculate blocked users (users with status 'Blocked')
    const blockedUsers = await User.countDocuments({
      status: "Blocked",
    });

    // Return the user stats as a response
    return res.json({
      message: "User dashboard data retrieved successfully.",
      data: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      blockedUsers
     } 

    });
  } catch (error) {
    console.error("Error retrieving user stats:", error);
    return res.status(500).json({ message: "Error retrieving user stats" });
  }
};


// get all users

getAllUsers = async (req, res) => {
  try {
    // Fetch all users excluding those with the 'admin' role
    const allUsers = await User.find({ role: { $ne: 'admin' } })  // Exclude 'admin' role
      .sort({ name: 1 })  // Sort by name (you can change it to any other field)
      .lean();  // Convert Mongoose documents to plain objects for easier processing

    const userData = allUsers.map((user, index) => ({
      s_n: index + 1,
      name: user.name,
      email: user.email,
      age: user.age,
      profile_image: user.profile_image,
      location: user.location,
      role: user.role,
      destination_country: user.destination_country,
      last_login: user.last_login ? moment(user.last_login).format('MMMM Do YYYY, h:mm:ss a') : 'Not logged in',
      status: user.status,
      created_at: moment(user.date_created).format('MMMM Do YYYY, h:mm:ss a'),  // Format created_at (date_created) to be more user-friendly
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
getUserDashboard = async (req, res) => {
  try {
    // Fetch users with reported_count greater than 3
    const users = await User.find({ reported_count: { $gt: 2 } }, "name email reported_count status")
      .sort({ date_created: -1 }) // Optional: Sort by creation date
      .lean(); // Convert Mongoose documents to plain objects for easier processing

    const userDashboardData = await Promise.all(
      users.map(async (user, index) => {
        const reportedPosts = await Post.countDocuments({
          user_id: user._id,
          reported_count: { $gt: 0 },
        });

        return {
          s_n: index + 1,
          name: user.name,
          email: user.email,
          blocked_count: user.status === "Blocked" ? 1 : 0,
          reported_posts: reportedPosts,
          reported_count: user.reported_count
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
      error,
    });
  }
};


// get active user

getActiveUsers = async (req, res) => {
  try {
    // Get the current time and subtract 30 minutes to define the "active" window
    const thirtyMinutesAgo = moment().subtract(30, 'minutes').toDate();

    // Fetch active users (users who logged in within the last 30 minutes and are not admins)
    const activeUsers = await User.find({
      last_login: { $gte: thirtyMinutesAgo },
      status: 'Active',
      role: { $ne: 'admin' },  // Exclude users with the role 'admin'
    })
    .sort({ last_login: -1 }) // Sort by last login date (most recent first)
    .lean(); // Convert Mongoose documents to plain objects for easier processing

    const activeUserData = activeUsers.map((user, index) => ({
      s_n: index + 1,
      name: user.name,
      email: user.email,
      last_login: user.last_login,
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
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    console.log("🔹 Current Time:", new Date());
    console.log("🔹 Fetching users inactive since:", thirtyMinutesAgo);

    // Find users based only on `last_login` (ignore status)
    const inactiveUsers = await User.find({
      last_login: { $exists: true, $lte: thirtyMinutesAgo }, // Users inactive for 30+ mins
      is_blocked: false,
      role: { $ne: "admin" },
    })
      .sort({ last_login: 1 })
      .lean();

    console.log("✅ Found Inactive Users:", inactiveUsers.length);

    if (inactiveUsers.length === 0) {
      return res.status(200).json({ message: "No inactive users found.", data: [] });
    }

    const inactiveUserData = inactiveUsers.map((user, index) => ({
      s_n: index + 1,
      name: user.name,
      email: user.email,
      last_logged_in: user.last_login,
      joined: user.date_created,
      status: "Inactive",
    }));

    // Update inactive users' status to "Inactive"
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
    res.status(500).json({ message: "An error occurred.", error: error.message });
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
          reportedPosts: { $push: "$reportedPostId" } // Push all reported post IDs
        }
      },
      {
        $project: {
          _id: 0,
          reportedTo: "$_id", // Rename the _id field to reportedTo
          reportedCount: 1,
          reportedReasons: 1,
          reportedPosts: { $size: { $setUnion: ["$reportedPosts", []] } }, // Remove duplicate reported posts
        }
      },
      {
        $lookup: {
          from: 'users', // Join with the User collection to get user details
          localField: 'reportedTo',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $project: {
          reportedTo: "$userDetails.name", // Replace with the user's name
          reportedCount: 1,
          reportedReasons: 1,
          reportedPosts: 1
        }
      },
      {
        $sort: {
          reportedCount: -1 // Sort by most reported users first
        }
      }
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
          .populate('report_category', 'report_title')  
          .lean();

        
        console.log("Reports for user:", user.name, reports);

        // Get the reason from the most recent report (if it exists)
        const reason = reports.length > 0 ? reports[reports.length - 1].report_category.report_title : "No reason provided";

        // Format the created_at date to a readable format
        const formattedDate = reports.length > 0 ? moment(reports[reports.length - 1].created_at).format("YYYY-MM-DD HH:mm:ss") : "N/A";

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
      return res.status(400).json({ message: "Latitude and longitude are required." });
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

    res.status(200).json({ message: "Location updated successfully", location: user.current_location });
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
    return res.status(200).json({ message: "Reached destination updated successfully", user });
  } catch (error) {
    console.error("Error updating reached destination:", error);
    return res.status(500).json({ message: "Server error, try again later" });
  }
};

module.exports = {getUserDashboard, getUserStats, getActiveUsers, getInactiveUsers,getReportedUsers,getAllUsers,getBlockedUsers,updateLocation,updateReachedDestination };

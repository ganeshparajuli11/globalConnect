const User = require("../models/userSchema");
const Post = require("../models/postSchema");
const moment = require("moment");
const Report = require("../models/reportCategorySchema");
const nodemailer = require("nodemailer");
const ReportUser = require("../models/reportUserSchema");
const ReportPost = require("../models/reportPostSchema");

// Add cleanup job for long-term inactive users
const initializeInactiveUsersCleanup = () => {
  setInterval(async () => {
    try {
      const thirtyDaysAgo = moment().subtract(30, "days").toDate();
      
      await User.updateMany(
        {
          last_activity: { $lt: thirtyDaysAgo },
          status: { $ne: "Banned" },
          is_blocked: false,
          is_deleted: false
        },
        {
          $set: { status: "Long-term Inactive" }
        }
      );
      
      console.log("✅ Updated long-term inactive users status");
    } catch (error) {
      console.error("❌ Error in inactive users cleanup job:", error);
    }
  }, 3600000); // Run every hour
};

// Initialize the cleanup job
initializeInactiveUsersCleanup();

const getUserStats = async (req, res) => {
  try {
    // Get current timestamps
    const now = moment().toDate();
    const thirtyMinutesAgo = moment().subtract(30, "minutes").toDate();
    const oneDayAgo = moment().subtract(1, "days").toDate();
    const sevenDaysAgo = moment().subtract(7, "days").toDate();
    const thirtyDaysAgo = moment().subtract(30, "days").toDate();

    // 1. User Statistics
    const userStats = {
      totalUsers: await User.countDocuments({ role: { $ne: 'admin' } }),
      activeUsers: await User.countDocuments({
        last_activity: { $gte: thirtyMinutesAgo },
        status: "Active",
        role: { $ne: 'admin' }
      }),
      inactiveUsers: await User.countDocuments({
        last_activity: { $lt: thirtyMinutesAgo },
        status: "Active",
        role: { $ne: 'admin' }
      }),
      blockedUsers: await User.countDocuments({ is_blocked: true }),
      reportedUsers: await User.countDocuments({ reported_count: { $gt: 0 } }),
      newUsers: await User.countDocuments({
        createdAt: { $gte: oneDayAgo },
        role: { $ne: 'admin' }
      }),
      recentlyActiveUsers: await User.countDocuments({
        last_activity: { $gte: sevenDaysAgo },
        role: { $ne: 'admin' }
      }),
      longInactiveUsers: await User.countDocuments({
        last_activity: { $lt: thirtyDaysAgo },
        status: "Active",
        role: { $ne: 'admin' }
      })
    };

    // 2. Post Statistics
    const postStats = {
      totalPosts: await Post.countDocuments({ status: { $ne: "Deleted" } }),
      activePosts: await Post.countDocuments({ status: "Active" }),
      reportedPosts: await Post.countDocuments({ 
        'reports.0': { $exists: true },
        status: { $ne: "Deleted" }
      }),
      deletedPosts: await Post.countDocuments({ status: "Deleted" }),
      todayPosts: await Post.countDocuments({
        createdAt: { $gte: oneDayAgo },
        status: { $ne: "Deleted" }
      })
    };

    // 3. Engagement Metrics
    const posts = await Post.find({ 
      status: "Active",
      createdAt: { $gte: thirtyDaysAgo }
    });

    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalViews = 0;

    posts.forEach(post => {
      totalLikes += post.likes?.length || 0;
      totalComments += post.comments?.length || 0;
      totalShares += post.shares || 0;
      totalViews += post.views || 0;
    });

    const postAnalytics = {
      engagement: posts.length ? 
        Math.round(((totalLikes + totalComments + totalShares) / (posts.length * Math.max(totalViews, 1))) * 100) : 0,
      avgLikes: posts.length ? Math.round(totalLikes / posts.length) : 0,
      avgComments: posts.length ? Math.round(totalComments / posts.length) : 0,
      avgShares: posts.length ? Math.round(totalShares / posts.length) : 0
    };

    // 4. Trending Posts
    const trendingPosts = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: "Active"
        }
      },
      {
        $addFields: {
          totalEngagement: {
            $add: [
              { $size: { $ifNull: ["$likes", []] } },
              { $size: { $ifNull: ["$comments", []] } },
              { $ifNull: ["$shares", 0] }
            ]
          }
        }
      },
      {
        $sort: { totalEngagement: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "author"
        }
      },
      {
        $unwind: "$author"
      },
      {
        $project: {
          _id: 1,
          title: { $ifNull: ["$text_content", ""] },
          thumbnail: { $cond: {
            if: { $gt: [{ $size: "$media" }, 0] },
            then: { $arrayElemAt: ["$media.media_path", 0] },
            else: null
          }},
          likes: { $size: { $ifNull: ["$likes", []] } },
          comments: { $size: { $ifNull: ["$comments", []] } },
          shares: { $ifNull: ["$shares", 0] },
          views: { $ifNull: ["$views", 0] },
          author: {
            name: "$author.name",
            profile_image: "$author.profile_image"
          },
          engagement: {
            $multiply: [
              {
                $divide: [
                  "$totalEngagement",
                  { $cond: [{ $eq: ["$views", 0] }, 1, "$views"] }
                ]
              },
              100
            ]
          }
        }
      }
    ]);

    // 5. Content Distribution
    const contentTypes = await Post.aggregate([
      {
        $match: { status: { $ne: "Deleted" } }
      },
      {
        $project: {
          type: {
            $cond: [
              { $gt: [{ $size: "$media" }, 0] },
              {
                $cond: [
                  { $eq: [{ $arrayElemAt: ["$media.media_type", 0] }, "video"] },
                  "video",
                  "image"
                ]
              },
              {
                $cond: [
                  { $gt: [{ $strLenCP: { $ifNull: ["$text_content", ""] } }, 0] },
                  "text",
                  "link"
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]);

    const contentDistribution = {
      text: 0,
      image: 0,
      video: 0,
      link: 0
    };

    const totalContentPosts = contentTypes.reduce((acc, type) => acc + type.count, 0);
    contentTypes.forEach(type => {
      if (contentDistribution.hasOwnProperty(type._id)) {
        contentDistribution[type._id] = Math.round((type.count / totalContentPosts) * 100);
      }
    });

    // 6. Popular Tags
    const popularTags = await Post.aggregate([
      {
        $match: { 
          status: { $ne: "Deleted" },
          tags: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: "$tags"
      },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          name: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    // 7. Recent Reported Users
    const reportedUsersData = await User.aggregate([
      {
        $match: {
          reported_count: { $gt: 0 }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          profile_image: 1,
          reportCount: "$reported_count",
          status: 1
        }
      },
      {
        $sort: { reportCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // 8. Recent Reported Posts
    const reportedPostsData = await Post.aggregate([
      {
        $match: {
          'reports.0': { $exists: true },
          status: { $ne: "Deleted" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "author"
        }
      },
      {
        $unwind: "$author"
      },
      {
        $project: {
          _id: 1,
          title: { $ifNull: ["$text_content", ""] },
          content: "$text_content",
          thumbnail: { 
            $cond: {
              if: { $gt: [{ $size: "$media" }, 0] },
              then: { $arrayElemAt: ["$media.media_path", 0] },
              else: null
            }
          },
          reportCount: { $size: "$reports" },
          author: {
            name: "$author.name",
            profile_image: "$author.profile_image"
          },
          status: 1
        }
      },
      {
        $sort: { reportCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return res.status(200).json({
      message: "Dashboard statistics retrieved successfully",
      data: {
        userStats,
        postStats,
        postAnalytics,
        trendingPosts,
        contentDistribution,
        popularTags,
        reportedUsers: reportedUsersData,
        reportedPosts: reportedPostsData
      }
    });

  } catch (error) {
    console.error("Error retrieving dashboard statistics:", error);
    return res.status(500).json({ 
      message: "Error retrieving dashboard statistics",
      error: error.message 
    });
  }
};

const updateUserActivity = async (req, res) => {
  try {
    const user = req.user.id;

    if (!user) {
      return res.status(400).json({ message: "User ID missing from request" });
    }

    // Update both last_activity and status
    const updatedUser = await User.findByIdAndUpdate(
      user,
      {
        last_activity: new Date(),
        status: "Active", // Ensure status is set to Active when user shows activity
        $push: {
          login_history: {
            date: new Date(),
            ip_address: req.ip,
            device: req.headers["user-agent"],
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User activity updated",
      data: {
        last_activity: updatedUser.last_activity,
        status: updatedUser.status
      }
    });
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
    const thirtyMinutesAgo = moment().subtract(30, "minutes").toDate();

    const activeUsers = await User.find({
      last_activity: { $gte: thirtyMinutesAgo },
      status: "Active",
      role: { $ne: "admin" },
      is_blocked: false,
      is_deleted: false
    })
    .select('_id name email last_activity status profile_image')
    .sort({ last_activity: -1 })
    .lean();

    const activeUserData = activeUsers.map((user, index) => ({
      id: user._id,
      s_n: index + 1,
      name: user.name,
      email: user.email,
      last_activity: moment(user.last_activity).fromNow(),
      status: "Active",
      profile_image: user.profile_image,
      last_active: moment(user.last_activity).format("YYYY-MM-DD HH:mm:ss")
    }));

    res.status(200).json({
      message: "Active users retrieved successfully.",
      count: activeUserData.length,
      data: activeUserData
    });
  } catch (error) {
    console.error("Error fetching active users:", error);
    res.status(500).json({
      message: "An error occurred while fetching active users.",
      error: error.message
    });
  }
};


const getInactiveUsers = async (req, res) => {
  try {
    const thirtyMinutesAgo = moment().subtract(30, "minutes").toDate();
    const thirtyDaysAgo = moment().subtract(30, "days").toDate();

    console.log("🔹 Checking inactive users since:", thirtyMinutesAgo);

    const inactiveUsers = await User.find({
      $or: [
        { last_activity: { $lt: thirtyMinutesAgo } },
        { last_activity: null }
      ],
      is_blocked: false,
      is_deleted: false,
      role: { $ne: "admin" }
    })
    .select('_id name email last_activity status profile_image createdAt')
    .sort({ last_activity: -1 })
    .lean();

    console.log("✅ Found Inactive Users:", inactiveUsers.length);

    const inactiveUserData = inactiveUsers.map((user, index) => ({
      id: user._id,
      s_n: index + 1,
      name: user.name,
      email: user.email,
      last_active: user.last_activity ? moment(user.last_activity).format("YYYY-MM-DD HH:mm:ss") : "Never",
      inactivity_duration: user.last_activity ? moment(user.last_activity).fromNow() : "Never active",
      status: user.last_activity && moment(user.last_activity).isAfter(thirtyDaysAgo) ? "Inactive" : "Long-term Inactive",
      profile_image: user.profile_image,
      joined: moment(user.createdAt).format("YYYY-MM-DD")
    }));

    // Update status for inactive users
    await User.updateMany(
      { _id: { $in: inactiveUsers.map(user => user._id) } },
      { $set: { status: "Inactive" } }
    );

    res.status(200).json({
      message: "Inactive users retrieved and status updated successfully.",
      count: inactiveUserData.length,
      data: inactiveUserData
    });
  } catch (error) {
    console.error("❌ Error fetching inactive users:", error);
    res.status(500).json({
      message: "An error occurred while fetching inactive users.",
      error: error.message
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
        $unwind: "$userDetails"
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


const getBlockedUsers = async (req, res) => {
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
            ? moment(reports[reports.length - 1].created_at).format("YYYY-MM-DD HH:mm:ss")
            : "N/A";

        // Ensure the status is marked as "blocked" for blocked users
        user.status = "blocked";

        return {
          id: user._id, // Added id field
          s_n: index + 1,
          name: user.name,
          email: user.email,
          reason: reason,
          age: user.age,
          profile_image: user.profile_image, // Profile image included
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
      error: error.message,
    });
  }
};


const updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng, country, city } = req.body;

    // Convert lat and lng to numbers and validate them
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ message: "Valid latitude and longitude are required." });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update the current location
    user.current_location = {
      country: country || user.current_location.country,
      city: city || user.current_location.city,
      coordinates: {
        lat: latitude,
        lng: longitude,
      },
    };

    // Automatically set in_destination flag based on the new location vs. destination_country
    if (user.destination_country && country) {
      // Compare the provided country with the user's destination_country case-insensitively
      user.in_destination = (user.destination_country.trim().toLowerCase() === country.trim().toLowerCase());
    } else {
      user.in_destination = false;
    }

    await user.save();

    res.status(200).json({
      message: "Location updated successfully",
      location: user.current_location,
      in_destination: user.in_destination,
    });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({ message: "Server error" });
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
    const { userId, status } = req.body; // Expected status: "Suspended" or "Blocked"

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

    // Create a nodemailer transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
    });

    // Beautiful email template
    const getEmailTemplate = (subject, messageBody) => `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${subject}</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table role="presentation" style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="padding:20px 0; background-color:#f4f4f4;">
                <table align="center" style="width:600px; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding:40px; background-color:#4F46E5;">
                      <h1 style="color:#ffffff; margin:0; font-size:32px;">GlobalConnect</h1>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px 30px; color:#333333; font-size:16px; line-height:24px;">
                      ${messageBody}
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding:20px; background-color:#f4f4f4; font-size:12px; color:#777777;">
                      &copy; ${new Date().getFullYear()} GlobalConnect. All rights reserved.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    if (status === 'Suspended') {
      // Remove suspension: set is_suspended to false and clear suspended_until.
      updateData = { 
        is_suspended: false, 
        suspended_until: null,
      };

      // Also, if the user is blocked, remove block fields.
      if (user.is_blocked) {
        updateData.is_blocked = false;
        updateData.unblock_date = null;
        updateData.block_reason = null;
      }

      const emailSubject = "Your Account Suspension Has Been Lifted";
      const emailBody = `
        <p>Dear <strong>${user.name}</strong>,</p>
        <p>Your account suspension has been lifted, and your account is now active. You can now log in and enjoy our services.</p>
        <p>If you have any questions, please contact our support team.</p>
      `;
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: user.email,
        subject: emailSubject,
        html: getEmailTemplate(emailSubject, emailBody),
      });

    } else if (status === 'Blocked') {
      // Remove block: set is_blocked to false and clear related fields.
      updateData = { 
        is_blocked: false, 
        unblock_date: null, 
        block_reason: null 
      };

      const emailSubject = "Your Account Has Been Unblocked";
      const emailBody = `
        <p>Dear <strong>${user.name}</strong>,</p>
        <p>Your account has been unblocked. You can now access your account without any restrictions.</p>
        <p>If you have any questions, please contact our support team.</p>
      `;
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: user.email,
        subject: emailSubject,
        html: getEmailTemplate(emailSubject, emailBody),
      });
    }

    // Update the user document
    await User.findByIdAndUpdate(userId, updateData, { new: true });

    return res.status(200).json({
      message: `User's ${status.toLowerCase()} has been removed successfully.`,
      data: user,
    });
  } catch (error) {
    console.error("Error removing suspension or block:", error);
    return res.status(500).json({ message: "An error occurred while removing suspension or block." });
  }
};

// Get post statistics for admin dashboard
const getPostStats = async (req, res) => {
  try {
    const now = moment();
    const todayStart = moment().startOf('day');
    const weekAgo = moment().subtract(7, 'days');
    const monthAgo = moment().subtract(30, 'days');

    // Basic post counts
    const totalPosts = await Post.countDocuments({ is_deleted: false });
    const activePosts = await Post.countDocuments({ 
      is_deleted: false, 
      is_blocked: false 
    });
    const reportedPosts = await Post.countDocuments({ 
      reported_count: { $gt: 0 },
      is_deleted: false 
    });
    const deletedPosts = await Post.countDocuments({ is_deleted: true });
    const todayPosts = await Post.countDocuments({
      createdAt: { $gte: todayStart.toDate() },
      is_deleted: false
    });

    // Get engagement metrics
    const posts = await Post.find({ 
      is_deleted: false,
      createdAt: { $gte: monthAgo.toDate() }
    });

    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalViews = 0;

    posts.forEach(post => {
      totalLikes += post.likes?.length || 0;
      totalComments += post.comments?.length || 0;
      totalShares += post.shares || 0;
      totalViews += post.views || 0;
    });

    // Calculate averages
    const avgLikes = posts.length ? Math.round(totalLikes / posts.length) : 0;
    const avgComments = posts.length ? Math.round(totalComments / posts.length) : 0;
    const avgShares = posts.length ? Math.round(totalShares / posts.length) : 0;
    const avgViews = posts.length ? Math.round(totalViews / posts.length) : 0;

    // Calculate engagement rate
    const engagement = posts.length ? 
      Math.round(((totalLikes + totalComments + totalShares) / (posts.length * totalViews)) * 100) : 0;

    // Get trending posts (last 7 days, sorted by engagement)
    const trendingPosts = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: weekAgo.toDate() },
          is_deleted: false
        }
      },
      {
        $addFields: {
          totalEngagement: {
            $add: [
              { $size: { $ifNull: ["$likes", []] } },
              { $size: { $ifNull: ["$comments", []] } },
              { $ifNull: ["$shares", 0] }
            ]
          }
        }
      },
      {
        $sort: { totalEngagement: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          _id: 1,
          title: 1,
          thumbnail: 1,
          likes: { $size: { $ifNull: ["$likes", []] } },
          comments: { $size: { $ifNull: ["$comments", []] } },
          shares: { $ifNull: ["$shares", 0] },
          views: { $ifNull: ["$views", 0] },
          engagement: {
            $multiply: [
              {
                $divide: [
                  "$totalEngagement",
                  { $cond: [{ $eq: ["$views", 0] }, 1, "$views"] }
                ]
              },
              100
            ]
          }
        }
      }
    ]);

    // Get content distribution
    const contentTypes = await Post.aggregate([
      {
        $match: { is_deleted: false }
      },
      {
        $group: {
          _id: "$content_type",
          count: { $sum: 1 }
        }
      }
    ]);

    const contentDistribution = {
      text: 0,
      image: 0,
      video: 0,
      link: 0
    };

    contentTypes.forEach(type => {
      if (contentDistribution.hasOwnProperty(type._id)) {
        contentDistribution[type._id] = Math.round((type.count / totalPosts) * 100);
      }
    });

    // Get popular tags
    const popularTags = await Post.aggregate([
      {
        $match: { 
          is_deleted: false,
          tags: { $exists: true, $ne: [] }
        }
      },
      {
        $unwind: "$tags"
      },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          name: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      message: "Post statistics retrieved successfully",
      data: {
        totalPosts,
        activePosts,
        reportedPosts,
        deletedPosts,
        todayPosts,
        trendingPosts,
        postAnalytics: {
          engagement,
          avgLikes,
          avgComments,
          avgShares,
          avgViews
        },
        popularTags,
        contentDistribution
      }
    });

  } catch (error) {
    console.error("Error fetching post stats:", error);
    res.status(500).json({
      message: "Error retrieving post statistics",
      error: error.message
    });
  }
};

// Get reported posts with details
const getReportedPosts = async (req, res) => {
  try {
    const { timeFilter } = req.query;
    let timeQuery = {};

    // Apply time filter if specified
    if (timeFilter && timeFilter !== 'all') {
      const filterDate = {
        'today': moment().startOf('day'),
        'week': moment().subtract(7, 'days'),
        'month': moment().subtract(30, 'days')
      }[timeFilter];

      if (filterDate) {
        timeQuery = { createdAt: { $gte: filterDate.toDate() } };
      }
    }

    // Aggregate reported posts with detailed information
    const reportedPosts = await ReportPost.aggregate([
      {
        $match: timeQuery
      },
      {
        $group: {
          _id: "$post_id",
          reportCount: { $sum: 1 },
          reports: {
            $push: {
              category: "$report_category",
              reportedBy: "$reported_by",
              createdAt: "$createdAt"
            }
          }
        }
      },
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "_id",
          as: "postDetails"
        }
      },
      {
        $unwind: "$postDetails"
      },
      {
        $lookup: {
          from: "users",
          localField: "postDetails.user_id",
          foreignField: "_id",
          as: "authorDetails"
        }
      },
      {
        $unwind: "$authorDetails"
      },
      {
        $lookup: {
          from: "reportcategories",
          localField: "reports.category",
          foreignField: "_id",
          as: "reportCategories"
        }
      },
      {
        $project: {
          _id: 1,
          title: "$postDetails.title",
          content: "$postDetails.content",
          thumbnail: "$postDetails.thumbnail",
          reportCount: 1,
          author: {
            _id: "$authorDetails._id",
            name: "$authorDetails.name",
            profile_image: "$authorDetails.profile_image"
          },
          status: "$postDetails.status",
          is_blocked: "$postDetails.is_blocked",
          created_at: "$postDetails.createdAt",
          reports: {
            $map: {
              input: "$reports",
              as: "report",
              in: {
                category: {
                  $arrayElemAt: [
                    "$reportCategories",
                    {
                      $indexOfArray: ["$reportCategories._id", "$$report.category"]
                    }
                  ]
                },
                reportedBy: "$$report.reportedBy",
                createdAt: "$$report.createdAt"
              }
            }
          }
        }
      },
      {
        $sort: { reportCount: -1 }
      }
    ]);

    // Enhance the report data with reporter details
    const enhancedReportedPosts = await Promise.all(reportedPosts.map(async (post) => {
      // Get reporter details for each report
      const reportsWithUserDetails = await Promise.all(post.reports.map(async (report) => {
        const reporter = await User.findById(report.reportedBy).select('name profile_image');
        return {
          ...report,
          reportedBy: {
            _id: reporter._id,
            name: reporter.name,
            profile_image: reporter.profile_image
          }
        };
      }));

      return {
        ...post,
        reports: reportsWithUserDetails
      };
    }));

    res.status(200).json({
      message: "Reported posts retrieved successfully",
      data: enhancedReportedPosts
    });

  } catch (error) {
    console.error("Error fetching reported posts:", error);
    res.status(500).json({
      message: "Error retrieving reported posts",
      error: error.message
    });
  }
};

// Handle post moderation actions
const moderatePost = async (req, res) => {
  try {
    const { postId, action, reason } = req.body;
    
    if (!['approve', 'block', 'delete'].includes(action)) {
      return res.status(400).json({ message: "Invalid action specified" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    let updateData = {};
    let emailSubject = "";
    let emailMessage = "";

    switch (action) {
      case 'approve':
        updateData = {
          is_blocked: false,
          status: 'Active',
          moderation_notes: [...(post.moderation_notes || []), {
            action: 'approved',
            reason,
            moderator: req.user.id,
            date: new Date()
          }]
        };
        emailSubject = "Your post has been approved";
        emailMessage = `Your post "${post.title}" has been reviewed and approved.`;
        break;

      case 'block':
        updateData = {
          is_blocked: true,
          status: 'Blocked',
          moderation_notes: [...(post.moderation_notes || []), {
            action: 'blocked',
            reason,
            moderator: req.user.id,
            date: new Date()
          }]
        };
        emailSubject = "Your post has been blocked";
        emailMessage = `Your post "${post.title}" has been blocked due to: ${reason}`;
        break;

      case 'delete':
        updateData = {
          is_deleted: true,
          status: 'Deleted',
          moderation_notes: [...(post.moderation_notes || []), {
            action: 'deleted',
            reason,
            moderator: req.user.id,
            date: new Date()
          }]
        };
        emailSubject = "Your post has been deleted";
        emailMessage = `Your post "${post.title}" has been deleted due to: ${reason}`;
        break;
    }

    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      updateData,
      { new: true }
    );

    // Get post author details
    const author = await User.findById(post.user_id);
    if (author && author.email) {
      // Send email notification
      await sendEmail(author.email, emailSubject, emailMessage);
    }

    res.status(200).json({
      message: `Post has been ${action}ed successfully`,
      data: updatedPost
    });

  } catch (error) {
    console.error(`Error moderating post:`, error);
    res.status(500).json({
      message: "Error moderating post",
      error: error.message
    });
  }
};

// send email to user
const sendEmailToUsers = async (req, res) => {
  try {
    const { subject, message, sendToAll, specificEmails } = req.body;

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // HTML email template
    const emailTemplate = (content) => `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${subject}</title>
          <style>
            body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4F46E5, #3B82F6); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .message { color: #333; font-size: 16px; margin-bottom: 30px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .logo span.global { color: #4F46E5; }
            .logo span.connect { color: #000; }
            .contact { color: #666; font-size: 14px; margin-top: 15px; }
            .social-links { margin-top: 20px; }
            .social-links a { color: #4F46E5; text-decoration: none; margin: 0 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>GlobalConnect</h1>
            </div>
            <div class="content">
              <div class="message">
                ${content}
              </div>
              <div class="footer">
                <div class="logo">
                  <span class="global">Global</span><span class="connect">Connect</span>
                </div>
                <div class="contact">
                  <p>Need assistance? Contact us:</p>
                  <p>Email: support@globalconnect.com</p>
                  <p>Phone: +1 (555) 123-4567</p>
                </div>
                <div class="social-links">
                  <a href="#">Facebook</a>
                  <a href="#">Twitter</a>
                  <a href="#">LinkedIn</a>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    let recipients = [];

    if (sendToAll) {
      // Get all user emails if sending to everyone
      const users = await User.find({ role: { $ne: 'admin' } }).select('email');
      recipients = users.map(user => user.email);
    } else {
      // Use specific emails provided
      recipients = specificEmails.split(',').map(email => email.trim());
    }

    // Validate recipients
    if (recipients.length === 0) {
      return res.status(400).json({ message: "No valid recipients found" });
    }

    // Send emails
    const mailOptions = {
      from: process.env.EMAIL,
      bcc: recipients, // Use BCC for privacy
      subject: subject,
      html: emailTemplate(message)
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: `Email sent successfully to ${recipients.length} recipient(s)`,
      recipientCount: recipients.length
    });

  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      message: "Failed to send email",
      error: error.message
    });
  }
};

// Search users by name or email
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(200).json({
        message: "Please provide a search query",
        data: []
      });
    }

    // Search users by name or email, excluding admins
    const users = await User.find({
      role: { $ne: 'admin' },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name email profile_image')
    .limit(10) // Limit results for better performance
    .lean();

    res.status(200).json({
      message: "Users found successfully",
      data: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        profile_image: user.profile_image || null
      }))
    });

  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({
      message: "Failed to search users",
      error: error.message
    });
  }
};

// http://localhost:3000/api/dashboard/users/all


module.exports = {
  getUserDashboard,
  getUserStats,
  getActiveUsers,
  getInactiveUsers,
  getReportedUsers,
  getAllUsers,
  getBlockedUsers,
  updateLocation,
  updateUserActivity,
  manageUserStatus,
  removeSuspensionOrBlock,
  getPostStats,
  getReportedPosts,
  moderatePost,
  sendEmailToUsers,
  searchUsers
};

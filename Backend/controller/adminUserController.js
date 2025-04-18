const User = require("../models/userSchema");
const Post = require("../models/postSchema");
const moment = require("moment");
const Report = require("../models/reportCategorySchema");
const nodemailer = require("nodemailer");
const ReportUser = require("../models/reportUserSchema");
const Comment = require("../models/commentSchema");
const Category = require("../models/categorySchema");
const mongoose = require("mongoose");
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
          thumbnail: {
            $cond: {
              if: { $gt: [{ $size: "$media" }, 0] },
              then: { $arrayElemAt: ["$media.media_path", 0] },
              else: null
            }
          },
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

const getAllUsers = async (req, res) => {
  try {
    // Fetch all non-admin users
    const allUsers = await User.find({ role: { $ne: "admin" } })
      .sort({ name: 1 })
      .lean();

    // Map them into a cleaner structure
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
      status: user.status, // Could be "Active", "Inactive", etc.
      is_blocked: user.is_blocked,
      is_suspended: user.is_suspended,
      is_deleted: user.is_deleted,
      created_at: user.date_created
        ? moment(user.date_created).format("MMMM Do YYYY, h:mm:ss a")
        : null,
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


const getActiveUsers = async (req, res) => {
  try {
    // Active means: has done something within the last 30 minutes,
    // status is "Active", not blocked, not deleted, not admin.
    const thirtyMinutesAgo = moment().subtract(30, "minutes").toDate();

    const activeUsers = await User.find({
      last_activity: { $gte: thirtyMinutesAgo },
      status: "Active",
      role: { $ne: "admin" },
      is_blocked: false,
      is_deleted: false,
      // possibly is_suspended: false if you want to exclude suspended as well
    })
      .select("_id name email last_activity status profile_image is_blocked is_suspended is_deleted")
      .sort({ last_activity: -1 })
      .lean();

    const activeUserData = activeUsers.map((user, index) => ({
      id: user._id,
      s_n: index + 1,
      name: user.name,
      email: user.email,
      last_activity: moment(user.last_activity).fromNow(),
      // Forced 'Active' or from user.status:
      status: user.status,
      profile_image: user.profile_image,
      last_active: moment(user.last_activity).format("YYYY-MM-DD HH:mm:ss"),
      is_blocked: user.is_blocked,
      is_suspended: user.is_suspended,
      is_deleted: user.is_deleted,
    }));

    res.status(200).json({
      message: "Active users retrieved successfully.",
      count: activeUserData.length,
      data: activeUserData,
    });
  } catch (error) {
    console.error("Error fetching active users:", error);
    res.status(500).json({
      message: "An error occurred while fetching active users.",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------------
// 3) getInactiveUsers
// ---------------------------------------------------------------------
const getInactiveUsers = async (req, res) => {
  try {
    const thirtyMinutesAgo = moment().subtract(30, "minutes").toDate();
    const thirtyDaysAgo = moment().subtract(30, "days").toDate();

    console.log("🔹 Checking inactive users since:", thirtyMinutesAgo);

    // Inactive means last_activity older than 30 minutes or null,
    // not blocked, not deleted, not admin
    const inactiveUsers = await User.find({
      $or: [{ last_activity: { $lt: thirtyMinutesAgo } }, { last_activity: null }],
      is_blocked: false,
      is_deleted: false,
      role: { $ne: "admin" },
      // possibly is_suspended: false if you want them excluded from 'inactive' logic
    })
      .select("_id name email last_activity status profile_image createdAt is_blocked is_suspended is_deleted")
      .sort({ last_activity: -1 })
      .lean();

    console.log("✅ Found Inactive Users:", inactiveUsers.length);

    const inactiveUserData = inactiveUsers.map((user, index) => ({
      id: user._id,
      s_n: index + 1,
      name: user.name,
      email: user.email,
      last_active: user.last_activity
        ? moment(user.last_activity).format("YYYY-MM-DD HH:mm:ss")
        : "Never",
      inactivity_duration: user.last_activity
        ? moment(user.last_activity).fromNow()
        : "Never active",
      status:
        user.last_activity && moment(user.last_activity).isAfter(thirtyDaysAgo)
          ? "Inactive"
          : "Long-term Inactive",
      profile_image: user.profile_image,
      joined: user.createdAt ? moment(user.createdAt).format("YYYY-MM-DD") : null,
      is_blocked: user.is_blocked,
      is_suspended: user.is_suspended,
      is_deleted: user.is_deleted,
    }));

    // Optionally: Update status field to "Inactive" in the DB
    await User.updateMany(
      { _id: { $in: inactiveUsers.map((u) => u._id) } },
      { $set: { status: "Inactive" } }
    );

    res.status(200).json({
      message: "Inactive users retrieved and status updated successfully.",
      count: inactiveUserData.length,
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

// ---------------------------------------------------------------------
// 4) getReportedUsers
//    (already includes logic to show 'Blocked' status if user.is_blocked)
// ---------------------------------------------------------------------
const getReportedUsers = async (req, res) => {
  try {
    // Aggregation that groups all reports by user, merges with user details.
    const reportData = await ReportUser.aggregate([
      {
        $group: {
          _id: "$user_id",
          reportedCount: { $sum: 1 },
          reportedReasons: { $push: "$report_category" },
          reportedBy: { $push: "$reported_by" },
        },
      },
      {
        $project: {
          _id: 0,
          reportedTo: "$_id",
          reportedCount: 1,
          reportedReasons: 1,
          reportedBy: 1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reportedTo",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $lookup: {
          from: "reportcategories",
          localField: "reportedReasons",
          foreignField: "_id",
          as: "reportCategoryDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reportedBy",
          foreignField: "_id",
          as: "reporterDetails",
        },
      },
      {
        $project: {
          reportedTo: {
            _id: "$userDetails._id",
            name: "$userDetails.name",
            email: "$userDetails.email",
            profile_image: "$userDetails.profile_image",
            // If user is_blocked => Show 'Blocked' else keep userDetails.status
            status: {
              $cond: {
                if: "$userDetails.is_blocked",
                then: "Blocked",
                else: "$userDetails.status",
              },
            },
            is_blocked: "$userDetails.is_blocked",
            is_suspended: "$userDetails.is_suspended",
            is_deleted: "$userDetails.is_deleted",
          },
          reportedCount: 1,
          reportedReasons: 1,
          reportCategoryDetails: 1,
          reportedBy: {
            $map: {
              input: "$reporterDetails",
              as: "reporter",
              in: {
                _id: "$$reporter._id",
                name: "$$reporter.name",
                email: "$$reporter.email",
                profile_image: "$$reporter.profile_image",
                status: {
                  $cond: {
                    if: "$$reporter.is_blocked",
                    then: "Blocked",
                    else: "$$reporter.status",
                  },
                },
                is_blocked: "$$reporter.is_blocked",
                is_suspended: "$$reporter.is_suspended",
                is_deleted: "$$reporter.is_deleted",
              },
            },
          },
        },
      },
      {
        $sort: { reportedCount: -1 },
      },
    ]);

    // Further process the result to gather reason counts, etc.
    const finalReport = reportData.map((report) => {
      // Build a map of reason => count
      const reasonCount = report.reportedReasons.reduce((acc, reason) => {
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {});

      return {
        reportedTo: report.reportedTo,
        reportedCount: report.reportedCount,
        reportedReasons: reasonCount,
        reportCategoryDetails: report.reportCategoryDetails,
        reportedBy: report.reportedBy,
      };
    });

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

// ---------------------------------------------------------------------
// 5) getBlockedUsers
// ---------------------------------------------------------------------
const getBlockedUsers = async (req, res) => {
  try {
    // Find all blocked users
    const blockedUsers = await User.find({ is_blocked: true })
      .sort({ name: 1 })
      .lean();

    // For each blocked user, fetch associated reports
    const blockedUsersWithReports = await Promise.all(
      blockedUsers.map(async (user, index) => {
        const reports = await ReportUser.find({ user_id: user._id })
          .populate("report_category", "report_title")
          .lean();

        // You could get the reason from the last or first report, or combine them
        let reason = "No reason provided";
        let reportTime = "N/A";
        if (reports.length > 0) {
          const lastReport = reports[reports.length - 1];
          if (lastReport?.report_category?.report_title) {
            reason = lastReport.report_category.report_title;
          }
          reportTime = lastReport?.created_at
            ? moment(lastReport.created_at).format("YYYY-MM-DD HH:mm:ss")
            : "N/A";
        }

        // Force user.status to 'blocked'
        const finalStatus = "Blocked";

        return {
          id: user._id,
          s_n: index + 1,
          name: user.name,
          email: user.email,
          reason,
          age: user.age,
          profile_image: user.profile_image,
          location: user.location,
          role: user.role,
          destination_country: user.destination_country,
          last_login: user.last_login
            ? moment(user.last_login).format("YYYY-MM-DD HH:mm:ss")
            : "Never logged in",
          status: finalStatus,
          is_blocked: user.is_blocked,
          is_suspended: user.is_suspended,
          is_deleted: user.is_deleted,
          report_created_at: reportTime,
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

// Get unverified users
const getUnverifiedUsers = async (req, res) => {
  try {
    const { sortBy = 'followers', sortOrder = 'desc', search = '' } = req.query;

    // Build sort object
    const sortObject = {};
    switch (sortBy) {
      case 'followers':
        sortObject.followers = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'posts':
        sortObject.posts_count = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'name':
        sortObject.name = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'date':
        sortObject.createdAt = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sortObject.followers = -1;
    }

    // Build search query
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const unverifiedUsers = await User.find({
      verified: false,
      role: { $ne: "admin" },
      is_deleted: false,
      ...searchQuery
    })
      .select('_id name email profile_image followers posts_count createdAt')
      .sort(sortObject);

    const formattedUsers = unverifiedUsers.map(user => ({
      userId: user._id,
      name: user.name,
      email: user.email,
      profile_image: user.profile_image || "https://via.placeholder.com/40",
      followers_count: user.followers?.length || 0,
      posts_count: user.posts_count || 0,
      createdAt: user.createdAt
    }));

    res.status(200).json({
      success: true,
      message: "Unverified users retrieved successfully",
      data: formattedUsers
    });
  } catch (error) {
    console.error("Error fetching unverified users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unverified users",
      error: error.message
    });
  }
};


// Get verified users
const getVerifiedUsers = async (req, res) => {
  try {
    const { sortBy = 'followers', sortOrder = 'desc', search = '' } = req.query;

    // Build sort object
    const sortObject = {};
    switch (sortBy) {
      case 'followers':
        sortObject.followers = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'posts':
        sortObject.posts_count = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'name':
        sortObject.name = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'date':
        sortObject.createdAt = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sortObject.followers = -1;
    }

    // Build search query
    const searchQuery = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const verifiedUsers = await User.find({
      verified: true,
      role: { $ne: "admin" },
      is_deleted: false,
      ...searchQuery
    })
      .select('_id name email profile_image followers posts_count createdAt')
      .sort(sortObject);

    const formattedUsers = verifiedUsers.map(user => ({
      userId: user._id,
      name: user.name,
      email: user.email,
      profile_image: user.profile_image || "https://via.placeholder.com/40",
      followers_count: user.followers?.length || 0,
      posts_count: user.posts_count || 0,
      createdAt: user.createdAt
    }));

    res.status(200).json({
      success: true,
      message: "Verified users retrieved successfully",
      data: formattedUsers
    });
  } catch (error) {
    console.error("Error fetching verified users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch verified users",
      error: error.message
    });
  }
};

// Update user verification status
const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { verified, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    // Find user and update verification status
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update verification status
    user.verified = verified;
    await user.save();

    // Send email notification to user
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const emailHTML = `
      <html>
        <head>
          <style>
            .container { padding: 20px; font-family: Arial, sans-serif; }
            .header { color: #4F46E5; font-size: 24px; margin-bottom: 20px; }
            .content { line-height: 1.6; color: #333; }
            .reason { background: #f3f4f6; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">Account Verification Update</div>
            <div class="content">
              <p>Dear ${user.name},</p>
              <p>Your account has been verified by GlobalConnect admin team.</p>
              ${reason ? `
                <div class="reason">
                  <strong>Reason for verification:</strong><br/>
                  ${reason}
                </div>
              ` : ''}
              <p>You will now have a verification badge on your profile.</p>
            </div>
            <div class="footer">
              Best regards,<br/>
              The GlobalConnect Team
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: user.email,
      subject: 'Your GlobalConnect Account Has Been Verified',
      html: emailHTML
    });

    res.status(200).json({
      success: true,
      message: "User verification status updated successfully",
      data: {
        userId: user._id,
        name: user.name,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error("Error updating user verification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user verification",
      error: error.message
    });
  }
};

const unverifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body; // Optional reason for unverification

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update verification status to false
    user.verified = false;
    await user.save();

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Compose the email HTML
    const emailHTML = `
      <html>
        <head>
          <style>
            .container { padding: 20px; font-family: Arial, sans-serif; }
            .header { color: #DC2626; font-size: 24px; margin-bottom: 20px; }
            .content { line-height: 1.6; color: #333; }
            .reason { background: #fef2f2; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .footer { margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">Account Unverification Update</div>
            <div class="content">
              <p>Dear ${user.name},</p>
              <p>Your account has been unverified by the GlobalConnect admin team.</p>
              ${reason ? `<div class="reason">
                            <strong>Reason for unverification:</strong><br/>
                            ${reason}
                          </div>` : ""}
              <p>Your verification badge has been removed from your profile.</p>
            </div>
            <div class="footer">
              Best regards,<br/>
              The GlobalConnect Team
            </div>
          </div>
        </body>
      </html>
    `;

    // Send notification email to the user
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: user.email,
      subject: 'Your GlobalConnect Account Has Been Unverified',
      html: emailHTML
    });

    return res.status(200).json({
      success: true,
      message: "User unverification status updated successfully",
      data: {
        userId: user._id,
        name: user.name,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error("Error updating user unverification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user unverification",
      error: error.message
    });
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


const manageUserStatus = async (req, res) => {
  try {
    console.log("Step 1: Extracting data from request body.");
    const {
      userId,
      action,
      reason,
      duration,
      resetReports,
    } = req.body;

    console.log("Step 2: Validating action and duration.");
    const validActions = ["block", "suspend", "delete", "unblock", "unsuspend"];
    const validDurations = ["1w", "1m", "6m", "permanent"];

    if (!validActions.includes(action)) {
      return res.status(400).json({ message: "Invalid action type." });
    }
    if ((action === "block" || action === "suspend") && !validDurations.includes(duration)) {
      return res.status(400).json({ message: "Invalid or missing duration." });
    }

    console.log("Step 3: Finding user by ID:", userId);
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found, returning 404.");
      return res.status(404).json({ message: "User not found." });
    }
    console.log("User found:", user.email);

    const updateFields = {};
    let updatedStatus = "";
    let unblockDate = null;

    // Step 4: If blocking or suspending, calculate the unblock date
    if (["block", "suspend"].includes(action)) {
      console.log("Step 4: Calculating unblock date for block/suspend action.");
      if (duration === "1w") unblockDate = moment().add(1, "weeks").toDate();
      else if (duration === "1m") unblockDate = moment().add(1, "months").toDate();
      else if (duration === "6m") unblockDate = moment().add(6, "months").toDate();
      else if (duration === "permanent") unblockDate = null;
    }

    console.log("Step 5: Building update fields based on action:", action);
    switch (action) {
      case "block":
        updatedStatus = "Blocked";
        updateFields.is_blocked = true;
        updateFields.block_reason = reason || "No reason provided";
        updateFields.unblock_date = unblockDate;
        // Clear suspension if blocking
        updateFields.is_suspended = false;
        updateFields.suspend_reason = null;
        updateFields.suspended_until = null;
        updateFields.status = "Blocked";
        break;

      case "suspend":
        updatedStatus = "Suspended";
        updateFields.is_suspended = true;
        updateFields.suspend_reason = reason || "No reason provided";
        updateFields.suspended_until = unblockDate;
        // Clear block if suspending
        updateFields.is_blocked = false;
        updateFields.block_reason = null;
        updateFields.unblock_date = null;
        updateFields.status = "Suspended";
        break;

      case "unblock":
        updatedStatus = "Active";
        updateFields.is_blocked = false;
        updateFields.block_reason = null;
        updateFields.unblock_date = null;
        updateFields.status = "Active";
        break;

      case "unsuspend":
        updatedStatus = "Active";
        updateFields.is_suspended = false;
        updateFields.suspend_reason = null;
        updateFields.suspended_until = null;
        updateFields.status = "Active";
        break;

        case "delete":
          try {
            // Handle deletion reason from request body. Allow flexibility if sent as deleteReason.
            const deletionReason = req.body.reason || req.body.deleteReason;
            if (!deletionReason || !deletionReason.trim()) {
              return res.status(400).json({ message: "Deletion reason is required." });
            }
        
            updatedStatus = "Deleted";
            console.log("Step 5.1: Deleting user's posts and related data");
        
            // Delete user's related data (posts, comments, reports, interactions, etc.)
            const userPosts = await Post.find({ user_id: userId });
            for (const post of userPosts) {
              // Delete comments for each post
              await Comment.deleteMany({ post_id: post._id });
              // Remove likes referencing this post from all posts
              await Post.updateMany({}, { $pull: { likes: post._id } });
              // Clear embedded reports in the post before deletion
              await Post.updateMany({ _id: post._id }, { $set: { reports: [] } });
            }
            await Post.deleteMany({ user_id: userId });
        
            console.log("Step 5.2: Deleting user's reports and interactions");
            // Delete reports made by or for the user
            await ReportUser.deleteMany({ user_id: userId });
            await ReportUser.deleteMany({ reported_by: userId });
            // Remove this user's reports from posts
            await Post.updateMany(
              { 'reports.reported_by': userId },
              { $pull: { reports: { reported_by: userId } } }
            );
        
            console.log("Step 5.3: Cleaning up user social connections");
            await User.updateMany({ followers: userId }, { $pull: { followers: userId } });
            await User.updateMany({ following: userId }, { $pull: { following: userId } });
            await User.updateMany({ blocked_users: userId }, { $pull: { blocked_users: userId } });
        
            console.log("Step 5.4: Removing user's likes and comments");
            await Post.updateMany({ likes: userId }, { $pull: { likes: userId } });
            await Comment.deleteMany({ user_id: userId });
        
            console.log("Step 5.5: Removing user's preferences and categories");
            await Category.updateMany({ preferred_by: userId }, { $pull: { preferred_by: userId } });
        
            // Save user's email and name before deletion
            const userEmail = user.email;
            const userName = user.name;
        
            // Step 5.6: Compose deletion email
            console.log("Step 5.6: Composing and sending deletion email");
            const emailSubject = "Your GlobalConnect Account Has Been Deleted";
            const emailHTML = `
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                  <title>Account Deletion Notice</title>
                  <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f9; margin: 0; padding: 0; }
                    .email-container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
                    .header { background: linear-gradient(135deg, #4F46E5, #3B82F6); padding: 30px 20px; color: #ffffff; text-align: center; }
                    .content { padding: 30px 25px; color: #333333; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 13px; color: #888; }
                  </style>
                </head>
                <body>
                  <div class="email-container">
                    <div class="header">
                      <h1>Account Deleted</h1>
                    </div>
                    <div class="content">
                      <h2>Hello ${userName},</h2>
                      <p>Your GlobalConnect account has been deleted.</p>
                      <p><strong>Reason:</strong> ${deletionReason}</p>
                      <p>If you believe this was an error, please contact our support team immediately.</p>
                    </div>
                    <div class="footer">
                      <p>&copy; ${new Date().getFullYear()} GlobalConnect. All rights reserved.</p>
                    </div>
                  </div>
                </body>
              </html>
            `;
        
            const transporter = nodemailer.createTransport({
              service: "Gmail",
              auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
              },
            });
        
            await transporter.sendMail({
              from: process.env.EMAIL,
              to: userEmail,
              subject: emailSubject,
              html: emailHTML,
            });
            console.log("Deletion email sent successfully to", userEmail);
        
            // Step 5.7: Finally delete the user
            await User.findByIdAndDelete(userId);
        
            return res.status(200).json({
              message: "User and all associated data deleted successfully.",
              data: {
                userId,
                action: "delete",
                updatedStatus: "Deleted"
              }
            });
        
          } catch (error) {
            console.error("Error in delete case:", error);
            return res.status(500).json({
              message: "Failed to delete user.",
              error: error.message
            });
          }

    }

    if (resetReports === true) {
      console.log("Step 6: Resetting user's report count as requested.");
      updateFields.report_count = 0;
      updateFields.reported_count = 0;
    }

    // Step 7: Apply the updates
    console.log("Step 7: Updating user with new fields:", updateFields);
    await User.findByIdAndUpdate(userId, updateFields, { new: true });

    // Step 8: Prepare the HTML email
    console.log("Step 8: Composing HTML email content.");
    const emailSubject = `Your account has been ${updatedStatus}`;
    const emailHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Account Status Update</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f9;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          }
          .header {
            background: linear-gradient(135deg, #4F46E5, #3B82F6);
            padding: 30px 20px;
            color: #ffffff;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 25px;
            color: #333333;
          }
          .content h2 {
            margin-top: 0;
            color: #4F46E5;
          }
          .reason-box {
            background: #f1f5ff;
            border-left: 5px solid #4F46E5;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
          }
          .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 13px;
            color: #888;
          }
          .logo {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .logo span:first-child {
            color: #4F46E5;
          }
          .logo span:last-child {
            color: #000;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Account ${updatedStatus}</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.name},</h2>
            <p>Your account has been <strong>${updatedStatus}</strong>${reason ? ` for the following reason:` : "."
      }</p>
            ${reason
        ? `<div class="reason-box">${reason}</div>`
        : ""
      }
            ${unblockDate
        ? `<p>This action is effective until <strong>${moment(unblockDate).format("MMMM D, YYYY")}</strong>.</p>`
        : ""
      }
            <p>If you believe this was a mistake or have any questions, feel free to reach out to our support team.</p>
            <p>Thank you,<br/>The <strong>GlobalConnect</strong> Team</p>
          </div>
          <div class="footer">
            <div class="logo">
              <span>Global</span><span>Connect</span>
            </div>
            <p>&copy; ${new Date().getFullYear()} GlobalConnect. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Step 9: Configure transporter and send email
    console.log("Step 9: Configuring Nodemailer transporter.");
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    console.log("Step 10: Sending email to:", user.email);
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: user.email,
      subject: emailSubject,
      html: emailHTML,
    });
    console.log("Email sent successfully.");

    // Step 11: Respond to the client
    console.log("Step 11: Sending success response.");
    return res.status(200).json({
      message: `User has been ${updatedStatus} successfully.`,
      data: {
        userId: user._id,
        action,
        updatedStatus,
        unblockDate,
        resetReports: !!resetReports,
      },
    });
  } catch (error) {
    console.error("Error managing user status:", error);
    return res.status(500).json({
      message: "An error occurred while managing user status.",
      error: error.message,
    });
  }
};


const removeSuspensionOrBlock = async (req, res) => {
  try {
    const { userId, status } = req.body; // "Blocked" or "Suspended"

    if (!["Blocked", "Suspended"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status. Must be 'Blocked' or 'Suspended'." });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Build updated fields
    const updateData = {};

    // If removing "Suspended"
    if (status === "Suspended") {
      updateData.is_suspended = false;
      updateData.suspend_reason = null;
      updateData.suspended_until = null;
      // Optionally set user.status = "Active"
      updateData.status = "Active";

      // If also blocked, remove the block
      if (user.is_blocked) {
        updateData.is_blocked = false;
        updateData.block_reason = null;
        updateData.unblock_date = null;
      }

      // Email user to say suspension is lifted
      const emailSubject = "Your Account Suspension Has Been Lifted";
      const emailHTML = `
        <html>
        <head><meta charset="UTF-8"><title>Suspension Lifted</title></head>
        <body>
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Your account suspension has been lifted. You can now log in again!</p>
          <p>If you have any questions, please contact our support team.</p>
        </body>
        </html>
      `;
      await sendEmail(user.email, emailSubject, emailHTML);

    } else if (status === "Blocked") {
      // If removing block
      updateData.is_blocked = false;
      updateData.block_reason = null;
      updateData.unblock_date = null;
      // Optionally set user.status = "Active"
      updateData.status = "Active";

      // Email user
      const emailSubject = "Your Account Has Been Unblocked";
      const emailHTML = `
        <html>
        <head><meta charset="UTF-8"><title>Unblock Notice</title></head>
        <body>
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Your account has been unblocked. You can now access your account freely.</p>
          <p>If you have any questions, please contact our support team.</p>
        </body>
        </html>
      `;
      await sendEmail(user.email, emailSubject, emailHTML);
    }

    await User.findByIdAndUpdate(userId, updateData, { new: true });

    return res.status(200).json({
      message: `User's ${status.toLowerCase()} has been removed successfully.`,
      data: user,
    });
  } catch (error) {
    console.error("Error removing suspension or block:", error);
    return res.status(500).json({
      message: "An error occurred while removing suspension or block.",
      error: error.message,
    });
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
      bcc: recipients, 
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


const resetReportCount = async (req, res) => {
  try {
    const { type, id } = req.body;

    if (!type || !id) {
      return res.status(400).json({
        message: "Type and ID are required"
      });
    }

    if (!["user", "post"].includes(type)) {
      return res.status(400).json({
        message: "Invalid type. Must be 'user' or 'post'"
      });
    }

    let updatedDoc;
    let message;

    if (type === "user") {
      // Reset user report count
      updatedDoc = await User.findByIdAndUpdate(
        id,
        {
          $set: {
            reported_count: 0,
            report_count: 0 // Update both fields to ensure compatibility
          }
        },
        { new: true }
      );

      if (!updatedDoc) {
        return res.status(404).json({
          message: "User not found"
        });
      }

      // Also clear any associated reports in ReportUser collection
      await ReportUser.deleteMany({ user_id: id });

      message = "User report count has been reset successfully";

    } else {
      // Reset post report count
      updatedDoc = await Post.findByIdAndUpdate(
        id,
        {
          $set: {
            reported_count: 0,
            report_count: 0
          }
        },
        { new: true }
      );

      if (!updatedDoc) {
        return res.status(404).json({
          message: "Post not found"
        });
      }

      // Also clear any associated reports in ReportPost collection
      await ReportPost.deleteMany({ post_id: id });

      message = "Post report count has been reset successfully";
    }

    // Send success response
    res.status(200).json({
      message,
      data: {
        id: updatedDoc._id,
        type,
        newReportCount: 0
      }
    });

  } catch (error) {
    console.error("Error resetting report count:", error);
    res.status(500).json({
      message: "Failed to reset report count",
      error: error.message
    });
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
  updateUserActivity,
  manageUserStatus,
  removeSuspensionOrBlock,
  getPostStats,
  getReportedPosts,
  moderatePost,
  sendEmailToUsers,
  searchUsers,
  resetReportCount,
  verifyUser,
  getUnverifiedUsers,
  getVerifiedUsers,
  unverifyUser
};

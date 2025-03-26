import React, { useState, useEffect } from "react";
import Sidebar from "../sidebar/Sidebar";
import { reactLocalStorage } from "reactjs-localstorage";
import axios from "axios";
import UserBar from "../userpage/UserBar";
import { useNavigate } from "react-router-dom";
import {
  FaSearch, FaBell, FaFilter, FaEllipsisV,
  FaExclamationTriangle, FaUserShield, FaChartBar,
  FaCalendarAlt, FaDownload, FaNewspaper, FaChartLine,
  FaHashtag, FaComments, FaShare, FaHeart, FaEye,
  FaFlag, FaTrash, FaCheck
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState(null);
  const [reportedUsers, setReportedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    blockedUsers: 0,
    reportedUsers: 0,
    newUsers: 0,
    recentlyActiveUsers: 0,
    longInactiveUsers: 0,
    underReviewUsers: 0,
    suspendedUsers: 0,
    bannedUsers: 0
  });
  const [postStats, setPostStats] = useState({
    totalPosts: 0,
    activePosts: 0,
    reportedPosts: 0,
    deletedPosts: 0,
    todayPosts: 0,
    trendingPosts: [],
    postAnalytics: {
      engagement: 0,
      avgLikes: 0,
      avgComments: 0,
      avgShares: 0
    },
    popularTags: [],
    contentDistribution: {
      text: 0,
      image: 0,
      video: 0,
      link: 0
    }
  });
  const [reportedPosts, setReportedPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const API_BASE_URL = 'http://localhost:3000';
  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (accessToken) {
      fetchUserStats().finally(() => {
        setLoading(false);
      });
    }
  }, [accessToken, timeFilter]);

  const fetchUserStats = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/dashboard/userStats`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data && response.data.data) {
        const stats = response.data.data;

        // Set user stats
        setUserStats({
          totalUsers: stats.userStats.totalUsers || 0,
          activeUsers: stats.userStats.activeUsers || 0,
          inactiveUsers: stats.userStats.inactiveUsers || 0,
          blockedUsers: stats.userStats.blockedUsers || 0,
          reportedUsers: stats.userStats.reportedUsers || 0,
          newUsers: stats.userStats.newUsers || 0,
          recentlyActiveUsers: stats.userStats.recentlyActiveUsers || 0,
          longInactiveUsers: stats.userStats.longInactiveUsers || 0,
          underReviewUsers: stats.userStats.underReviewUsers || 0,
          suspendedUsers: stats.userStats.suspendedUsers || 0,
          bannedUsers: stats.userStats.bannedUsers || 0
        });

        // Set post stats
        setPostStats({
          totalPosts: stats.postStats.totalPosts || 0,
          activePosts: stats.postStats.activePosts || 0,
          reportedPosts: stats.postStats.reportedPosts || 0,
          deletedPosts: stats.postStats.deletedPosts || 0,
          todayPosts: stats.postStats.todayPosts || 0,
          trendingPosts: stats.trendingPosts?.map(post => ({
            ...post,
            thumbnail: post.thumbnail || "default-thumbnail.jpg",
            engagement: post.engagement || 0,
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.shares || 0
          })) || [],
          postAnalytics: {
            engagement: stats.postAnalytics?.engagement || 0,
            avgLikes: stats.postAnalytics?.avgLikes || 0,
            avgComments: stats.postAnalytics?.avgComments || 0,
            avgShares: stats.postAnalytics?.avgShares || 0
          },
          popularTags: stats.popularTags || [],
          contentDistribution: stats.contentDistribution || {
            text: 0,
            image: 0,
            video: 0,
            link: 0
          }
        });

        // Set reported users and posts
        setReportedUsers(stats.reportedUsers || []);
        setReportedPosts(stats.reportedPosts?.map(post => ({
          _id: post._id,
          title: post.title,
          content: post.content,
          thumbnail: post.thumbnail || "/default-post.jpg",
          reportCount: post.reportCount,
          author: post.author,
          status: post.status
        })) || []);

        setStats(stats);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch user statistics');
      toast.error(`Error loading dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  const handleExportData = () => {
    const csvContent = reportedUsers.map(user =>
      Object.values(user).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reported-users.csv';
    a.click();
  };

  const filteredUsers = reportedUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
                <FaSearch className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search users or content..."
                  className="bg-transparent border-none focus:outline-none text-sm w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-full hover:bg-gray-100 relative"
                >
                  <FaBell className="text-gray-600" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 border">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">Notifications</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {notifications.map((notif, index) => (
                          <div key={index} className="p-2 hover:bg-gray-50 rounded">
                            <p className="text-sm text-gray-800">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <FaUserShield className="mr-2" />
                Admin Actions
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-4rem)]">
          <UserBar
            stats={userStats}
            loading={loading}
            error={error}
          />

          {/* Post Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {/* Total Posts Card */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 text-sm">Total Posts</p>
                  <h3 className="text-3xl font-bold mt-1">{postStats.totalPosts.toLocaleString()}</h3>
                  <p className="text-sm mt-2">
                    <span className="bg-purple-400/30 px-2 py-1 rounded">
                      +{postStats.todayPosts} today
                    </span>
                  </p>
                </div>
                <FaNewspaper size={24} className="text-white/80" />
              </div>
            </div>

            {/* Engagement Rate Card */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 text-sm">Engagement Rate</p>
                  <h3 className="text-3xl font-bold mt-1">{postStats.postAnalytics.engagement}%</h3>
                  <p className="text-sm mt-2">
                    <span className="bg-blue-400/30 px-2 py-1 rounded">
                      Avg. {postStats.postAnalytics.avgLikes} likes per post
                    </span>
                  </p>
                </div>
                <FaChartLine size={24} className="text-white/80" />
              </div>
            </div>

            {/* Content Distribution Card */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 text-sm">Active Posts</p>
                  <h3 className="text-3xl font-bold mt-1">{postStats.activePosts.toLocaleString()}</h3>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="bg-green-400/30 px-2 py-1 rounded">
                      {postStats.contentDistribution.image}% Images
                    </span>
                    <span className="bg-green-400/30 px-2 py-1 rounded">
                      {postStats.contentDistribution.video}% Videos
                    </span>
                  </div>
                </div>
                <FaHashtag size={24} className="text-white/80" />
              </div>
            </div>

            {/* Reported Posts Card */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 text-sm">Reported Posts</p>
                  <h3 className="text-3xl font-bold mt-1">{postStats.reportedPosts.toLocaleString()}</h3>
                  <p className="text-sm mt-2">
                    <span className="bg-red-400/30 px-2 py-1 rounded">
                      Needs Review
                    </span>
                  </p>
                </div>
                <FaFlag size={24} className="text-white/80" />
              </div>
            </div>
          </div>

          {/* Post Insights Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Trending Posts */}
            <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <FaChartBar className="mr-2 text-blue-500" /> Trending Posts
                </h2>
                <select className="bg-gray-100 border-none rounded-lg px-3 py-2 text-sm">
                  <option>Last 24 Hours</option>
                  <option>Last Week</option>
                  <option>Last Month</option>
                </select>
              </div>
              <div className="space-y-4">
                {postStats.trendingPosts.map((post, index) => (
                  <div
                    key={post._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
                    onClick={() => navigate(`/posts/${post._id}`)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-16 w-16">
                        <img
                          src={`http://localhost:3000${post.thumbnail}` || "https://via.placeholder.com/64"}
                          alt=""
                          className="h-16 w-16 rounded-lg object-cover"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/64";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: post.title }} />
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <FaHeart className="mr-1 text-red-500" size={12} />
                            {post.likes}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <FaComments className="mr-1 text-blue-500" size={12} />
                            {post.comments}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <FaShare className="mr-1 text-green-500" size={12} />
                            {post.shares}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <FaEye className="mr-1 text-purple-500" size={12} />
                            {post.views}
                          </div>
                        </div>
                        <div className="flex items-center mt-2">
                          <img
                            src={`http://localhost:3000/${post.author.profile_image}` || "https://via.placeholder.com/32"}
                            alt={post.author.name}
                            className="h-5 w-5 rounded-full mr-2"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/32";
                            }}
                          />
                          <span className="text-xs text-gray-500">{post.author.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {post.engagement}% Engagement
                      </span>
                    </div>
                  </div>
                ))}
                {postStats.trendingPosts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No trending posts found
                  </div>
                )}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <FaHashtag className="mr-2 text-purple-500" /> Popular Tags
              </h2>
              <div className="space-y-4">
                {postStats.popularTags.map((tag, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">#{tag.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{tag.count} posts</span>
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-purple-500 rounded-full"
                          style={{ width: `${(tag.count / postStats.totalPosts) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reported Content Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Reported Users Section */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="text-red-500 mr-2" />
                    <h2 className="text-xl font-bold text-gray-800">
                      Reported Users Management
                    </h2>
                  </div>

                  <div className="flex items-center space-x-4">
                    <select
                      className="bg-gray-100 border-none rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>

                    <button
                      onClick={handleExportData}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <FaDownload className="mr-2" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Info
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Report Count
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            </div>
                          </td>
                        </tr>
                      ) : reportedUsers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                            No reported users found
                          </td>
                        </tr>
                      ) : (
                        reportedUsers.map((user) => (
                          <tr
                            key={user._id}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleUserClick(user._id)}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={
                                      user.profile_image
                                        ? `${API_BASE_URL}/${user.profile_image}`
                                        : `${API_BASE_URL}/api/avatar?name=${encodeURIComponent(user.name)}`
                                    }
                                    alt={user.name}
                                    onError={(e) => {
                                      e.target.src = `${API_BASE_URL}/api/avatar?name=${encodeURIComponent(user.name)}`;
                                    }}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                Reported {user.reportCount} times
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Blocked' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <button className="text-blue-600 hover:text-blue-900">
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Reported Posts Section */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <FaFlag className="mr-2 text-red-500" /> Reported Posts
                  </h2>
                  <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" onClick={() => navigate('/reported-posts')}>
                    <FaFlag className="mr-2" /> Review All
                  </button>
                </div>

                {reportedPosts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No reported posts found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reportedPosts.map((post) => (
                      <div
                        key={post._id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-all cursor-pointer"
                        onClick={() => navigate(`/posts/${post._id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-4">
                            <img
                              src={`http://localhost:3000${post.thumbnail}` || "https://via.placeholder.com/64"}
                              alt=""
                              className="h-20 w-20 rounded-lg object-cover"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/64";
                              }}
                            />
                            <div>
                              <div
                                className="text-sm font-medium text-gray-900 line-clamp-2 mb-1"
                                dangerouslySetInnerHTML={{ __html: post.title }}
                              />
                              <div
                                className="text-sm text-gray-500 line-clamp-2"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                              />
                              <div className="flex items-center mt-2">
                                <img
                                  src={`http://localhost:3000/${post.author.profile_image}` || "https://via.placeholder.com/32"}
                                  alt={post.author.name}
                                  className="h-5 w-5 rounded-full mr-2"
                                  onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/32";
                                  }}
                                />
                                <span className="text-xs text-gray-500">{post.author.name}</span>
                              </div>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                  {post.reportCount} reports
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs ${post.status === 'Active' ? 'bg-green-100 text-green-800' :
                                    post.status === 'Blocked' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {post.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle approve action
                              }}
                            >
                              <FaCheck size={16} />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle delete action
                              }}
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

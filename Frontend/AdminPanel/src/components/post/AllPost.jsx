import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Sidebar from "../sidebar/Sidebar";
import { toast, ToastContainer } from "react-toastify";
import PostActionModal from "../../assets/postHelper/PostActionModal";

const AllPost = () => {
  // State for posts & pagination
  const [postData, setPostData] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 5;
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });
  // For filtering by status
  const [selectedStatus, setSelectedStatus] = useState(""); // "" means all posts

  // State for aggregated statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    blocked: 0,
    underReview: 0,
    deleted: 0,
  });

  // State for which post's action dropdown is open
  const [openActionId, setOpenActionId] = useState(null);

  // Modal state for action modal
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const navigate = useNavigate();

  // Retrieve access token from local storage on mount
  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
    }
  }, []);

  // Fetch posts (with pagination) when token, page, or selectedStatus changes.
  useEffect(() => {
    if (accessToken) {
      const fetchPosts = async () => {
        try {
          // Build query parameters
          const params = new URLSearchParams({
            page: page,
            limit: limit,
            ...(selectedStatus && { status: selectedStatus }),
            ...(searchTerm && { search: searchTerm }),
            ...(filterType !== "all" && { type: filterType }),
            ...(sortBy && { sort: sortBy }),
            ...(dateRange.from && { from: dateRange.from }),
            ...(dateRange.to && { to: dateRange.to }),
          });

          const url = `http://localhost:3000/api/post/admin/all?${params}`;
          const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          setPostData(response.data.data);
          setTotalCount(response.data.totalCount || 0);
        } catch (error) {
          console.error("Error fetching posts", error);
          toast.error("Failed to fetch posts");
        }
      };

      // Add debounce for search term
      const timeoutId = setTimeout(fetchPosts, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [accessToken, page, selectedStatus, searchTerm, filterType, sortBy, dateRange]);

  // Fetch aggregated post stats (for the top cards)
  useEffect(() => {
    if (accessToken) {
      const fetchStats = async () => {
        try {
          const response = await axios.get(
            "http://localhost:3000/api/post/admin/stats",
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          setStats(response.data);
        } catch (error) {
          console.error("Error fetching post stats", error);
        }
      };
      fetchStats();
    }
  }, [accessToken]);

  // Navigate to post details on row click
  const handlePostClick = (postId) => {
    // Use postId as received (_id or id)
    navigate(`/posts/${postId}`);
  };

  // Return a badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Suspended":
        return "bg-yellow-100 text-yellow-800";
      case "Blocked":
        return "bg-red-100 text-red-800";
      case "Under Review":
        return "bg-blue-100 text-blue-800";
      case "Deleted":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  // Callback for when action is completed
  const handleActionComplete = async () => {
    // Refresh the posts data
    const fetchPosts = async () => {
      try {
        const params = new URLSearchParams({
          page: page,
          limit: limit,
          ...(selectedStatus && { status: selectedStatus }),
          ...(searchTerm && { search: searchTerm }),
          ...(filterType !== "all" && { type: filterType }),
          ...(sortBy && { sort: sortBy }),
          ...(dateRange.from && { from: dateRange.from }),
          ...(dateRange.to && { to: dateRange.to }),
        });

        const url = `http://localhost:3000/api/post/admin/all?${params}`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setPostData(response.data.data);
        setTotalCount(response.data.totalCount || 0);
      } catch (error) {
        console.error("Error fetching posts", error);
        toast.error("Failed to fetch posts");
      }
    };

    await fetchPosts();
    // Also refresh the stats
    const fetchStats = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/post/admin/stats",
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching post stats", error);
      }
    };
    fetchStats();
  };

  // When an admin clicks an action from the dropdown
  const handleActionClick = (e, post) => {
    e.stopPropagation();
    setSelectedPost(post);
    setActionModalVisible(true);
    setOpenActionId(null); // Close the dropdown
  };

  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalCount / limit);

  // A list of statuses for filtering
  const statusOptions = ["Active", "Suspended", "Blocked", "Under Review", "Deleted"];

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <ToastContainer />
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">All Posts</h1>

        {/* Statistics / Sorting Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <button
            onClick={() => { setSelectedStatus(""); setPage(1); }}
            className={`bg-white p-4 shadow rounded text-center ${selectedStatus === "" ? "border-2 border-indigo-500" : ""}`}
          >
            <p className="text-sm text-gray-600">All Posts</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </button>
          <button
            onClick={() => { setSelectedStatus("Active"); setPage(1); }}
            className={`bg-white p-4 shadow rounded text-center ${selectedStatus === "Active" ? "border-2 border-indigo-500" : ""}`}
          >
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-xl font-bold text-green-600">{stats.active}</p>
          </button>
          <button
            onClick={() => { setSelectedStatus("Suspended"); setPage(1); }}
            className={`bg-white p-4 shadow rounded text-center ${selectedStatus === "Suspended" ? "border-2 border-indigo-500" : ""}`}
          >
            <p className="text-sm text-gray-600">Suspended</p>
            <p className="text-xl font-bold text-yellow-600">{stats.suspended}</p>
          </button>
          <button
            onClick={() => { setSelectedStatus("Blocked"); setPage(1); }}
            className={`bg-white p-4 shadow rounded text-center ${selectedStatus === "Blocked" ? "border-2 border-indigo-500" : ""}`}
          >
            <p className="text-sm text-gray-600">Blocked</p>
            <p className="text-xl font-bold text-red-600">{stats.blocked}</p>
          </button>
          <button
            onClick={() => { setSelectedStatus("Under Review"); setPage(1); }}
            className={`bg-white p-4 shadow rounded text-center ${selectedStatus === "Under Review" ? "border-2 border-indigo-500" : ""}`}
          >
            <p className="text-sm text-gray-600">Under Review</p>
            <p className="text-xl font-bold text-blue-600">{stats.underReview}</p>
          </button>
          <button
            onClick={() => { setSelectedStatus("Deleted"); setPage(1); }}
            className={`bg-white p-4 shadow rounded text-center ${selectedStatus === "Deleted" ? "border-2 border-indigo-500" : ""}`}
          >
            <p className="text-sm text-gray-600">Deleted</p>
            <p className="text-xl font-bold text-gray-600">{stats.deleted}</p>
          </button>
        </div>
        {/* Advanced Search & Filters */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search Bar */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search posts by title, content, or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-indigo-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Filter Type */}
            <div className="min-w-[200px]">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="text">Text Posts</option>
                <option value="image">Image Posts</option>
                <option value="video">Video Posts</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="min-w-[200px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mostReported">Most Reported</option>
                <option value="mostLiked">Most Liked</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex gap-2 min-w-[300px]">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:border-indigo-500"
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
                setSortBy("newest");
                setDateRange({ from: "", to: "" });
                setSelectedStatus("");
              }}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 focus:outline-none"
            >
              Clear Filters
            </button>
          </div>
        </div>
        {/* Alternative Sorting Dropdown */}
        <div className="mb-4">
          <label className="mr-2 font-semibold">Sort by status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            className="p-2 border rounded"
          >
            <option value="">All Posts</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {/* Posts Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg relative">
          <table className="w-full text-left border-collapse">
            <thead className="bg-indigo-500 text-white">
              <tr>
                <th className="px-6 py-3">No</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {postData.map((post, index) => {
                const postId = post._id || post.id;
                return (
                  <tr key={postId} className="border-b hover:bg-gray-200">
                    <td
                      onClick={() => handlePostClick(postId)}
                      className="px-6 py-4 cursor-pointer"
                    >
                      {(page - 1) * limit + index + 1}
                    </td>
                    <td
                      onClick={() => handlePostClick(postId)}
                      className="px-6 py-4 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            post.user?.profile_image
                              ? `http://localhost:3000/${post.user.profile_image}`
                              : "https://via.placeholder.com/40"
                          }
                          alt={post.user?.name || "Unknown"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{post.user?.name || "Unknown"}</div>
                          <div className="text-sm text-gray-500">ID: {post.user?._id || "N/A"}</div>
                        </div>
                      </div>
                    </td>
                    <td
                      onClick={() => handlePostClick(postId)}
                      className="px-6 py-4 cursor-pointer"
                    >
                      {post.type}
                    </td>
                    <td
                      onClick={() => handlePostClick(postId)}
                      className="px-6 py-4 cursor-pointer"
                    >
                      <span className={`px-2 py-1 rounded ${getStatusBadgeClass(
                        post.status || "Active"
                      )}`}>
                        {post.status || "Active"}
                      </span>
                    </td>
                    <td
                      onClick={() => handlePostClick(postId)}
                      className="px-6 py-4 cursor-pointer"
                    >
                      {new Date(post.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 relative">
                      {/* Action Button */}
                      <button
                        onClick={(e) => handleActionClick(e, post)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
                      >
                        Manage
                        <svg className="ml-2 -mr-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-end mt-4 items-center">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="mx-4">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* PostActionModal */}
      <PostActionModal
        post={selectedPost}
        isVisible={actionModalVisible}
        setIsVisible={setActionModalVisible}
        onActionComplete={handleActionComplete}
        accessToken={accessToken}
      />
    </div>
  );
};

export default AllPost;

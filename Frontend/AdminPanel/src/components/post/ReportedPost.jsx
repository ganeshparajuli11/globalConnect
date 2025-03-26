import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Sidebar from "../sidebar/Sidebar";
import { toast, ToastContainer } from "react-toastify";

const ReportedPost = () => {
  const [reportedPosts, setReportedPosts] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 5;
  const [totalCount, setTotalCount] = useState(0);
  const [openActionId, setOpenActionId] = useState(null);
  const navigate = useNavigate();

  // Stats for reported posts
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReview: 0,
    resolved: 0,
    blocked: 0
  });

  // Filter state
  const [filterStatus, setFilterStatus] = useState("all"); 

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchReportedPosts();
      fetchReportStats();
    }
  }, [accessToken, page, filterStatus]);

  const fetchReportedPosts = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/post/check/report?page=${page}&limit=${limit}&status=${filterStatus}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setReportedPosts(response.data.data);
      setTotalCount(response.data.totalCount || 0);
    } catch (error) {
      console.error("Error fetching reported posts:", error);
      toast.error("Failed to fetch reported posts");
    }
  };

  const fetchReportStats = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/post/report/stats",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching report stats:", error);
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/posts/${postId}`);
  };

  const handleActionClick = async (action, postId) => {
    try {
      await axios.put(
        `http://localhost:3000/api/post/report/${postId}`,
        { status: action },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      toast.success("Post status updated successfully");
      fetchReportedPosts();
      fetchReportStats();
    } catch (error) {
      console.error("Error updating post status:", error);
      toast.error("Failed to update post status");
    }
    setOpenActionId(null);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <ToastContainer />
      <div className="w-64 bg-white shadow-md">
        <Sidebar />
      </div>

      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6">Reported Posts</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => { setFilterStatus("all"); setPage(1); }}
            className={`bg-white p-4 shadow rounded-lg ${filterStatus === "all" ? "border-2 border-red-500" : ""}`}
          >
            <p className="text-sm text-gray-600">Total Reports</p>
            <p className="text-2xl font-bold text-red-600">{stats.totalReports}</p>
          </button>
          <button
            onClick={() => { setFilterStatus("pending"); setPage(1); }}
            className={`bg-white p-4 shadow rounded-lg ${filterStatus === "pending" ? "border-2 border-yellow-500" : ""}`}
          >
            <p className="text-sm text-gray-600">Pending Review</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</p>
          </button>
          <button
            onClick={() => { setFilterStatus("resolved"); setPage(1); }}
            className={`bg-white p-4 shadow rounded-lg ${filterStatus === "resolved" ? "border-2 border-green-500" : ""}`}
          >
            <p className="text-sm text-gray-600">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          </button>
          <button
            onClick={() => { setFilterStatus("blocked"); setPage(1); }}
            className={`bg-white p-4 shadow rounded-lg ${filterStatus === "blocked" ? "border-2 border-gray-500" : ""}`}
          >
            <p className="text-sm text-gray-600">Blocked</p>
            <p className="text-2xl font-bold text-gray-600">{stats.blocked}</p>
          </button>
        </div>

        {/* Reports Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-red-500 text-white">
              <tr>
                <th className="px-6 py-3 text-left">Post Details</th>
                <th className="px-6 py-3 text-left">Reported By</th>
                <th className="px-6 py-3 text-left">Reason</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportedPosts.map((report) => (
                <tr key={report._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4" onClick={() => handlePostClick(report.post._id)}>
                    <div className="flex items-center space-x-3">
                      <img
                        src={`http://localhost:3000${report.post.thumbnail}`}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/40";
                        }}
                      />
                      <div>
                        <div className="font-medium">{report.post.title}</div>
                        <div className="text-sm text-gray-500">
                          by {report.post.user?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <img
                        src={`http://localhost:3000${report.reportedBy.profile_image}`}
                        alt=""
                        className="h-6 w-6 rounded-full"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/24";
                        }}
                      />
                      <span>{report.reportedBy.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{report.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      report.status === "Resolved"
                        ? "bg-green-100 text-green-800"
                        : report.status === "Blocked"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 relative">
                    <button
                      onClick={() => setOpenActionId(openActionId === report._id ? null : report._id)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {openActionId === report._id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                        <button
                          onClick={() => handleActionClick("Resolved", report._id)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Mark as Resolved
                        </button>
                        <button
                          onClick={() => handleActionClick("Blocked", report._id)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Block Post
                        </button>
                        <button
                          onClick={() => handleActionClick("Pending", report._id)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Mark as Pending
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end mt-4 items-center">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50 mr-2"
          >
            Previous
          </button>
          <span className="mx-4">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportedPost;
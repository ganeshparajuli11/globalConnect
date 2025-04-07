import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Eye,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Undo,
} from 'lucide-react';
import Sidebar from '../sidebar/Sidebar';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { reactLocalStorage } from 'reactjs-localstorage';
import 'react-toastify/dist/ReactToastify.css';

// Suspension Duration Options
const SUSPENSION_DURATIONS = [
  { label: '1 Week', value: 7 },
  { label: '1 Month', value: 30 },
  { label: '3 Months', value: 90 },
  { label: 'Permanent', value: -1 },
];

// Date Range Picker Component with refined UI
const DateRangePicker = ({ setFilters }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const applyDateRange = () => {
    if (startDate && endDate) {
      setFilters((prev) => ({
        ...prev,
        dateRange: { start: new Date(startDate), end: new Date(endDate) },
      }));
    }
  };

  return (
    <div className="flex space-x-2">
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={applyDateRange}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
      >
        Apply
      </button>
    </div>
  );
};

const ReportedPostsAdmin = () => {
  // State Management
  const [reportedPosts, setReportedPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);

  // Filtering States
  const [filters, setFilters] = useState({
    status: 'all',
    searchTerm: '',
    dateRange: null,
  });

  // Modal States
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [selectedSuspensionDuration, setSelectedSuspensionDuration] = useState(null);

  // Loading & Action States
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // API Base URL
  const API_URL = 'http://localhost:3000/api/post/admin/reported';

  // Get access token from storage
  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      toast.error("Please login to continue");
      // Optionally redirect to login page
    }
  }, []);

  // Fetch reported posts using real API
  const fetchReportedPosts = async () => {
    const token = reactLocalStorage.get("access_token");
    try {
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.message === "Reported posts retrieved successfully.") {
        setReportedPosts(response.data.data);
        applyFilters(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching reported posts:", error);
      toast.error("Failed to fetch reported posts");
    }
  };

  useEffect(() => {
    fetchReportedPosts();
  }, []);

  // Advanced Filtering Function
  const applyFilters = useCallback(
    (posts) => {
      let result = posts;

      // Status Filter
      if (filters.status !== 'all') {
        result = result.filter((post) => post.status === filters.status);
      }

      // Search Filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        result = result.filter(
          (post) =>
            (post.text_content &&
              post.text_content.toLowerCase().includes(searchTerm)) ||
            (post.user && post.user.name.toLowerCase().includes(searchTerm)) ||
            post.reports.some((report) =>
              report.reason.toLowerCase().includes(searchTerm)
            )
        );
      }

      // Date Range Filter
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        result = result.filter(
          (post) => new Date(post.createdAt) >= start && new Date(post.createdAt) <= end
        );
      }

      // Sort by Report Count (Descending)
      result.sort((a, b) => b.reportCount - a.reportCount);

      setFilteredPosts(result);
      setCurrentPage(1);
    },
    [filters]
  );

  useEffect(() => {
    applyFilters(reportedPosts);
  }, [filters, reportedPosts, applyFilters]);

  // Pagination Logic
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  // Action Handler (delete or suspend)
  // Updated Action Handler: delete, suspend, block, etc.
  const handlePostAction = async (action) => {
    setIsLoading(true);
    setActionType(action);
    const token = reactLocalStorage.get("access_token");
    try {
      // Build base payload with postId and action.
      let payload = { postId: selectedPost._id, action };

      
      // based on the selected duration (for Permanent, suspended_until is set to null).
      if (action === "suspend") {
        if (!suspensionReason || !selectedSuspensionDuration) {
          toast.error("Please provide a suspension reason and select a duration.");
          setIsLoading(false);
          return;
        }
        const now = new Date();
        payload.reason = suspensionReason;
        payload.suspended_from = now.toISOString();
        if (selectedSuspensionDuration.value === -1) {
          payload.suspended_until = null;
        } else {
          const suspendedUntil = new Date(now.getTime() + selectedSuspensionDuration.value * 24 * 60 * 60 * 1000);
          payload.suspended_until = suspendedUntil.toISOString();
        }
      }

      // Call the API endpoint
      const response = await axios.put(
        "http://localhost:3000/api/post/admin/report/action",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state based on the action performed
      let updatedPosts;
      if (action === "delete") {
        updatedPosts = reportedPosts.filter((post) => post._id !== selectedPost._id);
      } else if (action === "resetReports") {
        updatedPosts = reportedPosts.map((post) =>
          post._id === selectedPost._id
            ? { ...post, reportCount: 0, reports: [] }
            : post
        );
      } else {
        // For actions like "suspend", "unsuspend", "block", "unblock", update the status.
        // You can let the API send back an updatedStatus field in the response or adjust here.
        updatedPosts = reportedPosts.map((post) =>
          post._id === selectedPost._id
            ? { ...post, status: response.data.updatedStatus || post.status }
            : post
        );
      }
      setReportedPosts(updatedPosts);
      applyFilters(updatedPosts);
      toast.success(response.data.message || `Action ${action} completed successfully`);
      setIsDetailsModalOpen(false);
      setIsSuspensionModalOpen(false);
    } catch (error) {
      console.error("Action failed:", error);
      toast.error(error.response?.data?.message || "Action failed");
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  // Updated Reset Report Count Handler using the same API endpoint with action "resetReports"
  const handleResetReportCount = async () => {
    const token = reactLocalStorage.get("access_token");
    try {
      const response = await axios.put(
        "http://localhost:3000/api/post/admin/report/action",
        { postId: selectedPost._id, action: "resetReports" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedPosts = reportedPosts.map((post) =>
        post._id === selectedPost._id
          ? { ...post, reportCount: 0, reports: [] }
          : post
      );
      setReportedPosts(updatedPosts);
      applyFilters(updatedPosts);
      toast.success(response.data.message || "Report count reset successfully");
      setIsDetailsModalOpen(false);
    } catch (error) {
      console.error("Failed to reset report count:", error);
      toast.error(
        error.response?.data?.message || "Failed to reset report count"
      );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ToastContainer />
      {/* Sidebar */}
      <div className="w-64 fixed inset-y-0 bg-white shadow-lg z-30">
        <Sidebar />
      </div>
      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Reported Posts Management</h1>

          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="flex items-center border rounded-lg px-3">
                <Search className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search posts, users, reasons..."
                  value={filters.searchTerm}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, searchTerm: e.target.value }))
                  }
                  className="w-full py-2 focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <button
                onClick={() => setFilters({ status: 'all', searchTerm: '', dateRange: null })}
                className="h-full bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-4 py-2 transition-colors"
              >
                Clear Filters
              </button>
            </div>

            {/* Date Range Picker in a separate row */}
            <div className="mt-4">
              <DateRangePicker setFilters={setFilters} />
            </div>
          </div>

          {/* Reported Posts Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-6 py-3 text-left">Post Details</th>
                  <th className="px-6 py-3 text-left">Reports</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPosts.map((post) => (
                  <tr key={post._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <h3 className="font-semibold">
                          {post.text_content.replace(/<[^>]+>/g, '').slice(0, 50)}...
                        </h3>
                        <p className="text-sm text-gray-500">By {post.user.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <AlertTriangle className="mr-2 text-yellow-500" />
                        {post.reportCount} Reports
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${post.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : post.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setIsDetailsModalOpen(true);
                          }}
                          className="text-blue-500 hover:bg-blue-50 p-2 rounded-full"
                        >
                          <Eye size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div>
              Showing {indexOfFirstPost + 1} to {Math.min(indexOfLastPost, filteredPosts.length)} of {filteredPosts.length} posts
            </div>
            <div className="flex space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= Math.ceil(filteredPosts.length / postsPerPage)}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Post Details Modal */}
        {isDetailsModalOpen && selectedPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Post Details</h2>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle size={24} />
                  </button>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">
                    {selectedPost.text_content.replace(/<[^>]+>/g, '').slice(0, 100)}...
                  </h3>
                  <p className="text-gray-600 mb-4">By {selectedPost.user.name}</p>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedPost.text_content }}
                  />
                </div>
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Report Details</h4>
                  {selectedPost.reports.map((report, index) => (
                    <div key={index} className="bg-gray-100 rounded-lg p-4 mb-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{report.reported_by.name}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(report.reported_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{report.reason}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      setIsSuspensionModalOpen(true);
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                  >
                    <Ban className="mr-2" /> Suspend
                  </button>
                  <button
                    onClick={handleResetReportCount}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                  >
                    <Undo size={20} className="mr-2" /> Reset Count
                  </button>
                  <button
                    onClick={() => handlePostAction('delete')}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                  >
                    <Trash2 className="mr-2" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Suspension Modal */}
        {isSuspensionModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold mb-6">Suspend Post</h2>
              <div className="mb-4">
                <label className="block mb-2 font-medium">Suspension Duration</label>
                <div className="grid grid-cols-2 gap-2">
                  {SUSPENSION_DURATIONS.map((duration) => (
                    <button
                      key={duration.value}
                      onClick={() => setSelectedSuspensionDuration(duration)}
                      className={`py-2 rounded-lg border transition-colors ${selectedSuspensionDuration?.value === duration.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                      {duration.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-medium">Suspension Reason</label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Provide a reason for suspension..."
                  className="w-full border rounded-lg p-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsSuspensionModalOpen(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handlePostAction('suspend')}
                  disabled={!selectedSuspensionDuration || !suspensionReason}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Mail className="mr-2 animate-pulse" />
                      Sending Notification...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2" />
                      Suspend Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportedPostsAdmin;

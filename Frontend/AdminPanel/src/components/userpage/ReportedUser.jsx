import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import { toast, ToastContainer } from "react-toastify";
import {
  FaSearch,
  FaEllipsisV,
  FaUsers,
  FaUserTimes,
  FaUserClock,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from "react-icons/fa";

import Sidebar from "../sidebar/Sidebar";
import UserManagementComponent from "./UserManagementComponent";

const ReportDetailModal = ({ reportItem, onClose }) => {
  // Destructure the reported data for easier use
  const { reportedTo, reportedCount, reportedReasons, reportCategoryDetails, reportedBy } = reportItem;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 overflow-y-auto max-h-full">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold">Report Details</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Reported User Details */}
          <div className="flex items-center space-x-4">
            <img
              src={
                reportedTo.profile_image
                  ? `http://localhost:3000/${reportedTo.profile_image}`
                  : "https://via.placeholder.com/80"
              }
              alt={reportedTo.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <h3 className="text-lg font-bold">{reportedTo.name}</h3>
              <p className="text-sm text-gray-500">{reportedTo.email}</p>
              <p className="text-sm">
                Status:{" "}
                {reportedTo.is_blocked ? (
                  <span className="text-red-600">Blocked</span>
                ) : reportedTo.is_suspended ? (
                  <span className="text-yellow-600">Suspended</span>
                ) : (
                  <span className="text-green-600">{reportedTo.status || "Active"}</span>
                )}
              </p>
            </div>
          </div>

          {/* Report Summary */}
          <div>
            <p className="text-base">
              <span className="font-semibold">Total Reports: </span>{reportedCount}
            </p>
          </div>

          {/* Reported Reasons */}
          <div>
            <h4 className="text-lg font-semibold mb-2">Reported Reasons</h4>
            {reportCategoryDetails && reportCategoryDetails.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {reportCategoryDetails.map((category) => (
                  <li key={category._id}>
                    <span className="font-semibold">{category.report_title}:</span>{" "}
                    {reportedReasons && reportedReasons[category._id] ? reportedReasons[category._id] : 0} report(s)
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No specific reasons provided.</p>
            )}
          </div>

          {/* Reported By */}
          <div>
            <h4 className="text-lg font-semibold mb-2">Reported By</h4>
            {reportedBy && reportedBy.length > 0 ? (
              <div className="space-y-2">
                {reportedBy.map((reporter) => (
                  <div key={reporter._id} className="flex items-center space-x-3">
                    <img
                      src={
                        reporter.profile_image
                          ? `http://localhost:3000/${reporter.profile_image}`
                          : "https://via.placeholder.com/40"
                      }
                      alt={reporter.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{reporter.name}</p>
                      <p className="text-xs text-gray-500">{reporter.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No reporters found.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t p-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ReportedUser = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = "http://localhost:3000/api/dashboard";

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    blockedUsers: 0,
    suspendedUsers: 0,
    reportedUsers: 0,
  });

  // Modal states
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  const navigate = useNavigate();

  // Fetch token
  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
    } else {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [navigate]);

  // Fetch reported users
  const fetchReportedUsers = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/get-all-reported-user`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.data?.data) {
        const data = response.data.data;
        setUserData(data);

        const total = data.length;
        const blockedCount = data.filter((item) => item.reportedTo?.is_blocked).length;
        const suspendedCount = data.filter((item) => item.reportedTo?.is_suspended).length;
        const reportedCount = total;

        setStats({
          totalUsers: total,
          blockedUsers: blockedCount,
          suspendedUsers: suspendedCount,
          reportedUsers: reportedCount,
        });
      }
    } catch (error) {
      console.error("Error fetching reported users:", error);
      toast.error("Failed to fetch reported users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportedUsers();
  }, [accessToken]);

  // Filter reported users by search term
  const filteredUsers = userData.filter((item) => {
    const user = item.reportedTo;
    if (!user) return false;
    return (
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Open detail modal on table row click (except the three-dot action button)
  const handleViewDetails = (reportItem) => {
    setSelectedReport(reportItem);
    setDetailModalVisible(true);
  };

  // Open action modal when clicking the three-dots button
  const handleActionClick = (e, reportItem) => {
    e.stopPropagation();
    // Transform the report item so that the action modal gets a user object 
    // with an expected "userId" property (taken from reportedTo._id)
    const userForManagement = {
      ...reportItem.reportedTo,
      userId: reportItem.reportedTo._id,
    };
    setSelectedUser(userForManagement);
    setActionModalVisible(true);
  };

  return (
    <div className="flex h-screen">
      <ToastContainer />

      {/* Sidebar */}
      <div className="w-64 fixed inset-y-0 bg-white shadow-lg z-30">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="fixed top-0 right-0 left-64 bg-white shadow-sm z-20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-800">Reported Users</h1>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <FaUsers className="text-2xl opacity-80" />
                  <div className="ml-3">
                    <p className="text-sm font-medium opacity-80">Total Reports</p>
                    <p className="text-xl font-semibold">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <FaUserTimes className="text-2xl opacity-80" />
                  <div className="ml-3">
                    <p className="text-sm font-medium opacity-80">Blocked Users</p>
                    <p className="text-xl font-semibold">{stats.blockedUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <FaUserClock className="text-2xl opacity-80" />
                  <div className="ml-3">
                    <p className="text-sm font-medium opacity-80">Suspended Users</p>
                    <p className="text-xl font-semibold">{stats.suspendedUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-2xl opacity-80" />
                  <div className="ml-3">
                    <p className="text-sm font-medium opacity-80">Total Reported</p>
                    <p className="text-xl font-semibold">{stats.reportedUsers}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-44 px-6 pb-6">
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">SN</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Profile</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Report Count</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      </td>
                    </tr>
                  ) : currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-gray-500">
                        No reported users found
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((item, index) => {
                      const user = item.reportedTo || {};
                      return (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleViewDetails(item)}
                        >
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {indexOfFirstUser + index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <img
                                src={
                                  user.profile_image
                                    ? `http://localhost:3000/${user.profile_image}`
                                    : "https://via.placeholder.com/80"
                                }
                                alt={user.name || "User"}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-800">{user.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.email}
                          </td>
                          <td className="px-6 py-4">
                            {user.is_blocked ? (
                              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                                Blocked
                              </span>
                            ) : user.is_suspended ? (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-xs rounded-full">
                                Suspended
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                                {user.status || "Active"}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {item.reportedCount || 0}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => handleActionClick(e, item)}
                              className="text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              <FaEllipsisV />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && filteredUsers.length > 0 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700">
                    Show
                    <select
                      value={usersPerPage}
                      onChange={(e) => {
                        setUsersPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="mx-2 border border-gray-300 rounded px-2 py-1"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    entries
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} entries
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === 1
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <FaChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (number) => (
                        <button
                          key={number}
                          onClick={() => handlePageChange(number)}
                          className={`px-3 py-1 rounded-md ${
                            number === currentPage
                              ? "bg-blue-500 text-white"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {number}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === totalPages
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <FaChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reusable action modal for user actions */}
      {actionModalVisible && selectedUser && (
        <UserManagementComponent
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          fetchUserData={fetchReportedUsers}
          fetchActiveUsers={fetchReportedUsers}
          API_BASE_URL={API_BASE_URL}
          accessToken={accessToken}
          isVisible={actionModalVisible}
          setIsVisible={setActionModalVisible}
        />
      )}

      {/* Report Detail Modal */}
      {detailModalVisible && selectedReport && (
        <ReportDetailModal reportItem={selectedReport} onClose={() => setDetailModalVisible(false)} />
      )}
    </div>
  );
};

export default ReportedUser;

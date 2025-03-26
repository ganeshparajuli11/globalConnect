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
  FaUserLock,
  FaUserMinus,
  FaUndo,
} from "react-icons/fa";

import Sidebar from "../sidebar/Sidebar";

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

  // Detail Modal (to show reported reasons, who reported, etc.)
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Action Side-Drawer
  const [actionModalVisible, setActionModalVisible] = useState(false);

  // Duration/Reason Modal & Confirmation
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);

  // Action handling
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAction, setSelectedAction] = useState(""); 
  const [actionReason, setActionReason] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(() => () => {});

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

        // Example stats calculations:
        const total = data.length;
        const blockedCount = data.filter(
          (item) => item.reportedTo?.is_blocked
        ).length;
        const suspendedCount = data.filter(
          (item) => item.reportedTo?.is_suspended
        ).length;

        // This counts each record in "data" as a reported user.
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

  // Filter data by search term
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

  // ===== Detail Modal
  const handleViewDetails = (reportItem) => {
    setSelectedReport(reportItem);
    setDetailModalVisible(true);
  };

  // ===== Action Modal (3 dots)
  const handleActionClick = (e, reportItem) => {
    e.stopPropagation();
    setSelectedUser(reportItem);
    setActionModalVisible(true);
  };

  const isBlocked = selectedUser?.reportedTo?.is_blocked;
  const isSuspended = selectedUser?.reportedTo?.is_suspended;

  // ===== handleBlockOrSuspend
  // For block/suspend we open reason/duration modal
  // For unblock/unsuspend we do direct confirm
  const handleBlockOrSuspend = (actionType) => {
    setSelectedAction(actionType);
    setActionModalVisible(false);

    if (actionType === "unblock" || actionType === "unsuspend") {
      setConfirmationMessage(
        `Are you sure you want to ${actionType} user ${selectedUser?.reportedTo?.name}?`
      );
      setOnConfirm(() => async () => {
        try {
          await axios.put(
            `${API_BASE_URL}/admin-update-user-status`,
            {
              userId: selectedUser?.reportedTo?._id,
              action: actionType, 
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          toast.success(`User successfully ${actionType}ed`);
          fetchReportedUsers();
        } catch (error) {
          toast.error(error.response?.data?.message || `Failed to ${actionType} user`);
        } finally {
          setConfirmationModalVisible(false);
          setSelectedUser(null);
          setSelectedAction("");
        }
      });
      setConfirmationModalVisible(true);

    } else {
      // block / suspend => reason/duration
      setDurationModalVisible(true);
    }
  };

  // ===== handleSubmitAction
  // Called after the admin picks reason/duration for block/suspend
  const handleSubmitAction = async () => {
    if (!selectedDuration || !actionReason.trim()) {
      toast.error("Please select a duration and enter a reason.");
      return;
    }

    try {
      // "block" or "suspend" are direct from selectedAction
      await axios.put(
        `${API_BASE_URL}/admin-update-user-status`,
        {
          userId: selectedUser?.reportedTo?._id,
          action: selectedAction,
          reason: actionReason,
          duration: selectedDuration,
          resetReports: false
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      toast.success(`User ${selectedAction}ed successfully`);
      fetchReportedUsers();

      setDurationModalVisible(false);
      setSelectedUser(null);
      setSelectedAction("");
      setActionReason("");
      setSelectedDuration("");

    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${selectedAction} user`);
    }
  };

  // ===== handleResetReportCount
  const handleResetReportCount = () => {
    setConfirmationMessage(
      `Are you sure you want to reset report count for user ${selectedUser?.reportedTo?.name}?`
    );
    setOnConfirm(() => async () => {
      try {
        await axios.put(
          `${API_BASE_URL}/reset-report-count`, // Updated endpoint
          {
            type: "user", // Specify type as "user"
            id: selectedUser?.reportedTo?._id // Send the user ID
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        toast.success("Report count reset successfully");
        fetchReportedUsers(); // Refresh the data
        
      } catch (error) {
        console.error('Reset report error:', error.response?.data);
        toast.error(error.response?.data?.message || "Failed to reset report count");
      } finally {
        setConfirmationModalVisible(false);
        setActionModalVisible(false);
        setSelectedUser(null);
      }
    });
    setConfirmationModalVisible(true);
  };

  // ===== handleDelete
  const handleDelete = () => {
    setConfirmationMessage(
      `Are you sure you want to delete user ${selectedUser?.reportedTo?.name}?`
    );
    setOnConfirm(() => async () => {
      try {
        await axios.put(
          `${API_BASE_URL}/admin-update-user-status`,
          {
            userId: selectedUser?.reportedTo?._id,
            action: "delete",
            reason: "User deleted by admin"
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success("User deleted successfully");
        fetchReportedUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete user");
      } finally {
        setConfirmationModalVisible(false);
        setActionModalVisible(false);
        setSelectedUser(null);
      }
    });
    setConfirmationModalVisible(true);
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
            {/* Title & Search */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-800">
                Reported Users
              </h1>
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
                    <p className="text-sm font-medium opacity-80">
                      Total Reports
                    </p>
                    <p className="text-xl font-semibold">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <FaUserTimes className="text-2xl opacity-80" />
                  <div className="ml-3">
                    <p className="text-sm font-medium opacity-80">
                      Blocked Users
                    </p>
                    <p className="text-xl font-semibold">{stats.blockedUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <FaUserClock className="text-2xl opacity-80" />
                  <div className="ml-3">
                    <p className="text-sm font-medium opacity-80">
                      Suspended Users
                    </p>
                    <p className="text-xl font-semibold">
                      {stats.suspendedUsers}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-2xl opacity-80" />
                  <div className="ml-3">
                    <p className="text-sm font-medium opacity-80">
                      Total Reported
                    </p>
                    <p className="text-xl font-semibold">
                      {stats.reportedUsers}
                    </p>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                      SN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                      Profile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                      Report Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                      Actions
                    </th>
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
                            <div className="font-medium text-gray-800">
                              {user.name}
                            </div>
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
                    Showing {indexOfFirstUser + 1} to{" "}
                    {Math.min(indexOfLastUser, filteredUsers.length)} of{" "}
                    {filteredUsers.length} entries
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

      {/* === DETAIL MODAL === */}
      {detailModalVisible && selectedReport && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 md:w-3/4 lg:w-1/2 overflow-y-auto max-h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Reported User Details</h2>
              <button
                className="text-gray-600"
                onClick={() => setDetailModalVisible(false)}
              >
                <FaTimes />
              </button>
            </div>

            {/* Basic Info */}
            <div className="flex items-center space-x-4 mb-4">
              <img
                src={
                  selectedReport.reportedTo?.profile_image
                    ? `http://localhost:3000/${selectedReport.reportedTo.profile_image}`
                    : "https://via.placeholder.com/80"
                }
                alt={selectedReport.reportedTo?.name}
                className="w-24 h-24 rounded-full object-cover"
              />
              <div>
                <h3 className="text-xl font-semibold">
                  {selectedReport.reportedTo?.name}
                </h3>
                <p className="text-gray-600">
                  {selectedReport.reportedTo?.email}
                </p>
                <p className="text-gray-500 text-sm">
                  Status: {selectedReport.reportedTo?.status}
                </p>
              </div>
            </div>

            {/* Report Count */}
            <div className="mb-4">
              <p>
                <span className="font-semibold">Report Count:</span>{" "}
                {selectedReport.reportedCount}
              </p>
            </div>

            {/* Reported Reasons */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Report Reasons:</h4>
              {selectedReport.reportCategoryDetails?.length > 0 ? (
                <ul className="list-disc list-inside">
                  {selectedReport.reportCategoryDetails.map((cat, idx) => (
                    <li key={idx} className="mb-2">
                      <strong>{cat.report_title}:</strong> {cat.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No report reasons found.</p>
              )}
            </div>

            {/* Reported By */}
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Reported By:</h4>
              {selectedReport.reportedBy?.length > 0 ? (
                <ul>
                  {selectedReport.reportedBy.map((reporter, idx) => (
                    <li key={idx} className="flex items-center space-x-2 mb-2">
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
                        <p className="text-sm text-gray-600">{reporter.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No reporters found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === ACTION SIDE-DRAWER === */}
      {actionModalVisible && selectedUser && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setActionModalVisible(false)}
            />
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="w-screen max-w-md">
                <div className="h-full flex flex-col bg-white shadow-xl">
                  <div className="px-4 py-6 bg-gray-50 sm:px-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-900">
                        Manage Reported User: {selectedUser?.reportedTo?.name}
                      </h2>
                      <button
                        onClick={() => setActionModalVisible(false)}
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <FaTimes className="h-6 w-6" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 px-4 py-6 sm:px-6 overflow-y-auto">
                    <div className="space-y-4">
                      {/* Info Card */}
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <img
                          src={
                            selectedUser?.reportedTo?.profile_image
                              ? `http://localhost:3000/${selectedUser.reportedTo.profile_image}`
                              : "https://via.placeholder.com/80"
                          }
                          alt={selectedUser?.reportedTo?.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {selectedUser?.reportedTo?.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {selectedUser?.reportedTo?.email}
                          </p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                            Reported
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Block/Unblock */}
                      {isBlocked ? (
                        <button
                          onClick={() => handleBlockOrSuspend("unblock")}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <FaUndo className="text-green-500 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Unblock User</div>
                              <div className="text-sm text-gray-500">
                                Allow user to re-access the platform
                              </div>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockOrSuspend("block")}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <FaUserLock className="text-red-500 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Block User</div>
                              <div className="text-sm text-gray-500">
                                Prevent user from accessing the platform
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Dynamic Suspend/Unsuspend */}
                      {isSuspended ? (
                        <button
                          onClick={() => handleBlockOrSuspend("unsuspend")}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <FaUndo className="text-green-500 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Unsuspend User</div>
                              <div className="text-sm text-gray-500">
                                Lift suspension from the user
                              </div>
                            </div>
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockOrSuspend("suspend")}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <FaUserClock className="text-yellow-500 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Suspend User</div>
                              <div className="text-sm text-gray-500">
                                Temporarily restrict user access
                              </div>
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Reset Report Count */}
                      <button
                        onClick={handleResetReportCount}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <FaUndo className="text-blue-500 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Reset Report Count</div>
                            <div className="text-sm text-gray-500">
                              Set report count to 0
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Delete User */}
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <FaUserMinus className="text-gray-500 mr-3" />
                          <div className="text-left">
                            <div className="font-medium">Delete User</div>
                            <div className="text-sm text-gray-500">
                              Permanently remove user account
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Duration/Reason Modal */}
      {durationModalVisible && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setDurationModalVisible(false)}
            />
            <div className="absolute inset-x-0 bottom-0 max-w-full flex justify-center">
              <div className="w-full max-w-lg">
                <div className="bg-white rounded-t-xl shadow-xl">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {selectedAction === "block" ? "Block" : "Suspend"} User
                    </h3>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason
                      </label>
                      <textarea
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        placeholder={`Why are you ${selectedAction}ing this user?`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                      />
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: "1w", label: "1 Week" },
                          { value: "1m", label: "1 Month" },
                          { value: "6m", label: "6 Months" },
                          { value: "permanent", label: "Permanent" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className={`flex items-center justify-center px-4 py-2 rounded-lg cursor-pointer border transition-all ${
                              selectedDuration === option.value
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              value={option.value}
                              checked={selectedDuration === option.value}
                              onChange={(e) => setSelectedDuration(e.target.value)}
                              className="hidden"
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleSubmitAction}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => {
                          setDurationModalVisible(false);
                          setActionReason("");
                          setSelectedDuration("");
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModalVisible && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setConfirmationModalVisible(false)}
            />
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm Action
              </h3>
              <p className="text-sm text-gray-500 mb-6 whitespace-pre-line">
                {confirmationMessage}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => onConfirm()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmationModalVisible(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportedUser;

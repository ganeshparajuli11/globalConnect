import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import { toast, ToastContainer } from "react-toastify";
import Sidebar from "../sidebar/Sidebar";
import {
  FaSearch,
  FaEllipsisV,
  FaUserLock,
  FaUserMinus,
  FaUserClock,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaExclamationTriangle,
  FaUndo
} from "react-icons/fa";

const InactiveUser = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Action Modal & Duration/Reason
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);

  // Action logic
  const [selectedAction, setSelectedAction] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");

  // Confirmation Modal
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(() => () => {});

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    reportedUsers: 0
  });

  // API Base URL
  const API_BASE_URL = "http://localhost:3000/api/dashboard";

  // Helper to format relative time
  const getRelativeTime = (date) => {
    if (!date) return "N/A";
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  // 1) Get token
  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      toast.error("Please login to continue");
      navigate("/login");
    } else {
      setAccessToken(token);
    }
  }, [navigate]);

  // 2) Fetch Inactive Users
  const fetchInactiveUsers = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/get-in-active-user`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (
        response.data.message === "Inactive users retrieved and status updated successfully."
      ) {
        setUserData(response.data.data);
        const users = response.data.data;
        setStats({
          totalUsers: users.length,
          activeUsers: users.filter((u) => u.status === "Active").length,
          inactiveUsers: users.filter((u) => u.status === "Inactive").length,
          reportedUsers: users.filter((u) => (u.reported_count || 0) > 0).length
        });
      }
    } catch (error) {
      console.error("Error fetching inactive users:", error);
      toast.error("Failed to fetch inactive users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInactiveUsers();
  }, [accessToken]);

  // 3) Search & Pagination
  const filteredUsers = userData.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 4) Row Click => view user detail
  const handleUserClick = (user) => {
    const id = user.userId || user.id;
    navigate(`/user/${id}`);
  };

  // 5) 3-dot actions => open side-drawer
  const handleActionClick = (e, user) => {
    e.stopPropagation();
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  // 6) Delete user
  const handleDelete = () => {
    setConfirmationMessage(
      `Are you sure you want to delete user ${selectedUser?.name}?`
    );
    setOnConfirm(() => async () => {
      try {
        await axios.put(
          `${API_BASE_URL}/admin-update-user-status`,
          {
            userId: selectedUser?.id,
            action: "delete",
            reason: "User deleted by admin"
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success("User deleted successfully");
        fetchInactiveUsers();
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

  // 7) Dynamic block/unblock, suspend/unsuspend, and reset report count
  const handleBlockOrSuspend = (actionType) => {
    setSelectedAction(actionType);
    setActionModalVisible(false);

    if (actionType === "unblock" || actionType === "unsuspend") {
      setConfirmationMessage(
        `Are you sure you want to ${actionType} user ${selectedUser?.name}?`
      );
      setOnConfirm(() => async () => {
        try {
          await axios.put(
            `${API_BASE_URL}/admin-update-user-status`,
            {
              userId: selectedUser?.id,
              action: actionType,
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          toast.success(`User successfully ${actionType}ed`);
          fetchInactiveUsers();
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
      // For block/suspend, open the reason/duration modal
      setDurationModalVisible(true);
    }
  };

  // Confirm block/suspend action with duration & reason
  const handleSubmitAction = async () => {
    if (!selectedDuration || !actionReason.trim()) {
      toast.error("Please select a duration and enter a reason.");
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/admin-update-user-status`,
        {
          userId: selectedUser?.id,
          action: selectedAction,
          reason: actionReason,
          duration: selectedDuration,
          resetReports: false
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success(`User ${selectedAction}ed successfully`);
      fetchInactiveUsers();
      setDurationModalVisible(false);
      setSelectedUser(null);
      setSelectedAction("");
      setActionReason("");
      setSelectedDuration("");
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${selectedAction} user`);
    }
  };

  // Optionally reset report count
  const handleResetReportCount = () => {
    setConfirmationMessage(
      `Are you sure you want to reset report count for user ${selectedUser?.name}?`
    );
    setOnConfirm(() => async () => {
      try {
        await axios.put(
          `${API_BASE_URL}/reset-report-count`,
          {
            type: "user",
            id: selectedUser?.id
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success("Report count reset successfully");
        fetchInactiveUsers();
      } catch (error) {
        console.error("Reset report error:", error.response?.data);
        toast.error(error.response?.data?.message || "Failed to reset report count");
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
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-800">Inactive Users</h1>
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
                    <p className="text-sm font-medium opacity-80">Total Users</p>
                    <p className="text-xl font-semibold">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <FaUserTimes className="text-2xl opacity-80" />
                  <div className="ml-3">
                    <p className="text-sm font-medium opacity-80">Inactive Users</p>
                    <p className="text-xl font-semibold">{stats.inactiveUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <FaUserCheck className="text-2xl opacity-80" />
                  <div className="ml-3">
                    <p className="text-sm font-medium opacity-80">Active Users</p>
                    <p className="text-xl font-semibold">{stats.activeUsers}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-2xl opacity-80" />
                  <div className="ml-3">
                    <p className="text-sm font-medium opacity-80">Reported Users</p>
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Last Logged In</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      </td>
                    </tr>
                  ) : currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-gray-500">
                        No inactive users found
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((user, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleUserClick(user)}
                      >
                        <td className="px-6 py-4 text-sm text-gray-600">{user.s_n}</td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <img
                              src={
                                user.profile_image
                                  ? `http://localhost:3000/${user.profile_image}`
                                  : "https://via.placeholder.com/80"
                              }
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white"></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{user.name}</div>
                          <div className="text-sm text-gray-500">
                            {user.username || "@" + user.name.toLowerCase().replace(" ", "")}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {user.last_active
                              ? new Date(user.last_active).toLocaleString()
                              : "N/A"}
                          </div>
                          {user.last_active && (
                            <div className="text-xs text-gray-400">
                              {getRelativeTime(user.last_active)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(e, user);
                            }}
                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            <FaEllipsisV />
                          </button>
                        </td>
                      </tr>
                    ))
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

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
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
                    ))}

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
                        Manage Inactive User: {selectedUser?.name}
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
                            selectedUser?.profile_image
                              ? `http://localhost:3000/${selectedUser.profile_image}`
                              : "https://via.placeholder.com/80"
                          }
                          alt={selectedUser?.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{selectedUser?.name}</h3>
                          <p className="text-sm text-gray-500">{selectedUser?.email}</p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                            Inactive
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                        {/* Dynamic Block/Unblock based on user.status */}
                        {selectedUser?.status === "Blocked" ? (
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

                        {/* Dynamic Suspend/Unsuspend based on user.status */}
                        {selectedUser?.status === "Suspended" ? (
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

                        <button
                          onClick={handleResetReportCount}
                          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <FaUndo className="text-blue-500 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">Reset Report Count</div>
                              <div className="text-sm text-gray-500">Set report count to 0</div>
                            </div>
                          </div>
                        </button>

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
        </div>
      )}

      {/* Duration/Reason Modal (Block/Suspend) */}
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
                          { value: "permanent", label: "Permanent" }
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Action</h3>
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

export default InactiveUser;

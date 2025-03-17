import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Sidebar from "../sidebar/Sidebar";

// Icons
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
  FaExclamationTriangle,
  FaUnlock,
  FaUndo,
} from "react-icons/fa";

const BlockedUser = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Side-drawer & Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);

  // Action logic
  const [selectedAction, setSelectedAction] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");

  // Confirmation
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(() => () => {});

  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    blockedUsers: 0,
    suspendedUsers: 0,
    reportedUsers: 0,
  });

  // =======================================================
  // 1) Retrieve token, then fetch blocked users
  // =======================================================
  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
    } else {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [navigate]);

  const fetchBlockedUsers = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3000/api/dashboard/get-blocked-user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.message === "Blocked users retrieved successfully.") {
        setUserData(response.data.data);

        // Example stats
        const users = response.data.data;
        setStats({
          totalUsers: users.length,
          blockedUsers: users.filter((u) => u.is_blocked).length,
          suspendedUsers: users.filter((u) => u.is_suspended).length,
          reportedUsers: users.filter((u) => (u.report_count || 0) > 0).length,
        });
      }
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      toast.error("Failed to fetch blocked users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, [accessToken]);

  // =======================================================
  // 2) Search & Pagination
  // =======================================================
  const filteredUsers = userData.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // =======================================================
  // 3) Basic user row clicks
  // =======================================================
  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  // For 3-dot side-drawer
  const handleActionClick = (e, user) => {
    e.stopPropagation();
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  // =======================================================
  // 4) Delete user
  // =======================================================
  const handleDelete = () => {
    if (!selectedUser) return;

    setConfirmationMessage(
      `Are you sure you want to delete user ${selectedUser.name}?`
    );
    setOnConfirm(() => async () => {
      try {
        await axios.delete(
          `http://localhost:3000/api/dashboard/delete-user/${selectedUser.id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success("User deleted successfully");
        fetchBlockedUsers();
      } catch (error) {
        toast.error("Failed to delete user");
      }
      setConfirmationModalVisible(false);
      setActionModalVisible(false);
      setSelectedUser(null);
    });
    setConfirmationModalVisible(true);
  };

  // =======================================================
  // 5) Dynamic block/unblock/suspend/unsuspend
  // Since these are blocked, we mostly do "unblock" or "suspend" or "unsuspend"
  // But if you want to let them block further, you can show "block" again.
  // =======================================================

  // For "unblock" or "unsuspend" => direct confirm
  const handleUnblockOrUnsuspend = (actionType) => {
    // e.g. "unblock" or "unsuspend"
    if (!selectedUser) return;

    const label = actionType === "unblock" ? "unblock" : "unsuspend";
    setConfirmationMessage(`Are you sure you want to ${label} user ${selectedUser.name}?`);
    setOnConfirm(() => async () => {
      try {
        await axios.put(
          "http://localhost:3000/api/dashboard/admin-update-user-status",
          {
            userId: selectedUser.id,
            action: actionType, // "unblock" or "unsuspend"
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success(`User successfully ${label}ed.`);
        fetchBlockedUsers();
      } catch (error) {
        toast.error(`Failed to ${label} user`);
      }
      setConfirmationModalVisible(false);
      setActionModalVisible(false);
      setSelectedUser(null);
    });
    setConfirmationModalVisible(true);
  };

  // For "block" or "suspend" => reason/duration
  const handleBlockOrSuspend = (actionType) => {
    setSelectedAction(actionType); // "block" or "suspend"
    setActionModalVisible(false);
    setDurationModalVisible(true);
  };

  // Then confirm block or suspend
  const handleSubmitAction = async () => {
    if (!selectedDuration || !actionReason.trim()) {
      toast.error("Please select a duration and enter a reason");
      return;
    }

    const durationText = {
      "1w": "1 Week",
      "1m": "1 Month",
      "6m": "6 Months",
      "permanent": "Permanent",
    }[selectedDuration];

    const label = selectedAction === "block" ? "block" : "suspend";
    setConfirmationMessage(
      `Are you sure you want to ${label} user ${selectedUser.name} for ${durationText}?\nReason: "${actionReason}"?`
    );

    setOnConfirm(() => async () => {
      try {
        await axios.put(
          "http://localhost:3000/api/dashboard/admin-update-user-status",
          {
            userId: selectedUser.id,
            action: selectedAction,  // "block" or "suspend"
            reason: actionReason,
            duration: selectedDuration,
            // resetReports: true if you want to reset the user’s report_count
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success(`User ${label}ed successfully`);
        fetchBlockedUsers();
      } catch (error) {
        toast.error(`Failed to ${label} user`);
      }
      setConfirmationModalVisible(false);
      setDurationModalVisible(false);
      setSelectedUser(null);
      setSelectedAction("");
      setActionReason("");
      setSelectedDuration("");
    });
    setConfirmationModalVisible(true);
  };

  // =======================================================
  // 6) Reset user’s report count
  // =======================================================
  const handleResetReportCount = () => {
    if (!selectedUser) return;

    setConfirmationMessage(
      `Are you sure you want to reset report count for user ${selectedUser.name} to 0?`
    );
    setOnConfirm(() => async () => {
      try {
        // Pass resetReports: true to your backend
        await axios.put(
          "http://localhost:3000/api/dashboard/admin-update-user-status",
          {
            userId: selectedUser.id,
            action: "unblock", // or anything valid
            resetReports: true,
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success("Report count reset to 0");
        fetchBlockedUsers();
      } catch (error) {
        toast.error("Failed to reset report count");
      }
      setConfirmationModalVisible(false);
      setActionModalVisible(false);
      setSelectedUser(null);
    });
    setConfirmationModalVisible(true);
  };

  // =======================================================
  // 7) Rendering
  // =======================================================
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
              <h1 className="text-2xl font-semibold text-gray-800">Blocked Users</h1>
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
                  <FaUserLock className="text-2xl opacity-80" />
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

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
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

        {/* Users Table */}
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
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
                        No blocked users found
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((user, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleUserClick(user.id)}
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
                            {/* If we wanted an indicator for blocked or offline/online, could do so here */}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800">{user.name}</div>
                          <div className="text-sm text-gray-500">
                            {user.username || "@" + user.name?.toLowerCase().replace(" ", "")}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="max-w-xs truncate">{user.reason || "No reason provided"}</div>
                        </td>
                        <td className="px-6 py-4">
                          {/* If user.is_blocked => show 'Blocked', else 'Active' or 'Suspended' etc. */}
                          {user.is_blocked ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Blocked
                            </span>
                          ) : user.is_suspended ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
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
                        Manage User: {selectedUser?.name}
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
                            selectedUser.profile_image
                              ? `http://localhost:3000/${selectedUser.profile_image}`
                              : "https://via.placeholder.com/80"
                          }
                          alt={selectedUser.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{selectedUser.name}</h3>
                          <p className="text-sm text-gray-500">{selectedUser.email}</p>
                          {selectedUser.is_blocked ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                              Blocked
                            </span>
                          ) : selectedUser.is_suspended ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                              Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        {/* If user is blocked, show Unblock else show Block */}
                        {selectedUser.is_blocked ? (
                          <button
                            onClick={() => handleUnblockOrUnsuspend("unblock")}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center">
                              <FaUnlock className="text-green-500 mr-3" />
                              <div className="text-left">
                                <div className="font-medium">Unblock User</div>
                                <div className="text-sm text-gray-500">Restore user access</div>
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
                                <div className="text-sm text-gray-500">Prevent user from accessing</div>
                              </div>
                            </div>
                          </button>
                        )}

                        {/* If user is suspended, show Unsuspend else show Suspend */}
                        {selectedUser.is_suspended ? (
                          <button
                            onClick={() => handleUnblockOrUnsuspend("unsuspend")}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center">
                              <FaUndo className="text-green-500 mr-3" />
                              <div className="text-left">
                                <div className="font-medium">Unsuspend User</div>
                                <div className="text-sm text-gray-500">Lift suspension from user</div>
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
                                <div className="text-sm text-gray-500">Temporarily restrict user access</div>
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
                              <div className="text-sm text-gray-500">Set report count to 0</div>
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
        </div>
      )}

      {/* Duration/Reason Modal (for block/suspend) */}
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

export default BlockedUser;

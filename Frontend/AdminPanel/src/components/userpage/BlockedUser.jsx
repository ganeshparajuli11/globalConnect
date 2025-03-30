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

// Import the reusable component
import UserManagementComponent from "./UserManagementComponent";

const BlockedUser = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
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

  // Detail Modal (for viewing report details)
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Action Modal (reusable via UserManagementComponent)
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  // =======================================================
  // Retrieve token, then fetch blocked users
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
      const response = await axios.get(
        "http://localhost:3000/api/dashboard/get-blocked-user",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.data.message === "Blocked users retrieved successfully.") {
        setUserData(response.data.data);
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
  // Search & Pagination
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
  // Basic user row clicks
  // =======================================================
  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  // For 3-dot side-drawer: set selected user and open action modal
  const handleActionClick = (e, user) => {
    e.stopPropagation();
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  // Detail Modal handler (for viewing report details)
  const handleViewDetails = (reportItem) => {
    setSelectedReport(reportItem);
    setDetailModalVisible(true);
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

      {/* Render the reusable UserManagementComponent for user actions */}
      {actionModalVisible && selectedUser && (
        <UserManagementComponent
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          fetchUserData={fetchBlockedUsers}
          fetchActiveUsers={fetchBlockedUsers}
          API_BASE_URL={API_BASE_URL}
          accessToken={accessToken}
          isVisible={actionModalVisible}
          setIsVisible={setActionModalVisible}
        />
      )}
    </div>
  );
};

export default BlockedUser;

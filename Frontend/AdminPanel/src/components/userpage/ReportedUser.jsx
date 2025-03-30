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
import UserManagementComponent from "./UserManagementComponent";

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

  // Action Modal state using the reusable component
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
        const blockedCount = data.filter(
          (item) => item.reportedTo?.is_blocked
        ).length;
        const suspendedCount = data.filter(
          (item) => item.reportedTo?.is_suspended
        ).length;
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

  // Inline action side-drawer code has been removed.
  // Instead, the reusable UserManagementComponent will be rendered when actionModalVisible is true.

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

      {/* Render the reusable UserManagementComponent for user actions */}
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
    </div>
  );
};

export default ReportedUser;

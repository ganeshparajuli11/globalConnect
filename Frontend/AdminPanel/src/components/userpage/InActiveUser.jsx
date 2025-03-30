import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import { toast, ToastContainer } from "react-toastify";
import Sidebar from "../sidebar/Sidebar";
import {
  FaSearch,
  FaEllipsisV,
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaExclamationTriangle,
  FaUndo
} from "react-icons/fa";
import UserManagementComponent from "./UserManagementComponent";

const InactiveUser = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Action Modal & Duration/Reason
  const [selectedUser, setSelectedUser] = useState(null);


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
  // Update handleActionClick
  const handleActionClick = (e, user) => {
    e.stopPropagation();
    setSelectedUser(user);
    setIsModalVisible(true);
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
        <UserManagementComponent
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        fetchUserData={fetchInactiveUsers}
        fetchActiveUsers={fetchInactiveUsers}
        API_BASE_URL={API_BASE_URL}
        accessToken={accessToken}
        isVisible={isModalVisible}
        setIsVisible={setIsModalVisible}
      />
      </div>
    </div>
  );
};

export default InactiveUser;

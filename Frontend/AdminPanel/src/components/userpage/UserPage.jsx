import { useState, useEffect } from "react";
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
  FaChevronLeft,
  FaChevronRight,
  FaUndo
} from "react-icons/fa";

import UserManagementComponent from "./UserManagementComponent";

const UserPage = () => {
  const [userData, setUserData] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search & filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Action modal state and selected user
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:3000/api/dashboard";

  // =======================================================
  // Retrieve token & load initial data
  // =======================================================
  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (!token) {
      toast.error("Please login to continue");
      navigate("/login");
    } else {
      setAccessToken(token);
    }
  }, [navigate]);

  // Fetch user data
  const fetchUserData = async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/all`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data?.data) {
        setUserData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        reactLocalStorage.remove("access_token");
        setAccessToken(null);
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [accessToken]);

  // Auto-refresh data every 30s
  useEffect(() => {
    if (!accessToken) return;
    const intervalId = setInterval(() => {
      fetchUserData();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [accessToken]);

  // =======================================================
  // Search & Filter
  // =======================================================
  const filteredUsers = userData.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && user.status === "Active" && !user.is_blocked) ||
      (filterStatus === "blocked" && user.is_blocked) ||
      (filterStatus === "suspended" && user.status === "Suspended");

    return matchesSearch && matchesFilter;
  });

  // =======================================================
  // Pagination
  // =======================================================
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  useEffect(() => {
    setTotalPages(Math.ceil(filteredUsers.length / usersPerPage));
    if (currentPage > Math.ceil(filteredUsers.length / usersPerPage)) {
      setCurrentPage(1);
    }
  }, [filteredUsers.length, usersPerPage, currentPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  // =======================================================
  // Table Click Handlers
  // =======================================================
  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  const handleActionClick = (e, user) => {
    e.stopPropagation();
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <ToastContainer />

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold text-gray-800">User Management</h1>
              <div className="flex items-center space-x-4">
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
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="flex-1 overflow-y-auto bg-white">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">SN</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                currentUsers.map((user, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleUserClick(user.userId)}
                  >
                    <td className="px-6 py-3 text-sm">{user.s_n}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center">
                        <img
                          src={
                            user.profile_image
                              ? `http://localhost:3000/${user.profile_image}`
                              : "https://via.placeholder.com/80"
                          }
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="ml-3 font-medium text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-3">
                      {user.is_blocked ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Blocked
                        </span>
                      ) : user.status === "Suspended" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {user.status || "Active"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={(e) => handleActionClick(e, user)}
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

          {/* Pagination Controls */}
          {!isLoading && filteredUsers.length > 0 && (
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
                  Showing {filteredUsers.length > 0 ? indexOfFirstUser + 1 : 0} to{" "}
                  {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} entries
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

                  {getPageNumbers().map((number, idx) => (
                    <button
                      key={idx}
                      onClick={() => number !== "..." && handlePageChange(number)}
                      disabled={number === "..."}
                      className={`px-3 py-1 rounded-md ${
                        number === currentPage
                          ? "bg-blue-500 text-white"
                          : number === "..."
                          ? "text-gray-400 cursor-default"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {number}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === totalPages || totalPages === 0
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

      {/* Use the new UserManagementComponent instead of inline action modal */}
      {actionModalVisible && selectedUser && (
        <UserManagementComponent
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          fetchUserData={fetchUserData}
          fetchActiveUsers={fetchUserData}
          API_BASE_URL={API_BASE_URL}
          accessToken={accessToken}
          isVisible={actionModalVisible}
          setIsVisible={setActionModalVisible}
        />
      )}
    </div>
  );
};

export default UserPage;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import { toast, ToastContainer } from "react-toastify";
import Sidebar from "../sidebar/Sidebar";
import dayjs from "dayjs";
// Icons
import {
  FaSearch,
  FaEllipsisV,
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import UserManagementComponent from "./UserManagementComponent";

// Reusable Stats Card Component
const StatsCard = ({ icon: Icon, label, value, bgClass }) => {
  return (
    <div className={`${bgClass} rounded-lg px-6 py-4 text-white shadow-lg`}>
      <div className="flex items-center">
        <Icon className="text-3xl opacity-80" />
        <div className="ml-4">
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
};

const ActiveUser = () => {
  const [userData, setUserData] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);


  // Action logic
  const [selectedAction, setSelectedAction] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");



  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    reportedUsers: 0,
  });

  // Define API Base URL
  const API_BASE_URL = "http://localhost:3000/api/dashboard";

  // =======================================================
  // 1) Auth & Fetch Active Users
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

  const fetchActiveUsers = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/get-active-user`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data.message === "Active users retrieved successfully.") {
        setUserData(response.data.data);
        const users = response.data.data;
        setStats({
          totalUsers: users.length,
          activeUsers: users.filter((u) => u.status === "Active").length,
          inactiveUsers: users.filter((u) => u.status === "Inactive").length,
          reportedUsers: users.filter((u) => (u.report_count || 0) > 0).length,
        });
      }
    } catch (error) {
      console.error("Error fetching active users:", error);
      toast.error("Failed to fetch active users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveUsers();
  }, [accessToken]);

  // =======================================================
  // 2) Search & Pagination
  // =======================================================
  const filteredUsers = userData.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // =======================================================
  // 3) Basic Click Handlers
  // =======================================================
  const handleUserClick = (user) => {
    navigate(`/user/${user.id}`);
  };

  const handleActionClick = (e, user) => {
    e.stopPropagation();
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  // =======================================================
  // 4) Delete User
  // =======================================================
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
            reason: "User deleted by admin",
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success("User deleted successfully");
        fetchActiveUsers();
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

  // =======================================================
  // 5) Dynamic Block/Unblock, Suspend/Unsuspend, Reset Report Count
  // =======================================================
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
          fetchActiveUsers();
        } catch (error) {
          toast.error(
            error.response?.data?.message || `Failed to ${actionType} user`
          );
        } finally {
          setConfirmationModalVisible(false);
          setSelectedUser(null);
          setSelectedAction("");
        }
      });
      setConfirmationModalVisible(true);
    } else {
      // For block or suspend actions, open the duration/reason modal
      setDurationModalVisible(true);
    }
  };

  // After reason/duration is filled, confirm block or suspend action
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
          resetReports: false,
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      toast.success(`User ${selectedAction}ed successfully`);
      fetchActiveUsers();
      setDurationModalVisible(false);
      setSelectedUser(null);
      setSelectedAction("");
      setActionReason("");
      setSelectedDuration("");
    } catch (error) {
      toast.error(
        error.response?.data?.message || `Failed to ${selectedAction} user`
      );
    }
  };

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
            id: selectedUser?.id,
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success("Report count reset successfully");
        fetchActiveUsers();
      } catch (error) {
        console.error("Reset report error:", error.response?.data);
        toast.error(
          error.response?.data?.message || "Failed to reset report count"
        );
      } finally {
        setConfirmationModalVisible(false);
        setActionModalVisible(false);
        setSelectedUser(null);
      }
    });
    setConfirmationModalVisible(true);
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
              <h1 className="text-2xl font-semibold text-gray-800">Active Users</h1>
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
              </div>
            </div>
            {/* Dynamic Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <StatsCard
                icon={FaUsers}
                label="Total Users"
                value={stats.totalUsers}
                bgClass="bg-gradient-to-r from-blue-500 to-blue-600"
              />
              <StatsCard
                icon={FaUserCheck}
                label="Active Users"
                value={stats.activeUsers}
                bgClass="bg-gradient-to-r from-green-500 to-green-600"
              />
              <StatsCard
                icon={FaUserTimes}
                label="Inactive Users"
                value={stats.inactiveUsers}
                bgClass="bg-gradient-to-r from-yellow-500 to-yellow-600"
              />
              <StatsCard
                icon={FaExclamationTriangle}
                label="Reported Users"
                value={stats.reportedUsers}
                bgClass="bg-gradient-to-r from-red-500 to-red-600"
              />
            </div>
          </div>
        </div>
        {/* User Table */}
        <div className="flex-1 overflow-y-auto bg-white">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Profile</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Last Activity</th>
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
                    No users found
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
                        {user.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white"></div>
                        )}
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
                      {user.last_activity ? dayjs(user.last_activity).format("MMM D, YYYY h:mm A") : "N/A"}

                      </div>
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
      <UserManagementComponent
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        fetchUserData={fetchActiveUsers}
        fetchActiveUsers={fetchActiveUsers}
        API_BASE_URL={API_BASE_URL}
        accessToken={accessToken}
        isVisible={isModalVisible}
        setIsVisible={setIsModalVisible}
      />
    </div>
  );
};

export default ActiveUser;

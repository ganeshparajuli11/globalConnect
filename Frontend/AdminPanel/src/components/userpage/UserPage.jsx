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
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaUndo
} from "react-icons/fa";

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

  // Action modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);

  // Action logic
  const [selectedAction, setSelectedAction] = useState(""); // e.g. "block", "unblock", "suspend", "unsuspend"
  const [actionReason, setActionReason] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");

  // Confirmation
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(() => () => {});

  const navigate = useNavigate();

  // =======================================================
  // 1) Retrieve token & load initial data
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

  // Validate / fetch user data
  const fetchUserData = async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      const response = await axios.get("http://localhost:3000/api/dashboard/all", {
        headers: { Authorization: `Bearer ${accessToken}` }
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

  // Optionally auto-refresh data
  useEffect(() => {
    if (!accessToken) return;
    const intervalId = setInterval(() => {
      fetchUserData();
    }, 30000); // Refresh every 30s
    return () => clearInterval(intervalId);
  }, [accessToken]);

  // =======================================================
  // 2) Search & Filter
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
  // 3) Pagination
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
  // 4) Table Click Handlers
  // =======================================================
  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  const handleActionClick = (e, user) => {
    e.stopPropagation();
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  // =======================================================
  // 5) Deleting a User
  // =======================================================
  const handleDelete = () => {
    if (!selectedUser) return;
    setConfirmationMessage(`Are you sure you want to delete user ${selectedUser.name}?`);
    setOnConfirm(() => async () => {
      try {
        await axios.delete(
          `http://localhost:3000/api/dashboard/delete-user/${selectedUser.userId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        );
        toast.success("User deleted successfully");
        fetchUserData();
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
  // 6) Block/Unblock, Suspend/Unsuspend, Reset Reports
  // =======================================================
  const handleBlockOrSuspend = (actionType) => {
    // e.g. "block", "unblock", "suspend", "unsuspend"
    setSelectedAction(actionType);
    setActionModalVisible(false);

    // For unblock/unsuspend => skip reason/duration
    if (actionType === "unblock" || actionType === "unsuspend") {
      const label = actionType;
      setConfirmationMessage(`Are you sure you want to ${label} user ${selectedUser.name}?`);
      setOnConfirm(() => async () => {
        try {
          await axios.put(
            "http://localhost:3000/api/dashboard/admin-update-user-status",
            {
              userId: selectedUser.userId,
              action: actionType // "unblock" or "unsuspend"
            },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          toast.success(`User successfully ${label}ed.`);
          fetchUserData();
        } catch (error) {
          toast.error(`Failed to ${label} user`);
        }
        setConfirmationModalVisible(false);
        setSelectedUser(null);
        setSelectedAction("");
      });
      setConfirmationModalVisible(true);
    } else {
      // "block" or "suspend" => show reason/duration
      setDurationModalVisible(true);
    }
  };

  // Confirm block/suspend in Duration/Reason modal
  const handleSubmitAction = () => {
    if (!selectedDuration || !actionReason.trim()) {
      toast.error("Please select a duration and enter a reason");
      return;
    }

    const durationMap = {
      "1w": "1 Week",
      "1m": "1 Month",
      "6m": "6 Months",
      "permanent": "Permanent"
    };
    const durText = durationMap[selectedDuration] || "N/A";

    setConfirmationMessage(
      `Are you sure you want to ${selectedAction} user ${selectedUser.name} for ${durText}?\nReason: "${actionReason}"`
    );
    setOnConfirm(() => async () => {
      try {
        await axios.put(
          "http://localhost:3000/api/dashboard/admin-update-user-status",
          {
            userId: selectedUser.userId,
            action: selectedAction, // "block" or "suspend"
            reason: actionReason,
            duration: selectedDuration,
            // e.g. resetReports: true if you want to zero out the user's report_count
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success(`User ${selectedAction}ed successfully`);
        fetchUserData();
      } catch (error) {
        console.error(error);
        toast.error(`Failed to ${selectedAction} user`);
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

  // Reset user’s report count
  const handleResetReportCount = () => {
    if (!selectedUser) return;
    setConfirmationMessage(
      `Are you sure you want to reset report count for ${selectedUser.name} to 0?`
    );
    setOnConfirm(() => async () => {
      try {
        await axios.put(
          "http://localhost:3000/api/dashboard/admin-update-user-status",
          {
            userId: selectedUser.userId,
            action: "unblock", // or any valid action
            resetReports: true
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        toast.success("Report count reset to 0");
        fetchUserData();
      } catch (error) {
        console.error(error);
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  SN
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">
                  Actions
                </th>
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
                  Showing{" "}
                  {filteredUsers.length > 0 ? indexOfFirstUser + 1 : 0} to{" "}
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
                          {/* Status chip */}
                          {selectedUser?.is_blocked ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Blocked
                            </span>
                          ) : selectedUser?.status === "Suspended" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 mt-2 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {selectedUser?.status || "Active"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Dynamic Block/Unblock */}
                        {selectedUser?.is_blocked ? (
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
                                  Lift suspension from user
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

                    {/* Reason */}
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

                    {/* Duration */}
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

export default UserPage;

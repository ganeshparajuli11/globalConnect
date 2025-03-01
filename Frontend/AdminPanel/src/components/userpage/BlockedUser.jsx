import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Sidebar from "../sidebar/Sidebar";
import UserBar from "./UserBar";

const BlockedUser = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState(""); // "suspend" for suspend action; for unblock we use separate handler.
  const [actionReason, setActionReason] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(() => () => {});

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
    }
  }, []);

  const fetchBlockedUsers = () => {
    if (accessToken) {
      axios
        .get("http://localhost:3000/api/dashboard/get-blocked-user", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          if (
            response.data.message === "Blocked users retrieved successfully."
          ) {
            setUserData(response.data.data);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching blocked users:", error);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, [accessToken]);

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  // Open the Action Modal for a given user
  const handleActionClick = (e, user) => {
    e.stopPropagation();
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  // Delete action – show confirmation modal
  const handleDelete = () => {
    setConfirmationMessage(`Are you sure you want to delete user ${selectedUser.name}?`);
    setOnConfirm(() => () => {
      // Replace this with an API call if needed
      setConfirmationModalVisible(false);
      setActionModalVisible(false);
      setSelectedUser(null);
    });
    setConfirmationModalVisible(true);
  };

  // Unblock action – show confirmation modal and then call the API
  const handleUnblock = () => {
    setConfirmationMessage(`Are you sure you want to unblock user ${selectedUser.name}?`);
    setOnConfirm(() => () => {
      const payload = {
        userId: selectedUser.id,
        status: "Active", // unblocking sets status to Active
      };
      axios
        .put("http://localhost:3000/api/dashboard/admin-remove-user-status", payload, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          setConfirmationModalVisible(false);
          setActionModalVisible(false);
          setSelectedUser(null);
          fetchBlockedUsers();
        })
        .catch((error) => {
          console.error("Error unblocking user:", error);
          setConfirmationModalVisible(false);
          alert("Error unblocking user.");
        });
    });
    setConfirmationModalVisible(true);
  };

  // For suspend action, open the Duration/Reason Modal
  const handleSuspend = () => {
    setSelectedAction("suspend");
    setActionModalVisible(false);
    setDurationModalVisible(true);
  };

  // Handle submit for suspend action from the Duration/Reason Modal
  const handleSubmitAction = () => {
    if (!selectedDuration || !actionReason.trim()) {
      alert("Please select a duration and enter a reason.");
      return;
    }
    const durationText =
      selectedDuration === "1w"
        ? "1 Week"
        : selectedDuration === "1m"
        ? "1 Month"
        : selectedDuration === "6m"
        ? "6 Months"
        : "Permanent";
    setConfirmationMessage(
      `Are you sure you want to suspend user ${selectedUser.name} for ${durationText} with the reason:\n"${actionReason}"?`
    );
    setOnConfirm(() => () => {
      const payload = {
        userId: selectedUser.id,
        action: "suspend",
        reason: actionReason,
        duration: selectedDuration,
      };
      axios
        .put("http://localhost:3000/api/dashboard/admin-update-user-status", payload, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          setConfirmationModalVisible(false);
          setDurationModalVisible(false);
          setSelectedUser(null);
          setSelectedAction("");
          setActionReason("");
          setSelectedDuration("");
          fetchBlockedUsers();
        })
        .catch((error) => {
          console.error("Error updating user status:", error);
          setConfirmationModalVisible(false);
          alert("Error updating user status.");
        });
    });
    setConfirmationModalVisible(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <UserBar />
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-gray-600 font-medium">SN</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Profile</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Name</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Email</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Reason</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Status</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : (
                userData.map((user, index) => (
                  <tr
                    key={index}
                    className="border-b cursor-pointer"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <td className="px-6 py-4">{user.s_n}</td>
                    <td className="px-6 py-4">
                      <img
                        src={
                          user.profile_image
                            ? `http://localhost:3000/${user.profile_image}`
                            : "https://via.placeholder.com/80"
                        }
                        alt={user.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </td>
                    <td className="px-6 py-4">{user.name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4">{user.reason || "No reason"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-white ${
                          user.is_blocked ? "bg-red-500" : "bg-green-500"
                        }`}
                      >
                        {user.is_blocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => handleActionClick(e, user)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Action
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {actionModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-64">
            <h2 className="text-lg font-semibold mb-4">Select Action</h2>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-200"
              onClick={() => handleUnblock()}
            >
              Unblock
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-200"
              onClick={() => handleDelete()}
            >
              Delete
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-200"
              onClick={() => handleSuspend()}
            >
              Suspend
            </button>
            <button
              className="mt-4 w-full text-center text-gray-600"
              onClick={() => setActionModalVisible(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Duration/Reason Modal for Suspend */}
      {durationModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-72">
            <h2 className="text-lg font-semibold mb-4">Suspend User</h2>
            <div className="mb-4">
              <textarea
                placeholder="Enter reason for suspension"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-semibold">
                Select Duration:
              </label>
              <div className="flex flex-col space-y-2">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    value="1w"
                    checked={selectedDuration === "1w"}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="mr-2"
                  />
                  1 Week
                </label>
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    value="1m"
                    checked={selectedDuration === "1m"}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="mr-2"
                  />
                  1 Month
                </label>
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    value="6m"
                    checked={selectedDuration === "6m"}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="mr-2"
                  />
                  6 Months
                </label>
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    value="permanent"
                    checked={selectedDuration === "permanent"}
                    onChange={(e) => setSelectedDuration(e.target.value)}
                    className="mr-2"
                  />
                  Permanent
                </label>
              </div>
            </div>
            <button
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={handleSubmitAction}
            >
              Submit
            </button>
            <button
              className="mt-4 w-full text-center text-gray-600"
              onClick={() => {
                setDurationModalVisible(false);
                setActionReason("");
                setSelectedDuration("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmationModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-semibold mb-4">Confirm Action</h2>
            <p className="mb-6 whitespace-pre-line">{confirmationMessage}</p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                onClick={() => onConfirm()}
              >
                Confirm
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                onClick={() => setConfirmationModalVisible(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockedUser;

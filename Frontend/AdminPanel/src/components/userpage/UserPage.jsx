import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Sidebar from "../sidebar/Sidebar";
import UserBar from "./UserBar";
import { toast, ToastContainer } from "react-toastify";

const UserPage = () => {
  const [userData, setUserData] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const navigate = useNavigate();

  // States for action modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState(""); // "block" or "suspend"
  const [actionReason, setActionReason] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [onConfirm, setOnConfirm] = useState(() => () => {});

  // Fetch token from local storage
  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
    }
  }, []);

  // Helper function to fetch user data
  const fetchUserData = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/dashboard/all",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setUserData(response.data.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  // Fetch user data when token changes
  useEffect(() => {
    if (accessToken) {
      fetchUserData();
    }
  }, [accessToken]);

  // Navigate to user profile page when a row is clicked
  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  // Open Action Modal when three dots button is clicked
  const handleActionClick = (e, user) => {
    e.stopPropagation(); // Prevent row click navigation
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  // Delete action – shows a confirmation modal before deletion
  const handleDelete = () => {
    setConfirmationMessage(`Are you sure you want to delete user ${selectedUser.name}?`);
    setOnConfirm(() => () => {
      // Replace this alert with an actual delete API call if needed
      setConfirmationModalVisible(false);
      setActionModalVisible(false);
      setSelectedUser(null);
    });
    setConfirmationModalVisible(true);
  };

  // For block or suspend actions, open the Duration/Reason Modal
  const handleBlockOrSuspend = (actionType) => {
    setSelectedAction(actionType);
    setActionModalVisible(false);
    setDurationModalVisible(true);
  };

  // Handle submit from the Duration/Reason Modal
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
      `Are you sure you want to ${selectedAction} user ${selectedUser.name} for ${durationText} with the reason:\n"${actionReason}"?`
    );
    setOnConfirm(() => () => {
      axios
        .put(
          "http://localhost:3000/api/dashboard/admin-update-user-status",
          {
            userId: selectedUser.userId, // or selectedUser.id if returned as id
            action: selectedAction,
            reason: actionReason,
            duration: selectedDuration,
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        .then((response) => {
          toast.success(response.data.message);
          setConfirmationModalVisible(false);
          setDurationModalVisible(false);
          setSelectedUser(null);
          setSelectedAction("");
          setActionReason("");
          setSelectedDuration("");
          fetchUserData(); // Refresh user data after action
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
      <ToastContainer />
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <UserBar />

        {/* User Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-gray-600 font-medium">User No</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Profile</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Name</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Email</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Status</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Destination Country</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Joined Date</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {userData.map((user, index) => (
                <tr
                  key={index}
                  className="border-b cursor-pointer hover:bg-gray-200"
                  onClick={() => handleUserClick(user.userId)}
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
                  <td className="px-6 py-4">
                    {user.is_blocked ? "Blocked" : user.status}
                  </td>
                  <td className="px-6 py-4">{user.destination_country}</td>
                  <td className="px-6 py-4">
                    {user.last_login ? user.last_login : "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={(e) => handleActionClick(e, user)}>
                      <span className="text-2xl">&#8942;</span>
                    </button>
                  </td>
                </tr>
              ))}
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
              onClick={() => handleBlockOrSuspend("block")}
            >
              Block
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-200"
              onClick={() => handleDelete()}
            >
              Delete
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-200"
              onClick={() => handleBlockOrSuspend("suspend")}
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

      {/* Duration/Reason Modal for Block/Suspend */}
      {durationModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-72">
            <h2 className="text-lg font-semibold mb-4">
              {selectedAction === "block" ? "Block" : "Suspend"} User
            </h2>
            <div className="mb-4">
              <textarea
                placeholder="Enter reason for action"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-semibold">Select Duration:</label>
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

export default UserPage;

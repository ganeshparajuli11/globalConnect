import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Sidebar from "../sidebar/Sidebar";
import UserBar from "./UserBar";

const UserPage = () => {
  const [userData, setUserData] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const navigate = useNavigate();

  // States for action modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState(""); // "block" or "suspend"

  // Fetch the access token from local storage
  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
    }
  }, []);

  // Fetch user data
  useEffect(() => {
    if (accessToken) {
      const fetchData = async () => {
        try {
          const response = await axios.get(
            "http://localhost:3000/api/dashboard/all",
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          setUserData(response.data.data);
        } catch (error) {
          console.error("Error fetching data", error);
        }
      };

      fetchData();
    }
  }, [accessToken]);

  // Navigate to UserProfile when a user row is clicked
  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  // When three dots is clicked, open the action modal for that user
  const handleActionClick = (e, user) => {
    e.stopPropagation(); // Prevent row click
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  // Handle deletion directly with a confirmation (could be an API call)
  const handleDelete = () => {
    setActionModalVisible(false);
    // Replace with actual delete API call as needed
    alert(`Deleting user ${selectedUser.name}`);
    // Reset selected user after action
    setSelectedUser(null);
  };

  // For block and suspend actions, open the duration modal
  const handleBlockOrSuspend = (actionType) => {
    setSelectedAction(actionType);
    setActionModalVisible(false);
    setDurationModalVisible(true);
  };

  // When a duration is selected, perform the action (simulate API call)
  const handleDurationSelect = (duration) => {
    setDurationModalVisible(false);
    alert(
      `${selectedAction === "block" ? "Blocking" : "Suspending"} user ${
        selectedUser.name
      } for ${duration}.`
    );
    // Reset states after action
    setSelectedUser(null);
    setSelectedAction("");
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

        {/* User Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-gray-600 font-medium">User No</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Profile</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Name</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Email</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Age</th>
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
                  <td className="px-6 py-4">{user.age}</td>
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

      {/* Duration Modal for Block/Suspend */}
      {durationModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-72">
            <h2 className="text-lg font-semibold mb-4">
              {selectedAction === "block" ? "Block" : "Suspend"} User For:
            </h2>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-200"
              onClick={() => handleDurationSelect("1 Week")}
            >
              1 Week
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-200"
              onClick={() => handleDurationSelect("1 Month")}
            >
              1 Month
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-200"
              onClick={() => handleDurationSelect("Permanent")}
            >
              Permanent
            </button>
            <button
              className="mt-4 w-full text-center text-gray-600"
              onClick={() => setDurationModalVisible(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPage;

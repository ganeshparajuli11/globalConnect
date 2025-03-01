import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Sidebar from "../sidebar/Sidebar";

const InactiveUser = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // States for modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState(""); // "block" or "suspend"

  // Retrieve the access token from localStorage
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setAccessToken(token);
    }
  }, []);

  // Fetch inactive users
  useEffect(() => {
    if (accessToken) {
      axios
        .get("http://localhost:3000/api/dashboard/get-in-active-user", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((response) => {
          if (
            response.data.message ===
            "Inactive users retrieved and status updated successfully."
          ) {
            setUserData(response.data.data);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching inactive users:", error);
          setLoading(false);
        });
    } else {
      console.error("No access token found!");
      setLoading(false);
    }
  }, [accessToken]);

  // Navigate to user profile page using user.userId or fallback to user.id
  const handleUserClick = (user) => {
    const id = user.userId || user.id;
    navigate(`/user/${id}`);
  };

  // When the three-dot button is clicked
  const handleActionClick = (e, user) => {
    e.stopPropagation();
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  // Direct delete action (replace with actual API call)
  const handleDelete = () => {
    setActionModalVisible(false);
    alert(`Deleting user ${selectedUser.name}`);
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
        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <DashboardCard
            title="Total Users"
            value="2.80M"
            change="+6.08%"
            bgColor="bg-blue-100"
          />
          <DashboardCard
            title="Active Users"
            value="2,318"
            change="+6.08%"
            bgColor="bg-green-100"
          />
          <DashboardCard
            title="Inactive Users"
            value="2,318"
            change="-6.08%"
            bgColor="bg-red-100"
          />
          <DashboardCard
            title="Blocked/Reported Users"
            value="2,318"
            change="+6.08%"
            bgColor="bg-red-100"
          />
        </div>

        {/* Search and Filter Bar */}
        <div className="flex justify-between items-center mb-6">
          <input
            type="text"
            placeholder="Search user"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-4"
          />
          <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Filter
          </button>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-gray-600 font-medium">SN</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Profile</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Name</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Email</th>
                <th className="px-6 py-3 text-gray-600 font-medium">
                  Last Logged In
                </th>
                <th className="px-6 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : (
                userData.map((user, index) => (
                  <tr
                    key={index}
                    className="border-b cursor-pointer hover:bg-gray-200"
                    onClick={() => handleUserClick(user)}
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
                      {new Date(user.last_active).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={(e) => handleActionClick(e, user)}>
                        <span className="text-2xl">&#8942;</span>
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

// Dashboard Summary Card Component
const DashboardCard = ({ title, value, change, bgColor }) => {
  return (
    <div
      className={`p-6 rounded-lg shadow-md ${bgColor} flex flex-col justify-between text-center`}
    >
      <h4 className="text-gray-600 font-medium">{title}</h4>
      <h2 className="text-2xl font-bold">{value}</h2>
      <p
        className={`mt-2 ${
          change.includes("+") ? "text-green-600" : "text-red-600"
        }`}
      >
        {change}
      </p>
    </div>
  );
};

export default InactiveUser;

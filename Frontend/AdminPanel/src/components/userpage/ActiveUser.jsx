import React, { useState, useEffect } from "react";
import Sidebar from "../sidebar/Sidebar";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";

const ActiveUser = () => {
  const [userData, setUserData] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  // Fetch active users data
  useEffect(() => {
    // Retrieve the token from local storage
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token); // Set token to state
    }

    // If access token is available, fetch the active users
    if (token) {
      axios
        .get("http://localhost:3000/api/dashboard/get-active-user", {
          headers: {
            Authorization: `Bearer ${token}`, // Add token to headers
          },
        })
        .then((response) => {
          if (
            response.data.message === "Active users retrieved successfully."
          ) {
            setUserData(response.data.data);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching active users:", error);
          setLoading(false);
        });
    } else {
      console.error("No access token found!");
      setLoading(false); // Stop loading if no token found
    }
  }, []);

  const handleBlockUser = (userId) => {
    console.log("Block user clicked for:", userId);
    // Add logic to block user, such as an API request to block the user
  };

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Top Summary Cards */}
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
              <tr >
                <th className="px-6 py-3 text-gray-600 font-medium">User No</th>
                <th className="px-6 py-3 text-gray-600 font-medium">User ID</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Emails</th>
                <th className="px-6 py-3 text-gray-600 font-medium">
                  Last Login
                </th>
                <th className="px-6 py-3 text-gray-600 font-medium">Active</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userData.map((user, index) => (
                <tr key={index} className="border-b" onClick={() => handleUserClick(user.userId)}>
                  <td className="px-6 py-4">{user.s_n}</td>
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    {new Date(user.last_login).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-white ${
                        user.status === "Active" ? "bg-green-500" : "bg-red-500"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => handleBlockUser(user.id)}
                    >
                      ...
                    </button>
                    <div className="absolute hidden group-hover:block">
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleBlockUser(user.id)}
                      >
                        Block User
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Card Component for Dashboard Summary
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

export default ActiveUser;

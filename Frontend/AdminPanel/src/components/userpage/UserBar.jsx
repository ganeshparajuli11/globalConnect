import React, { useState, useEffect } from "react";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";

const UserBar = () => {
  const [getUserCount, setUserCount] = useState({
    totalUsers: "",
    activeUsers: "",
    inactiveUsers: "",
    blockedUsers: "",
  });

  const [accessToken, setAccessToken] = useState(null);

  // Fetch the access token from local storage
  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token);
    }
  }, []);

  // Fetch user stats from the API
  useEffect(() => {
    if (accessToken) {
      axios
        .get("http://localhost:3000/api/dashboard/userStats", {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Include the access token in the Authorization header
          },
        })
        .then((res) => {
          console.log(res.data.data);
          setUserCount(res.data.data); // Update user count state
        })
        .catch((error) => {
          console.error("Error fetching user stats:", error);
        });
    }
  }, [accessToken]);

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {/* Total Users */}
      <div className="p-4 bg-white rounded-md shadow-md text-center">
        <h2 className="text-lg font-semibold text-gray-600">Total Users</h2>
        <p className="text-2xl font-bold">{getUserCount.totalUsers}</p>
        <span className="text-green-500">+6.08% 📈</span>
      </div>

      {/* Active Users */}
      <div className="p-4 bg-green-100 rounded-md shadow-md text-center">
        <h2 className="text-lg font-semibold text-gray-600">Active Users</h2>
        <p className="text-2xl font-bold">{getUserCount.activeUsers}</p>
        <span className="text-green-500">+6.08% 📈</span>
      </div>

      {/* Inactive Users */}
      <div className="p-4 bg-gray-100 rounded-md shadow-md text-center">
        <h2 className="text-lg font-semibold text-gray-600">Inactive Users</h2>
        <p className="text-2xl font-bold">{getUserCount.inactiveUsers}</p>
        <span className="text-red-500">+6.08% 📉</span>
      </div>

      {/* Blocked/Reported Users */}
      <div className="p-4 bg-red-100 rounded-md shadow-md text-center">
        <h2 className="text-lg font-semibold text-gray-600">Blocked/Reported Users</h2>
        <p className="text-2xl font-bold">{getUserCount.blockedUsers}</p>
        <span className="text-red-500">+6.08% 📉</span>
      </div>
    </div>
  );
};

export default UserBar;

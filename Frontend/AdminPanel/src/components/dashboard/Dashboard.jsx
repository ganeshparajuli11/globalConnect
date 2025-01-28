import React, { useState, useEffect } from "react";
import Sidebar from "../sidebar/Sidebar";
import { reactLocalStorage } from "reactjs-localstorage";
import axios from "axios";
import UserBar from "../userpage/UserBar";

const Dashboard = () => {
  const [accessToken, setAccessToken] = useState(null);
  const [reportedUsers, setReportedUsers] = useState([]);

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token); // Set token to state
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      getDetails();
    }
  }, [accessToken]);

  const getDetails = () => {
    axios
      .get("http://localhost:3000/api/dashboard/get-reported-user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((res) => {
        setReportedUsers(res.data.data); // Storing the reported users data
      })
      .catch((error) => {
        console.error("Error fetching reported users:", error);
      });
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 bg-gray-100 p-6">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-700">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search..."
              className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
              <i className="text-gray-500">🔔</i>
            </button>
          </div>
        </div>

        {/* User Stats Section */}
        <UserBar />{/* Use UserBar */}

        {/* Table Section */}
        <div className="bg-white rounded-md shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">Highly Reported Users</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b py-3 px-4 text-gray-600 font-medium">Sr. No</th>
                <th className="border-b py-3 px-4 text-gray-600 font-medium">User Name</th>
                <th className="border-b py-3 px-4 text-gray-600 font-medium">Blocked</th>
                <th className="border-b py-3 px-4 text-gray-600 font-medium">Reported Content</th>
                <th className="border-b py-3 px-4 text-gray-600 font-medium">Reported Count</th> {/* New column */}
              </tr>
            </thead>
            <tbody>
              {reportedUsers.map((user, index) => (
                <tr key={user.s_n}>
                  <td className="border-b py-3 px-4">{user.s_n}</td>
                  <td className="border-b py-3 px-4">{user.name}</td>
                  <td className="border-b py-3 px-4">
                    {user.blocked_count === 1 ? "Blocked" : "Not Blocked"} {/* Condition for Blocked status */}
                  </td>
                  <td className="border-b py-3 px-4">{user.reported_posts}</td>
                  <td className="border-b py-3 px-4">{user.reported_count}</td> {/* Display reported_count */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState } from "react";
import { FaEllipsisV } from "react-icons/fa";
import Sidebar from "../sidebar/Sidebar";


const ReportedUser = () => {
  const [users, setUsers] = useState([
    {
      userNo: 20,
      userId: "Miya Das",
      phone: "+1 41472059670",
      email: "Miya@sky.link",
      reportedBy: "Aman Gopi",
      reason: "Spam account Id",
      blocked: true,
    },
    {
      userNo: 41,
      userId: "Shreya Pandal",
      phone: "+1 9827259670",
      email: "Shreya@dian.com",
      reportedBy: "Sandra Day",
      reason: "Abusive Content",
      blocked: false,
    },
    {
      userNo: 45,
      userId: "Sunny Marsha",
      phone: "+1 8522405110",
      email: "Sunny@gmail.com",
      reportedBy: "Stive Koni",
      reason: "Spam account Id",
      blocked: true,
    },
    // Add more user data as necessary
  ]);

  const toggleBlock = (index) => {
    const updatedUsers = [...users];
    updatedUsers[index].blocked = !updatedUsers[index].blocked;
    setUsers(updatedUsers);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar /> {/* Your existing sidebar component */}

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gray-100">
        {/* Page Title */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-blue-800">Report</h1>
          <h2 className="text-lg font-semibold text-gray-700 mt-1">Reported users</h2>
        </div>

        {/* Search and Filter Section */}
        <div className="flex items-center justify-between bg-pink-100 p-4 rounded-lg mb-4">
          <input
            type="text"
            placeholder="search User"
            className="w-full max-w-sm p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-pink-200"
          />
          <button className="ml-4 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
            Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="table-auto w-full border-collapse">
            <thead className="bg-pink-200">
              <tr>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-800">User No</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-800">User ID</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-800">Phone</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-800">Emails</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-800">Reported by</th>
                <th className="py-2 px-4 text-left text-sm font-semibold text-gray-800">Reason</th>
                <th className="py-2 px-4 text-center text-sm font-semibold text-gray-800">Block User</th>
                <th className="py-2 px-4 text-center text-sm font-semibold text-gray-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={user.userNo}
                  className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} border-b`}
                >
                  <td className="py-3 px-4 text-sm text-gray-700">{user.userNo}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{user.userId}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{user.phone}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{user.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{user.reportedBy}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{user.reason}</td>
                  <td className="py-3 px-4 text-center">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-pink-500"
                        checked={user.blocked}
                        onChange={() => toggleBlock(index)}
                      />
                    </label>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button className="text-gray-500 hover:text-gray-700">
                      <FaEllipsisV />
                    </button>
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

export default ReportedUser;

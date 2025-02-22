import React, { useState, useEffect } from "react";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Sidebar from "../sidebar/Sidebar";

// InactiveUser Component
const InactiveUser = () => {
    const [accessToken, setAccessToken] = useState(null);
    const [userData, setUserData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Retrieve the access token from localStorage
    useEffect(() => {
        const token = reactLocalStorage.get("access_token");
        if (token) {
            setAccessToken(token); // Set the token to state
        }
    }, []);

    const handleUserClick = (userId) => {
        navigate(`/user/${userId}`);
      };

    // Fetch inactive users when the component mounts
    useEffect(() => {
        if (accessToken) {
            axios
                .get("http://localhost:3000/api/dashboard/get-in-active-user", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`, // Send token in the header
                    },
                })
                .then((response) => {
                    if (response.data.message === "Inactive users retrieved and status updated successfully.") {
                        setUserData(response.data.data); // Set the user data from the response
                    }
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching inactive users:", error);
                    setLoading(false);
                });
        }
    }, [accessToken]);

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
                    <DashboardCard title="Total Users" value="2.80M" change="+6.08%" bgColor="bg-blue-100" />
                    <DashboardCard title="Active Users" value="2,318" change="+6.08%" bgColor="bg-green-100" />
                    <DashboardCard title="Inactive Users" value="2,318" change="-6.08%" bgColor="bg-red-100" />
                    <DashboardCard title="Blocked/Reported Users" value="2,318" change="+6.08%" bgColor="bg-red-100" />
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
                            <tr  onClick={() => handleUserClick(user.userId)} >
                                <th className="px-6 py-3 text-gray-600 font-medium">SN</th>
                                <th className="px-6 py-3 text-gray-600 font-medium">Name</th>
                                <th className="px-6 py-3 text-gray-600 font-medium">Email</th>
                                <th className="px-6 py-3 text-gray-600 font-medium">Last Logged In</th>
                                <th className="px-6 py-3 text-gray-600 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4">
                                        Loading...
                                    </td>
                                </tr>
                            ) : (
                                userData.map((user, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="px-6 py-4">{user.s_n}</td>
                                        <td className="px-6 py-4">{user.name}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">{new Date(user.last_logged_in).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-white ${
                                                    user.status === "Inactive" ? "bg-red-500" : "bg-green-500"
                                                }`}
                                            >
                                                {user.status === "Inactive" ? "Inactive" : "Active"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
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
        <div className={`p-6 rounded-lg shadow-md ${bgColor} flex flex-col justify-between text-center`}>
            <h4 className="text-gray-600 font-medium">{title}</h4>
            <h2 className="text-2xl font-bold">{value}</h2>
            <p className={`mt-2 ${change.includes("+") ? "text-green-600" : "text-red-600"}`}>
                {change}
            </p>
        </div>
    );
};

export default InactiveUser;

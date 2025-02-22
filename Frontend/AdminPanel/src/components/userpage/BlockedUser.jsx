import React, { useState, useEffect } from "react";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Sidebar from "../sidebar/Sidebar";
import UserBar from "./UserBar";

const BlockedUser = () => {
    const [accessToken, setAccessToken] = useState(null);
    const [userData, setUserData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = reactLocalStorage.get("access_token");
        if (token) {
            setAccessToken(token);
        }
    }, []);

    useEffect(() => {
        if (accessToken) {
            axios
                .get("http://localhost:3000/api/dashboard/get-blocked-user", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
                .then((response) => {
                    if (response.data.message === "Blocked users retrieved successfully.") {
                        setUserData(response.data.data);
                    }
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching blocked users:", error);
                    setLoading(false);
                });
        }
    }, [accessToken]);

    const handleUserClick = (userId) => {
        navigate(`/user/${userId}`);
      };
      
    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <div className="w-64 bg-white shadow-md">
                <Sidebar />
            </div>

            <div className="flex-1 p-6">
                <UserBar/>
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-gray-600 font-medium">SN</th>
                                <th className="px-6 py-3 text-gray-600 font-medium">Name</th>
                                <th className="px-6 py-3 text-gray-600 font-medium">Email</th>
                                <th className="px-6 py-3 text-gray-600 font-medium">Reason</th>
                                <th className="px-6 py-3 text-gray-600 font-medium">Active</th>
                                <th className="px-6 py-3 text-gray-600 font-medium">Action</th>
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
                                    <tr key={index} className="border-b">
                                        <td className="px-6 py-4">{user.s_n}</td>
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
                                                onClick={() => console.log("Action clicked for", user.id)}
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
        </div>
    );
};

export default BlockedUser;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";
import Sidebar from "../sidebar/Sidebar";
import UserBar from "./UserBar";

const UserPage = () => {
  const [userData, setUserData] = useState([]);
  const [accessToken, setAccessToken] = useState(null);
  const navigate = useNavigate(); // Hook for navigation

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
          const response = await axios.get("http://localhost:3000/api/dashboard/all", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          setUserData(response.data.data);
        } catch (error) {
          console.error("Error fetching data", error);
        }
      };

      fetchData();
    }
  }, [accessToken]);

  console.log("User",userData)
  // Navigate to UserProfile when a user is clicked
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
        <UserBar />

        {/* User Table */}
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-gray-600 font-medium">User No</th>
                <th className="px-6 py-3 text-gray-600 font-medium">User ID</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Location</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Email</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Age</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Destination Country</th>
                <th className="px-6 py-3 text-gray-600 font-medium">Joined Date</th>
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
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4">{user.location}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{user.age}</td>
                  <td className="px-6 py-4">{user.destination_country}</td>
                  <td className="px-6 py-4">{user.last_login ? user.last_login : "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserPage;

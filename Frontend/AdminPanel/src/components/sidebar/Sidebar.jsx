import React, { useEffect, useState } from "react";
import { FaTachometerAlt, FaUsers, FaBell, FaFileAlt, FaQuestionCircle, FaTags } from "react-icons/fa";
import { BiLogOut } from "react-icons/bi";
import { MdPrivacyTip } from "react-icons/md";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { reactLocalStorage } from "reactjs-localstorage";

const Sidebar = () => {
  const [activeMenu, setActiveMenu] = useState(""); // Tracks which menu is expanded
  const [accessToken, setAccessToken] = useState(null);
  const [getUserData, setUserData] = useState({
    name: "",
    email: "",
    role: "",
  });

  // Function to toggle the active menu
  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? "" : menu);
  };

  useEffect(() => {
    const token = reactLocalStorage.get("access_token");
    if (token) {
      setAccessToken(token); // Set token to state
    }
  }, []);

  // UseEffect to fetch data once the token is available
  useEffect(() => {
    if (accessToken) {
      axios
        .get("http://localhost:3000/api/dashboard/getUserinfo", {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Include the access token in the Authorization header
          },
        })
        .then((res) => {
          setUserData(res.data.data); // Accessing the data field from the response
        })
        .catch((error) => {
          console.error("Error fetching user stats:", error);
        });
    }
  }, [accessToken]);

  return (
    <div className="h-screen w-64 bg-white shadow-md flex flex-col">
      {/* Logo/Title */}
      <div className="py-4 px-6 bg-blue-700 text-white text-center font-bold text-lg">
        Admin Panel
      </div>

      {/* Navigation Menu */}
      <div className="flex-grow">
        <ul className="mt-4 space-y-2">
          <li className="px-6 py-3 hover:bg-blue-100 cursor-pointer flex items-center space-x-3 text-blue-700">
            <FaTachometerAlt className="text-lg" />
            <NavLink to="/dashboard">Dashboard</NavLink>
          </li>

          {/* Users Section */}
          <li
            className="px-6 py-3 hover:bg-blue-100 cursor-pointer flex items-center justify-between"
            onClick={() => toggleMenu("users")}
          >
            <div className="flex items-center space-x-3">
              <FaUsers className="text-lg" />
              <span>Users</span>
            </div>
            <span>{activeMenu === "users" ? "-" : "+"}</span>
          </li>
          {activeMenu === "users" && (
            <ul className="ml-8 space-y-2">
              <li>
                <NavLink to="/user/all">All Users</NavLink>
              </li>
              <li>
                <NavLink to="/user/active">Active Users</NavLink>
              </li>
              <li>
                <NavLink to="/user/inActive">Inactive Users</NavLink>
              </li>
              <li>
                <NavLink to="/user/blocked">Blocked Users</NavLink>
              </li>
            </ul>
          )}

          {/* Posts Section */}
          <li
            className="px-6 py-3 hover:bg-blue-100 cursor-pointer flex items-center justify-between"
            onClick={() => toggleMenu("posts")}
          >
            <div className="flex items-center space-x-3">
              <FaFileAlt className="text-lg" />
              <span>Posts</span>
            </div>
            <span>{activeMenu === "posts" ? "-" : "+"}</span>
          </li>
          {activeMenu === "posts" && (
            <ul className="ml-8 space-y-2">
              <li>
                <NavLink to="/posts/all">All Posts</NavLink>
              </li>
              <li>
                <NavLink to="/posts/blocked">Blocked Posts</NavLink>
              </li>
            </ul>
          )}

          {/* Categories Section */}
          <li
            className="px-6 py-3 hover:bg-blue-100 cursor-pointer flex items-center justify-between"
            onClick={() => toggleMenu("categories")}
          >
            <div className="flex items-center space-x-3">
              <FaTags className="text-lg" />
              <span>Categories</span>
            </div>
            <span>{activeMenu === "categories" ? "-" : "+"}</span>
          </li>
          {activeMenu === "categories" && (
            <ul className="ml-8 space-y-2">
              <li>
                <NavLink to="/allCategory">All Categories</NavLink>
              </li>
              <li>
                <NavLink to="/categories/blocked">Blocked Categories</NavLink>
              </li>
            </ul>
          )}

          {/* Notifications Section */}
          <li
            className="px-6 py-3 hover:bg-blue-100 cursor-pointer flex items-center justify-between"
            onClick={() => toggleMenu("notifications")}
          >
            <div className="flex items-center space-x-3">
              <FaBell className="text-lg" />
              <span>Notifications</span>
            </div>
            <span>{activeMenu === "notifications" ? "-" : "+"}</span>
          </li>
          {activeMenu === "notifications" && (
            <ul className="ml-8 space-y-2">
              <li>
                <NavLink to="/notifications/all">All Notifications</NavLink>
              </li>
            </ul>
          )}

          {/* Other Static Links */}
          <li className="px-6 py-3 hover:bg-blue-100 cursor-pointer flex items-center space-x-3">
            <FaQuestionCircle className="text-lg" />
            <span>Post Categories</span>
          </li>
          <li className="px-6 py-3 hover:bg-blue-100 cursor-pointer flex items-center space-x-3">
            <FaFileAlt className="text-lg" />
            <span>Terms & Condition</span>
          </li>
          <li className="px-6 py-3 hover:bg-blue-100 cursor-pointer flex items-center space-x-3">
            <MdPrivacyTip className="text-lg" />
            <span>Privacy Policy</span>
          </li>
        </ul>
      </div>

      {/* User Profile Section */}
      <div className="px-6 py-4 border-t mt-auto">
        <div className="flex items-center space-x-3">
          <img
            src="https://via.placeholder.com/40"
            alt="Profile"
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h4 className="text-gray-700 font-medium">{getUserData.name}</h4>
            <span className="text-blue-500 text-sm bg-blue-100 rounded px-2 py-1">
              {getUserData.role}
            </span>
          </div>
        </div>
        <div className="mt-4">
          <button className="w-full flex items-center justify-center py-2 text-red-500 bg-red-100 rounded hover:bg-red-200">
            <BiLogOut className="text-lg mr-2" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

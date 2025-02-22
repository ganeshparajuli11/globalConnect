import React, { useEffect, useState } from "react";
import {
  FaTachometerAlt,
  FaUsers,
  FaBell,
  FaFileAlt,
  FaTags,
  FaFileContract, // Terms & Conditions
  FaUserShield,   // Admin Management
  FaComments,     // Chat
} from "react-icons/fa";
import { BiLogOut } from "react-icons/bi";
import { MdPrivacyTip } from "react-icons/md";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Sidebar = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState(""); // For sections with toggles
  const [accessToken, setAccessToken] = useState(null);
  const [getUserData, setUserData] = useState({
    name: "",
    email: "",
    role: "",
  });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Toggle function for sections with submenus (except Admin Management)
  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? "" : menu);
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setAccessToken(token);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  useEffect(() => {
    if (accessToken) {
      axios
        .get("http://localhost:3000/api/dashboard/getUserinfo", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((res) => {
          setUserData(res.data.data);
        })
        .catch((error) => {
          console.error("Error fetching user stats:", error);
        });
    }
  }, [accessToken]);

  // Keep sidebar toggles open for certain sections
  useEffect(() => {
    if (location.pathname.startsWith("/user")) {
      setActiveMenu("users");
    } else if (location.pathname.startsWith("/posts")) {
      setActiveMenu("posts");
    } else if (location.pathname.startsWith("/categories")) {
      setActiveMenu("categories");
    } else if (location.pathname.startsWith("/notifications")) {
      setActiveMenu("notifications");
    }
  }, [location.pathname]);

  return (
    <div className="h-screen w-64 bg-white shadow-md flex flex-col">
      <div className="py-4 px-6 bg-blue-700 text-white text-center font-bold text-lg">
        Admin Panel
      </div>

      {/* Navigation Menu */}
      <div className="flex-grow">
        <ul className="mt-4 space-y-2">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-6 py-3 flex items-center space-x-3 ${
                  isActive ? "bg-blue-100 text-blue-700 font-bold" : "hover:bg-blue-100 text-gray-700"
                }`
              }
            >
              <FaTachometerAlt className="text-lg" />
              <span>Dashboard</span>
            </NavLink>
          </li>

          {/* Users Section */}
          <li onClick={() => toggleMenu("users")} className="cursor-pointer">
            <div
              className={`px-6 py-3 flex justify-between ${
                activeMenu === "users" ? "bg-blue-100" : "hover:bg-blue-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <FaUsers className="text-lg" />
                <span>Users</span>
              </div>
              <span>{activeMenu === "users" ? "-" : "+"}</span>
            </div>
          </li>
          {activeMenu === "users" && (
            <ul className="ml-8 space-y-2">
              {["all", "active", "inActive", "blocked"].map((type) => (
                <li key={type}>
                  <NavLink
                    to={`/user/${type}`}
                    className={({ isActive }) =>
                      `block py-2 ${
                        isActive ? "text-blue-700 font-bold" : "text-gray-700"
                      }`
                    }
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)} Users
                  </NavLink>
                </li>
              ))}
            </ul>
          )}

          {/* Posts Section */}
          <li onClick={() => toggleMenu("posts")} className="cursor-pointer">
            <div
              className={`px-6 py-3 flex justify-between ${
                activeMenu === "posts" ? "bg-blue-100" : "hover:bg-blue-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <FaFileAlt className="text-lg" />
                <span>Posts</span>
              </div>
              <span>{activeMenu === "posts" ? "-" : "+"}</span>
            </div>
          </li>
          {activeMenu === "posts" && (
            <ul className="ml-8 space-y-2">
              {["all", "report"].map((type) => (
                <li key={type}>
                  <NavLink to={`/posts/${type}`} className="block py-2 text-gray-700">
                    {type.charAt(0).toUpperCase() + type.slice(1)} Posts
                  </NavLink>
                </li>
              ))}
            </ul>
          )}

          {/* Categories Section */}
          <li onClick={() => toggleMenu("categories")} className="cursor-pointer">
            <div
              className={`px-6 py-3 flex justify-between ${
                activeMenu === "categories" ? "bg-blue-100" : "hover:bg-blue-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <FaTags className="text-lg" />
                <span>Categories</span>
              </div>
              <span>{activeMenu === "categories" ? "-" : "+"}</span>
            </div>
          </li>
          {activeMenu === "categories" && (
            <ul className="ml-8 space-y-2">
              <li>
                <NavLink to="/allCategory" className="block py-2 text-gray-700">
                  All Categories
                </NavLink>
              </li>
              <li>
                <NavLink to="/categories/blocked" className="block py-2 text-gray-700">
                  Blocked Categories
                </NavLink>
              </li>
            </ul>
          )}

          {/* Notifications Section */}
          <NavLink
            to="/notification"
            className={({ isActive }) =>
              `px-6 py-3 flex justify-between hover:bg-blue-100 ${
                isActive ? "bg-blue-100" : ""
              }`
            }
          >
            <div className="flex items-center space-x-3">
              <FaBell className="text-lg" />
              <span>Notifications</span>
            </div>
          </NavLink>

          {/* Chat Option */}
          <NavLink
            to="/message"
            className={({ isActive }) =>
              `px-6 py-3 flex justify-between hover:bg-blue-100 ${
                isActive ? "bg-blue-100" : ""
              }`
            }
          >
            <div className="flex items-center space-x-3">
              <FaComments className="text-lg" />
              <span>Chat</span>
            </div>
          </NavLink>

          {/* Static Links */}
          <li>
            <NavLink
              to="/privacyPolicy"
              className={({ isActive }) =>
                `px-6 py-3 flex items-center space-x-3 ${
                  isActive ? "bg-blue-100 text-blue-700 font-bold" : "hover:bg-blue-100 text-gray-700"
                }`
              }
            >
              <MdPrivacyTip className="text-lg" />
              <span>Privacy Policy</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/termsAndCondition"
              className={({ isActive }) =>
                `px-6 py-3 flex items-center space-x-3 ${
                  isActive ? "bg-blue-100 text-blue-700 font-bold" : "hover:bg-blue-100 text-gray-700"
                }`
              }
            >
              <FaFileContract className="text-lg" />
              <span>Terms &amp; Conditions</span>
            </NavLink>
          </li>

          {/* Admin Management Section: now a single link */}
          <li>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-6 py-3 flex items-center space-x-3 ${
                  isActive ? "bg-blue-100 text-blue-700 font-bold" : "hover:bg-blue-100 text-gray-700"
                }`
              }
            >
              <FaUserShield className="text-lg" />
              <span>Admin Management</span>
            </NavLink>
          </li>
        </ul>
      </div>

      {/* User Profile & Logout */}
      <div className="px-6 py-4 border-t mt-auto bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 text-white flex items-center justify-center rounded-full text-lg font-bold">
            {getUserData.name ? getUserData.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-semibold">
              {getUserData.name || "User"}
            </span>
            <span className="text-blue-600 text-xs bg-blue-100 rounded-full px-2 py-1">
              {getUserData.role || "Role"}
            </span>
          </div>
        </div>

        <button
          className="w-full flex items-center justify-center mt-4 py-2 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 transition"
          onClick={() => setShowLogoutDialog(true)}
        >
          <BiLogOut className="text-lg mr-2" />
          <span className="font-medium">Log out</span>
        </button>
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Are you sure you want to logout?
            </h2>
            <div className="mt-4 flex justify-center space-x-4">
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                onClick={handleLogout}
              >
                Yes, Logout
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                onClick={() => setShowLogoutDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

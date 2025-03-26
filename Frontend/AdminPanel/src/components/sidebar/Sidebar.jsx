import React, { useEffect, useState } from "react";
import {
  FaTachometerAlt,
  FaUsers,
  FaBell,
  FaFileAlt,
  FaTags,
  FaFileContract,
  FaUserShield,
  FaComments,
} from "react-icons/fa";
import { BiLogOut, BiChevronRight, BiChevronLeft } from "react-icons/bi";
import { MdPrivacyTip, MdEmail } from "react-icons/md";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const Sidebar = ({ setIsAuthenticated }) => {
  const API_BASE_URL = "http://localhost:3000";
  const navigate = useNavigate();
  const location = useLocation();

  // Tracks open/close status of submenus
  const [activeMenu, setActiveMenu] = useState("");

  // Collapsed sidebar toggle
  const [isCollapsed, setIsCollapsed] = useState(false);

  // For controlling the logout dialog
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Stores user data
  const [userData, setUserData] = useState({
    id: "",
    name: "",
    email: "",
    profile_image: "",
    role: "Admin", // or "userData.status" if you want to store user status
  });

  // Fetch the token once (on mount), and fetch user info
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      // Fetch user data once here
      axios
        .get(`${API_BASE_URL}/api/dashboard/getUserinfo`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          const user = res.data?.data?.user;
          if (user) {
            setUserData({
              id: user.id,
              name: user.name?.trim() ?? "",
              email: user.email,
              profile_image: user.profile_image,
              role: "Admin", // Replace with user.role or user.status if needed
            });
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    }
  }, []);

  // Keep submenus open based on URL path
  useEffect(() => {
    if (location.pathname.startsWith("/user")) {
      setActiveMenu("Users");
    } else if (location.pathname.startsWith("/posts")) {
      setActiveMenu("Posts");
    } else if (location.pathname.startsWith("/allCategory") || location.pathname.startsWith("/categories")) {
      setActiveMenu("Categories");
    } else if (location.pathname.startsWith("/notification")) {
      setActiveMenu("Notifications");
    }
  }, [location.pathname]);

  // Toggle a submenu open/close
  const toggleMenu = (menuTitle) => {
    setActiveMenu(activeMenu === menuTitle ? "" : menuTitle);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  // Menu items structure
  const menuItems = [
    {
      title: "Dashboard",
      icon: <FaTachometerAlt />,
      path: "/dashboard",
    },
    {
      title: "Users",
      icon: <FaUsers />,
      submenu: true,
      submenuItems: [
        { title: "All Users", path: "/user/all" },
        { title: "Active Users", path: "/user/active" },
        { title: "Inactive Users", path: "/user/inActive" },
        { title: "Blocked Users", path: "/user/blocked" },
        { title: "Reported Users", path: "/user/reported" },
      ],
    },
    {
      title: "Posts",
      icon: <FaFileAlt />,
      submenu: true,
      submenuItems: [
        { title: "All Posts", path: "/posts/all" },
        { title: "Reported Posts", path: "/posts/report" },
      ],
    },
    {
      title: "Categories",
      icon: <FaTags />,
      submenu: true,
      submenuItems: [
        { title: "All Categories", path: "/allCategory" },
        { title: "Blocked Categories", path: "/categories/blocked" },
      ],
    },
    {
      title: "Notifications",
      icon: <FaBell />,
      path: "/notification",
    },
    {
      title: "Email",
      icon: <MdEmail />,
      path: "/send-email",
    },
    {
      title: "Chat",
      icon: <FaComments />,
      path: "/message",
    },
    {
      title: "Privacy Policy",
      icon: <MdPrivacyTip />,
      path: "/privacyPolicy",
    },
    {
      title: "Terms & Conditions",
      icon: <FaFileContract />,
      path: "/termsAndCondition",
    },
    {
      title: "Admin Management",
      icon: <FaUserShield />,
      path: "/admin",
    },
  ];

  // Fallback image generator if the profile image fails
  const handleImageError = (e) => {
    // If the image is *already* using the fallback URL, stop here.
    if (e.target.src.includes("/api/avatar?name=")) {
      return;
    }
  
    // Otherwise, switch to the fallback URL. Trim the user’s name to remove trailing spaces.
    e.target.src = `${API_BASE_URL}/api/avatar?name=${encodeURIComponent(userData.name.trim())}`;
  };
  

  return (
    <div
      className={`h-screen flex flex-col justify-between bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* SIDEBAR HEADER */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {/* Brand / Title */}
        {!isCollapsed && (
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Admin Panel
          </div>
        )}

        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          {isCollapsed ? <BiChevronRight size={20} /> : <BiChevronLeft size={20} />}
        </button>
      </div>

      {/* MAIN MENU - scrollable area */}
      <div className="overflow-y-auto flex-1">
        {menuItems.map((item, index) =>
          item.submenu ? (
            <div key={index}>
              {/* Submenu parent */}
              <div
                onClick={() => toggleMenu(item.title)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  activeMenu === item.title ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-lg ${
                      activeMenu === item.title ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span
                      className={
                        activeMenu === item.title
                          ? "font-medium text-blue-600"
                          : "text-gray-700"
                      }
                    >
                      {item.title}
                    </span>
                  )}
                </div>
                {/* Chevron for submenu */}
                {!isCollapsed && (
                  <span
                    className={`transition-transform duration-200 ${
                      activeMenu === item.title ? "rotate-90 text-blue-600" : "text-gray-400"
                    }`}
                  >
                    <BiChevronRight />
                  </span>
                )}
              </div>
              {/* Submenu items */}
              {activeMenu === item.title && !isCollapsed && (
                <div className="bg-gray-50">
                  {item.submenuItems.map((subItem, subIndex) => (
                    <NavLink
                      key={subIndex}
                      to={subItem.path}
                      className={({ isActive }) =>
                        `block py-2 px-12 hover:bg-gray-100 transition-colors ${
                          isActive
                            ? "text-blue-600 font-medium bg-blue-50"
                            : "text-gray-600"
                        }`
                      }
                    >
                      {subItem.title}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Normal menu item
            <NavLink
              key={index}
              to={item.path}
              end
              className={({ isActive }) =>
                `flex items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
                  isActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                }`
              }
            >
              <span
                className={`text-lg ${
                  location.pathname === item.path ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {item.icon}
              </span>
              {!isCollapsed && <span className="ml-3">{item.title}</span>}
            </NavLink>
          )
        )}
      </div>

      {/* USER PROFILE SECTION */}
      <div className="border-t border-gray-200">
        {/* "inherit" width is tricky; let's ensure it spans entire sidebar width */}
        <div
          className={`flex items-center justify-between p-3 ${
            isCollapsed ? "w-20" : "w-64"
          } transition-all duration-300`}
        >
          {/* Avatar + Name/Role */}
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div>
              {userData.profile_image ? (
                <img
                  src={`${API_BASE_URL}${userData.profile_image}`}
                  alt={userData.name}
                  className="w-10 h-10 rounded-lg object-cover shadow-sm"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg font-medium shadow-sm">
                  {userData.name ? userData.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>

            {/* Name and Role, only if not collapsed */}
            {!isCollapsed && (
              <div className="leading-tight">
                <div className="text-sm font-semibold text-gray-900">
                  {userData.name || "User"}
                </div>
                
              </div>
            )}
          </div>

          {/* Logout Icon - only if not collapsed */}
          {!isCollapsed && (
            <button
              onClick={() => setShowLogoutDialog(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              title="Logout"
            >
              <BiLogOut size={18} />
            </button>
          )}
        </div>
      </div>

      {/* LOGOUT DIALOG */}
      {showLogoutDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white rounded-2xl p-6 w-[320px] shadow-xl transform transition-all scale-100">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BiLogOut className="text-2xl text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Logout
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to log out?
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                onClick={() => setShowLogoutDialog(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

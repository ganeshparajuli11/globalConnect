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
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  return (
    <div
      className={`h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Admin Panel
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          {isCollapsed ? <BiChevronRight size={20} /> : <BiChevronLeft size={20} />}
        </button>
      </div>

      {/* Main Navigation - Adjust height to accommodate new profile design */}
      <div className="overflow-y-auto h-[calc(100vh-64px)] pb-16">
        {/* Menu Items */}
        {menuItems.map((item, index) => (
          <div key={index}>
            {item.submenu ? (
              <>
                <div
                  onClick={() => toggleMenu(item.title)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    activeMenu === item.title ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg ${activeMenu === item.title ? "text-blue-600" : "text-gray-500"}`}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className={activeMenu === item.title ? "font-medium text-blue-600" : "text-gray-700"}>
                        {item.title}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className={`transition-transform duration-200 ${activeMenu === item.title ? "text-blue-600" : "text-gray-400"}`}>
                      {activeMenu === item.title ? <BiChevronRight className="rotate-90" /> : <BiChevronRight />}
                    </span>
                  )}
                </div>
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
              </>
            ) : (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700"
                  }`
                }
              >
                <span className={`text-lg ${location.pathname === item.path ? "text-blue-600" : "text-gray-500"}`}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="ml-3">{item.title}</span>}
              </NavLink>
            )}
          </div>
        ))}

        {/* User Profile - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 w-inherit bg-gray-50 border-t border-gray-200">
          <div className={`${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300`}>
            <div className="p-3 group relative">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg font-medium shadow-sm">
                    {getUserData.name ? getUserData.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  {/* Logout Button as a small icon on the avatar */}
                  <button
                    onClick={() => setShowLogoutDialog(true)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <BiLogOut className="text-red-500 text-sm" />
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {getUserData.name || "User"}
                    </div>
                    <div className="text-xs text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 inline-block">
                      {getUserData.role || "Role"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Dialog - More elegant design */}
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

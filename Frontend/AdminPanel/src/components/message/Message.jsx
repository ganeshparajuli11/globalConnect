import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../sidebar/Sidebar";
import { FaSearch, FaRegBell, FaEllipsisV, FaCircle } from "react-icons/fa";
import { IoFilterSharp } from "react-icons/io5";
import { Link } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";

// Socket.IO configuration
const socket = io("http://localhost:3000", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 3000,
  timeout: 10000
});

const Message = () => {
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all"); // all, online, unread
  const token = localStorage.getItem("access_token");
  const adminId = localStorage.getItem("adminId");

  // Fetch conversations with search
  const fetchConversations = useCallback(async (searchQuery = "") => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `http://localhost:3000/api/all-message/?searchQuery=${encodeURIComponent(searchQuery)}`
        : "http://localhost:3000/api/all-message/";

      const response = await axios.get(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        const conversationsData = response.data.data.conversations || response.data.data;
        console.log("user message", conversationsData);
        setMessages(conversationsData);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Handle search with debouncing
  const handleSearch = (value) => {
    setSearch(value);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debouncing
    const timeout = setTimeout(() => {
      fetchConversations(value);
    }, 300);

    setSearchTimeout(timeout);
  };

  // Setup socket connection and real-time updates
  useEffect(() => {
    if (!adminId) return;

    socket.connect();
    socket.emit("join", adminId);

    socket.on("updateOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("receiveMessage", (message) => {
      console.log("New message received:", message);
      fetchConversations(search);
    });

    socket.on("connect", () => {
      console.log("✅ Socket Connected");
      socket.emit("join", adminId);
    });

    socket.on("connect_error", (error) => {
      console.error("⚠️ Socket Connection Error:", error.message);
    });

    return () => {
      socket.off("updateOnlineUsers");
      socket.off("receiveMessage");
      socket.off("connect");
      socket.off("connect_error");
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [adminId, fetchConversations, search]);

  // Initial fetch of conversations
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const getProfilePicUrl = (avatar) => {
    if (!avatar) return "https://via.placeholder.com/40";
    return avatar.startsWith("http") ? avatar : `http://localhost:3000/${avatar}`;
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const truncateMessage = (message, length = 30) => {
    if (!message) return "";
    return message.length > length ? `${message.substring(0, length)}...` : message;
  };

  const filterMessages = () => {
    let filtered = [...messages];
    switch (activeFilter) {
      case "online":
        filtered = filtered.filter(msg => isUserOnline(msg.userId));
        break;
      case "unread":
        filtered = filtered.filter(msg => msg.unreadCount > 0);
        break;
      default:
        break;
    }
    return filtered;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <FaRegBell className="w-6 h-6" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <FaEllipsisV className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Search and Filters */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-6">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search messages or users..."
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {loading && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className={`px-4 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 ${activeFilter === "all"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  onClick={() => setActiveFilter("all")}
                >
                  <IoFilterSharp className="h-5 w-5" />
                  <span>All</span>
                </button>
                <button
                  className={`px-4 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 ${activeFilter === "online"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  onClick={() => setActiveFilter("online")}
                >
                  <FaCircle className="h-3 w-3 text-green-500" />
                  <span>Online</span>
                </button>
                <button
                  className={`px-4 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 ${activeFilter === "unread"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  onClick={() => setActiveFilter("unread")}
                >
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  <span>Unread</span>
                </button>
              </div>
            </div>

            {/* Messages List */}
            <div className="space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
              {filterMessages().length > 0 ? (
                filterMessages().map((msg) => (
                  <Link
                    to={`/chat/${msg.userId}`}
                    key={msg.userId}
                    onClick={() => console.log("Navigating to chat with userId:", msg.userId)}
                    className="block transform transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4">
                      <div className="flex items-start space-x-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={getProfilePicUrl(msg.avatar)}
                            alt={msg.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-gray-100"
                          />
                          {isUserOnline(msg.userId) && (
                            <span className="absolute bottom-0 right-0 block w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900 truncate">{msg.name}</h2>
                            <div className="flex items-center space-x-2">
                              {msg.unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-500 text-xs font-medium">
                                  {msg.unreadCount}
                                </span>
                              )}
                              <span className="text-sm text-gray-400">{formatTime(msg.timestamp)}</span>
                            </div>
                          </div>
                          <div className="mt-1">
                            {msg.hasMessages ? (
                              <p className="text-sm text-gray-500 truncate">
                                {truncateMessage(msg.lastMessage)}
                              </p>
                            ) : (
                              <p className="text-sm text-blue-500">Start a new conversation</p>
                            )}
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-xs text-gray-400">{msg.email}</span>
                            {!msg.hasMessages && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-500">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100">
                    <FaSearch className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {loading ? "Searching..." : search ? "No matches found" : "No conversations yet"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {!loading && !search && "Start by searching for users to chat with"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;

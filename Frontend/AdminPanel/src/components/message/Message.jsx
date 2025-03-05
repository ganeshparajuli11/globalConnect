import React, { useEffect, useState, useCallback } from "react";
import Sidebar from "../sidebar/Sidebar";
import { FaSearch } from "react-icons/fa";
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
  const token = localStorage.getItem("access_token");
  const adminId = localStorage.getItem("adminId");

  // Fetch conversations with search
  const fetchConversations = useCallback(async (searchQuery = "") => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `http://localhost:3000/api/admin/all-message/?searchQuery=${encodeURIComponent(searchQuery)}`
        : "http://localhost:3000/api/admin/all-message/";

      const response = await axios.get(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        const conversationsData = response.data.data.conversations || response.data.data;
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

  return (
    <div className="flex">
      <Sidebar />
      <div className="w-full p-4">
        {/* Search Box */}
        <div className="flex items-center bg-gray-100 px-4 py-3 rounded-lg shadow-sm">
          <FaSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search any user by name or email..."
            className="bg-transparent outline-none px-3 py-1 w-full text-gray-700"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
          )}
        </div>

        {/* Conversations List */}
        <div className="mt-6 space-y-4">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <Link to={`/chat/${msg.userId}`} key={msg.userId} className="block">
                <div className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-150">
                  <div className="relative">
                    <img
                      src={getProfilePicUrl(msg.avatar)}
                      alt={msg.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {isUserOnline(msg.userId) && (
                      <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-gray-900">{msg.name}</h4>
                      {msg.timestamp && (
                        <span className="text-xs text-gray-500">{formatTime(msg.timestamp)}</span>
                      )}
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-sm text-gray-600 mt-1">
                        {msg.hasChat ? truncateMessage(msg.lastMessage) : (
                          <span className="text-blue-500">Start a new conversation</span>
                        )}
                      </p>
                      {msg.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          {msg.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">{msg.email}</p>
                      {!msg.hasChat && (
                        <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                          New Chat
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {loading ? "Loading..." : search ? "No users found" : "No conversations yet"}
              </p>
              {!loading && !search && (
                <p className="text-sm text-gray-400 mt-2">
                  Search for users to start a conversation
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;

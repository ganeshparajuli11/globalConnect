import React, { useEffect, useState } from "react";
import Sidebar from "../sidebar/Sidebar";
import { FaSearch } from "react-icons/fa";
import { Link } from "react-router-dom";
import io from "socket.io-client";

// Connect to the Socket.IO server
const socket = io("http://localhost:3000");

const Message = () => {
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Setup socket connection and listen for online users update
  useEffect(() => {
    const adminId = localStorage.getItem("adminId");
    if (adminId) {
      socket.emit("join", adminId);
    }
    socket.on("updateOnlineUsers", (users) => {
      setOnlineUsers(users);
    });
    return () => {
      socket.off("updateOnlineUsers");
    };
  }, []);

  // Fetch admin conversations from the API
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch("http://localhost:3000/api/admin/all-message/", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        if (data.success) {
          setMessages(data.data);
        }
      } catch (error) {
        console.error("Error fetching admin conversations:", error);
      }
    };

    fetchConversations();
  }, []);

  // Helper: Convert relative avatar path to full URL
  const getProfilePicUrl = (avatar) => {
    if (avatar && avatar.startsWith("http")) {
      return avatar;
    }
    return `http://localhost:3000/${avatar}`;
  };

  // Check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Filter conversations based on search input
  const filteredMessages = messages.filter((msg) =>
    msg.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex">
      <Sidebar />
      <div className="w-full p-4">
        {/* Search Box */}
        <div className="flex items-center bg-gray-100 px-3 py-2 rounded-md">
          <FaSearch className="text-gray-500" />
          <input
            type="text"
            placeholder="Search user..."
            className="bg-transparent outline-none px-2 py-1 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Conversations List */}
        <div className="mt-4 space-y-3">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((msg, index) => (
              <Link to={`/chat/${msg.userId}`} key={index} className="block">
                <div className="flex items-center p-3 bg-white rounded-md shadow-sm hover:bg-gray-100 cursor-pointer">
                  <div className="relative">
                    <img
                      src={getProfilePicUrl(msg.avatar)}
                      alt={msg.name}
                      className="w-10 h-10 rounded-full"
                    />
                    {isUserOnline(msg.userId) && (
                      <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className="text-md font-semibold">{msg.name}</h4>
                    <p className="text-gray-500 text-sm">{msg.lastMessage}</p>
                  </div>
                  <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 mt-4 text-center">No messages found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;

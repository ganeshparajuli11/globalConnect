import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import Sidebar from "../sidebar/Sidebar";

const GET_MESSAGES_URL = "http://localhost:3000/api/admin/get-message";
const SEND_MESSAGE_URL = "http://localhost:3000/api/message";
const SOCKET_SERVER_URL = "http://localhost:3000";

const ChatPage = () => {
  // Extract conversation partner's ID from URL (renamed as receiverId)
  const { id: receiverId } = useParams();
  console.log("receiver id ", receiverId);

  // Admin's ID and token from localStorage
  const adminId = localStorage.getItem("adminId");
  const token = localStorage.getItem("access_token");

  const [messages, setMessages] = useState([]);
  const [targetUser, setTargetUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Setup Socket.IO connection for real-time updates
  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL, {
      query: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
      timeout: 10000,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Socket Connected");
      setSocketConnected(true);
      // Join with admin's id
      socketRef.current.emit("join", adminId);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("⚠️ Socket Connection Error:", error.message);
      setSocketConnected(false);
    });

    // Listen for incoming messages
    socketRef.current.on("receiveMessage", (message) => {
      console.log("📩 Received message:", message);
      if (
        (message.senderId === adminId && message.receiverId === receiverId) ||
        (message.senderId === receiverId && message.receiverId === adminId)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            _id: message._id || Date.now().toString(),
            sender: {
              _id: message.senderId,
              name: message.senderId === adminId ? "You" : targetUser?.name,
            },
            content: message.content,
            messageType: message.messageType,
            timestamp: message.timestamp,
            isAdmin: message.isAdmin,
          },
        ]);
        scrollToBottom();
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("connect_error");
        socketRef.current.off("receiveMessage");
        socketRef.current.disconnect();
      }
    };
  }, [receiverId, token, adminId, targetUser]);

  // Fetch conversation for admin:
  // The admin API expects { userId: <conversation partner's ID> } in the request body.
  const fetchConversation = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        GET_MESSAGES_URL,
        { userId: receiverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setMessages(response.data.data);
        if (response.data.data.length > 0) {
          const firstMsg = response.data.data[0];
          // Determine partner: if the first message's sender is "You", use receiver; otherwise, sender.
          const partner =
            firstMsg.sender.name === "You" ? firstMsg.receiver : firstMsg.sender;
          setTargetUser(partner);
        }
      } else {
        console.error("Failed to fetch messages", response.data);
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [receiverId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send new message with HTTP API and socket emission
  const sendMessageFunc = async () => {
    if (!newMessage.trim() || !socketConnected) return;

    try {
      const messageData = {
        receiverId, // conversation partner's id
        messageType: "text",
        content: newMessage,
      };

      const response = await axios.post(
        SEND_MESSAGE_URL,
        messageData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const sentMessage = {
          _id: response.data.data._id,
          sender: { _id: adminId, name: "You" },
          receiver: targetUser || { _id: receiverId },
          messageType: "text",
          content: newMessage,
          timestamp: new Date(response.data.data.timestamp),
          isAdmin: true,
        };
        setMessages((prev) => [...prev, sentMessage]);
        setNewMessage("");
        scrollToBottom();

        socketRef.current.emit(
          "sendMessage",
          {
            senderId: adminId,
            receiverId,
            messageType: "text",
            content: newMessage,
            timestamp: Date.now(),
            isAdmin: true,
          },
          (res) => {
            if (res.status === "error") {
              console.error("Socket message delivery failed:", res.error);
            }
          }
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const getProfilePicUrl = (avatar) => {
    if (!avatar) return "https://via.placeholder.com/100";
    return avatar.startsWith("http") ? avatar : `http://localhost:3000/${avatar}`;
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center">
          {targetUser && (
            <>
              <div className="relative">
                <img
                  src={getProfilePicUrl(targetUser.avatar)}
                  alt={targetUser.name}
                  className="w-10 h-10 rounded-full"
                />
                <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="ml-3">
                <h4 className="font-semibold">{targetUser.name}</h4>
                <span className="text-green-500 text-xs">Online</span>
              </div>
            </>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {loading ? (
            <p>Loading messages...</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`mb-2 flex ${
                  msg.sender.name === "You" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`p-2 rounded-lg max-w-xs ${
                    msg.sender.name === "You"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span className="text-xs block text-right">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-l-lg outline-none"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessageFunc();
              }}
            />
            <button
              className="p-2 bg-blue-500 text-white rounded-r-lg"
              onClick={sendMessageFunc}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

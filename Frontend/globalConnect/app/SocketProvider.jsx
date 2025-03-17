import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import config from "../constants/config";

const SOCKET_URL = `http://${config.API_IP}:3000`;

const SocketContext = createContext();

const SocketProvider = ({ children, userId }) => {
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const socketRef = useRef(null);

  useEffect(() => {
    if (userId) {
      const connectWithRetry = async () => {
        try {
          // Create the socket instance only once
          if (!socketRef.current) {
              socketRef.current = io(SOCKET_URL, {
                transports: ["websocket"],
                autoConnect: false,
                reconnection: true,
                reconnectionAttempts: MAX_RECONNECT_ATTEMPTS, // Use MAX_RECONNECT_ATTEMPTS
                reconnectionDelay: 2000, // Start with a 2-second delay
                timeout: 10000,
              });
          }
          socketRef.current.connect();
          socketRef.current.on("connect", () => {
              console.log("Socket Connected");
              socketRef.current.emit("join", userId);
              setSocketConnected(true);
              setConnectionError(null);
              setReconnectAttempts(0);
          });

          socketRef.current.on("connect_error", (err) => {
            console.error("Socket connection error:", err.message);
            setConnectionError(err.message); // Provide error message to UI
            handleReconnect();
          });

          socketRef.current.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
            setSocketConnected(false);
            handleReconnect();
          });

          socketRef.current.on("receiveMessage", (message) => {
            console.log("Message received:", message);
            // Dispatch message to your message handling logic
          });

          // Add other event listeners here

        } catch (error) {
          console.error("Socket connection failed:", error);
          setConnectionError("Failed to connect to the server. Please check your internet connection.");
        }
      };

      const handleReconnect = () => {
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              const delay = 2000 * (2 ** reconnectAttempts); // Exponential backoff
              setTimeout(() => {
                  connectWithRetry();
                  setReconnectAttempts(reconnectAttempts + 1);
              }, delay);
          } else {
              setConnectionError("Failed to connect after multiple attempts.");
              console.error('Max reconnect attempts reached!');
          }
      }

      connectWithRetry();

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current.off("connect");
          socketRef.current.off("connect_error");
          socketRef.current.off("disconnect");
          socketRef.current.off("receiveMessage");
          socketRef.current = null; // Important: Reset the reference
          }
        setSocketConnected(false);
        setConnectionError(null);
        setReconnectAttempts(0);
      };
    }
  }, [userId, reconnectAttempts]);

  const sendSocketMessage = (messageData) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !socketRef.current.connected) {
        reject(new Error("Socket not connected"));
        return;
      }
      socketRef.current.emit("sendMessage", messageData, (response) => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || "Message not delivered"));
        }
      });
    });
  };

  const value = {
    socket: socketRef.current,
    socketConnected,
    sendSocketMessage,
    connectionError,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export default SocketProvider;

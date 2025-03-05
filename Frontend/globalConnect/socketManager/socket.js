import { io } from "socket.io-client";
import config from "../constants/config";

const SOCKET_URL = `http://${config.API_IP}:3000`;

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 3000,
  timeout: 10000,
});

let messageCallback = null;
let connectionRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 5;
let heartbeatInterval = null;

// Set message callback handler
export const setMessageHandler = (callback) => {
  messageCallback = callback;
};

// Connect socket and setup listeners with enhanced error handling
export const connectSocket = (userId) => {
  return new Promise((resolve, reject) => {
    if (!userId) {
      console.error("Cannot connect socket: Missing userId");
      reject(new Error("Missing userId"));
      return;
    }

    console.log(`🔗 Attempting to connect socket for user: ${userId}`);

    if (!socket.connected) {
      socket.connect();
    }

    // Clear any existing heartbeat interval
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    // Remove any existing listeners to prevent duplicates
    socket.removeAllListeners();

    // Handle successful connection
    socket.on("connect", () => {
      console.log("✅ Socket Connected, socket ID:", socket.id);
      // Emit join event after successful connection
      socket.emit("join", userId);

      // Start sending heartbeats
      heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit("heartbeat", userId);
        }
      }, 25000); // Send heartbeat every 25 seconds
    });

    // Handle join acknowledgment
    socket.on("joinAcknowledged", (response) => {
      if (response.success) {
        console.log(`✅ Successfully joined with socket ID: ${response.socketId}`);
        connectionRetryCount = 0;
        resolve(socket);
      } else {
        console.error("Failed to join:", response.error);
        reject(new Error(response.error));
      }
    });

    // Handle heartbeat acknowledgment
    socket.on("heartbeatAck", () => {
      console.log("💓 Heartbeat acknowledged");
    });

    // Setup message listener with error handling
    socket.on("receiveMessage", (message) => {
      try {
        console.log("📩 New Message Received:", message);
        if (messageCallback) {
          messageCallback(message);
        }
      } catch (error) {
        console.error("Error processing received message:", error);
      }
    });

    // Enhanced connection event handlers
    socket.on("connect_error", (err) => {
      console.error("⚠️ Socket Connection Error:", err.message);
      connectionRetryCount++;
      
      if (connectionRetryCount >= MAX_RETRY_ATTEMPTS) {
        console.error("Max reconnection attempts reached. Please check your connection.");
        socket.disconnect();
        reject(new Error("Max reconnection attempts reached"));
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket Disconnected:", reason);
      // Clear heartbeat interval on disconnect
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }

      if (reason === "io server disconnect") {
        // Server initiated disconnect - attempt to reconnect
        setTimeout(() => {
          if (connectionRetryCount < MAX_RETRY_ATTEMPTS) {
            console.log("Attempting to reconnect...");
            socket.connect();
          }
        }, 3000);
      }
    });

    socket.on("reconnect", (attempt) => {
      console.log(`🔄 Socket Reconnected (Attempt ${attempt})`);
      socket.emit("join", userId);
    });

    socket.on("error", (error) => {
      console.error("Socket Error:", error);
      reject(error);
    });

    // Set timeout for initial connection
    const connectionTimeout = setTimeout(() => {
      if (!socket.connected) {
        console.error("Socket connection timeout");
        reject(new Error("Connection timeout"));
      }
    }, 10000);

    // Clear timeout if connected successfully
    socket.on("connect", () => {
      clearTimeout(connectionTimeout);
    });
  });
};

// Send message through socket with enhanced error handling and timeout
export const sendSocketMessage = (messageData) => {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      reject(new Error("Socket not connected"));
      return;
    }

    // Add timeout for message delivery
    const timeout = setTimeout(() => {
      reject(new Error("Message delivery timeout"));
    }, 10000);

    socket.emit("sendMessage", messageData, (response) => {
      clearTimeout(timeout);
      
      if (response && (response.status === "delivered" || response.status === "stored")) {
        resolve(response);
      } else {
        reject(new Error(response?.error || "Message not delivered"));
      }
    });
  });
};

// Disconnect socket with cleanup
export const disconnectSocket = () => {
  if (socket.connected) {
    console.log("🔌 Disconnecting Socket...");
    socket.removeAllListeners();
    socket.disconnect();
    connectionRetryCount = 0;
  }
};

// Check socket connection status
export const isSocketConnected = () => {
  return socket.connected;
};

// Get current retry count
export const getConnectionRetryCount = () => {
  return connectionRetryCount;
};

// Cleanup function to be called when component unmounts or app closes
export const cleanup = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  disconnectSocket();
};

export default socket;

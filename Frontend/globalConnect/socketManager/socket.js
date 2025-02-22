import { io } from "socket.io-client";
import config from "../constants/config";

const SOCKET_URL = `http://${config.API_IP}:3000`;

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false, // Prevent auto connection before login
  reconnection: true, // Auto-reconnect on disconnection
  reconnectionAttempts: 10, // Retry up to 10 times
  reconnectionDelay: 3000, // Wait 3 seconds between reconnection attempts
});

// ✅ Function to join socket and listen for messages
export const connectSocket = (userId) => {
  if (!socket.connected) {
    socket.connect();
  }

  console.log(`🔗 Connecting socket for user: ${userId}`);

  // Remove previous listeners to avoid duplicates
  socket.off("receiveMessageAcknowledged");
  socket.off("receiveMessage");

  socket.emit("join", userId);

  // Request to receive messages
  socket.emit("receiveMessageRequest", userId);

  socket.on("receiveMessageAcknowledged", (data) => {
    console.log(`✅ Listening for messages: ${data.message}`);
  });

  socket.on("receiveMessage", (message) => {
    console.log("📩 New Message Received:", message);
    // Here you can update your UI state
  });

  socket.on("connect_error", (err) => {
    console.error("⚠️ WebSocket Connection Error:", err.message);
  });

  socket.on("disconnect", () => {
    console.log("🔌 WebSocket Disconnected.");
  });

  socket.on("reconnect", (attempt) => {
    console.log(`🔄 Reconnected to WebSocket (Attempt ${attempt})`);
    socket.emit("join", userId); // Ensure user rejoins on reconnect
  });
};

// ✅ Function to send a message
export const sendMessage = (messageData) => {
  if (socket.connected) {
    socket.emit("sendMessage", messageData);
  } else {
    console.error("❌ Cannot send message: Socket is not connected.");
  }
};

// ✅ Function to disconnect socket properly
export const disconnectSocket = () => {
  if (socket.connected) {
    console.log("🔌 Disconnecting WebSocket...");
    socket.off("receiveMessageAcknowledged");
    socket.off("receiveMessage");
    socket.off("connect_error");
    socket.off("disconnect");
    socket.off("reconnect");
    socket.disconnect();
  }
};

// Export the socket instance
export default socket;

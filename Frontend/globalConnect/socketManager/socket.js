import { io } from "socket.io-client";
import config from "../constants/config";

const SOCKET_URL = `http://${config.API_IP}:3000`;

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  autoConnect: false,
});

// Function to join socket and listen for messages
export const connectSocket = (userId) => {
  socket.connect();
  socket.emit("join", userId);
  
  // Request to receive messages
  socket.emit("receiveMessageRequest", userId);

  socket.on("receiveMessageAcknowledged", (data) => {
    console.log(data.message); // Confirms user is listening
  });

  socket.on("receiveMessage", (message) => {
    console.log("New Message Received:", message);
    // You can update the UI here
  });
};

// Function to send a message
export const sendMessage = (messageData) => {
  socket.emit("sendMessage", messageData);
};

// Export the socket instance
export default socket;

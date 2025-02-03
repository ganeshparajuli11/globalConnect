import { io } from "socket.io-client";
import config from "./config";
const ip = config.API_IP;

const socket = io(`http://${ip}:3000`);

export const connectUser = (userId) => {
  socket.emit("join", userId);
};

export const sendNotification = (recipientId, message) => {
  socket.emit("sendNotification", { recipientId, message });
};

export const listenForNotifications = (callback) => {
  socket.on("receiveNotification", (message) => {
    callback(message);
  });
};

export default socket;

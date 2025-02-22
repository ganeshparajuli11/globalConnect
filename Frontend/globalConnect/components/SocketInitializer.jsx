import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { userAuth } from "../contexts/AuthContext";
import socket from "../socketManager/socket";

const SocketInitializer = () => {
  const { user } = userAuth();
  const [newMessage, setNewMessage] = useState(null);
  const [newNotification, setNewNotification] = useState(null);
  const isMounted = useRef(true);
  const socketConnected = useRef(false);

  useEffect(() => {
    if (user && user._id && !socketConnected.current) {
      socket.connect();
      socketConnected.current = true;
      console.log(`✅ Connected to WebSocket as user: ${user._id}`);

      socket.emit("join", user._id);
      socket.emit("receiveMessageRequest", user._id); // Ensure message listening is enabled

      const handleMessage = (data) => {
        console.log("📩 Received New Message:", data);
        if (isMounted.current) {
          setNewMessage(data);
        }
      };

      const handleNotification = (data) => {
        console.log("🔔 Received New Notification:", data);
        if (isMounted.current) {
          setNewNotification(data);
        }
      };

      // Ensure we don't add duplicate event listeners
      socket.off("receiveMessage", handleMessage);
      socket.off("receiveNotification", handleNotification);

      // Attach listeners
      socket.on("receiveMessage", handleMessage);
      socket.on("receiveNotification", handleNotification);

      socket.on("connect_error", (err) => {
        console.error("⚠️ WebSocket Error:", err.message);
      });

      socket.on("reconnect", () => {
        console.log("🔄 WebSocket Reconnected.");
        socket.emit("join", user._id);
      });

      return () => {
        console.log("🔌 Cleaning up WebSocket listeners...");
        isMounted.current = false;
        socket.off("receiveMessage", handleMessage);
        socket.off("receiveNotification", handleNotification);
        socket.off("connect_error");
        socket.off("reconnect");
        socket.disconnect();
        socketConnected.current = false;
      };
    }
  }, [user]);

  return (
    <View style={styles.container}>
      {newMessage && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            📩 New message from {newMessage.senderId}: {newMessage.content}
          </Text>
        </View>
      )}

      {newNotification && (
        <View style={styles.notificationContainer}>
          <Text style={styles.notificationText}>
            🔔 {newNotification.message}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  messageContainer: {
    backgroundColor: "#e0f7fa",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  messageText: {
    fontSize: 16,
    color: "#00796b",
  },
  notificationContainer: {
    backgroundColor: "#ffecb3",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  notificationText: {
    fontSize: 16,
    color: "#ff9800",
  },
});

export default SocketInitializer;

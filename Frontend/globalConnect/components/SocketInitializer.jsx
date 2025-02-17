import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { userAuth } from "../contexts/AuthContext";
import socket from "../socketManager/socket";

const SocketInitializer = () => {
  const { user } = userAuth();
  const [newMessage, setNewMessage] = useState(null);
  const [newNotification, setNewNotification] = useState(null);
  const isMounted = useRef(true); // To prevent memory leaks

  useEffect(() => {
    if (user && user._id) {
      socket.connect();
      console.log("✅ Connected to WebSocket for user:", user._id);

      socket.emit("join", user._id);

      const handleMessage = (data) => {
        console.log("📩 New Message:", data);
        if (isMounted.current) setNewMessage(data);
      };

      const handleNotification = (data) => {
        console.log("🔔 New Notification:", data);
        if (isMounted.current) setNewNotification(data);
      };

      socket.on("receiveMessage", handleMessage);
      socket.on("receiveNotification", handleNotification);

      socket.on("connect_error", (err) => {
        console.log("⚠️ Socket Error:", err.message);
      });

      socket.on("reconnect", () => {
        console.log("🔄 Reconnected to WebSocket.");
      });

      // Cleanup function
      return () => {
        console.log("🔌 Cleaning up WebSocket listeners...");
        isMounted.current = false;
        socket.off("receiveMessage", handleMessage);
        socket.off("receiveNotification", handleNotification);
        socket.off("connect_error");
        socket.off("reconnect");
        socket.disconnect();
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
          <Text style={styles.notificationText}>🔔 {newNotification.message}</Text>
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

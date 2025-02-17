import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";
import config from "../constants/config";

const NotificationCard = ({ notification }) => {
  const { message, metadata, createdAt } = notification;
  const formattedDate = new Date(createdAt).toLocaleDateString();
  const ip = config.API_IP;
  
  // Build the full URL for the profile image if available.
  const profileImageURL =
    metadata && metadata.profileImage
      ? `http://${ip}:3000/${metadata.profileImage}`
      : "https://via.placeholder.com/100";

  return (
    <View style={styles.card}>
      <Image source={{ uri: profileImageURL }} style={styles.profileImage} />
      <View style={styles.textContainer}>
        <Text style={styles.messageText}>{message}</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>
    </View>
  );
};

export default NotificationCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    // Elevation for Android
    elevation: 2,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});

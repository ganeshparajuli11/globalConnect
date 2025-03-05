import React from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import config from "../constants/config";
import { theme } from "../constants/theme";
import { Ionicons } from '@expo/vector-icons';

const NotificationCard = ({ notification, onPress }) => {
  const { message, metadata, createdAt, read } = notification;
  const formattedDate = new Date(createdAt).toLocaleDateString();
  const ip = config.API_IP;
  
  // Build the full URL for the profile image if available.
  const profileImageURL =
    metadata && metadata.profileImage
      ? `http://${ip}:3000/${metadata.profileImage}`
      : "https://via.placeholder.com/100";

  return (
    <TouchableOpacity 
      style={[
        styles.card,
        !read && styles.unreadCard
      ]} 
      onPress={() => onPress(notification._id)}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <Image source={{ uri: profileImageURL }} style={styles.profileImage} />
        {!read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.textContainer}>
        <Text style={[
          styles.messageText,
          !read && styles.unreadText
        ]}>{message}</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={theme.colors.gray} 
        style={styles.chevron}
      />
    </TouchableOpacity>
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
    borderRadius: 12,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    // Elevation for Android
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: theme.colors.lightGray,
  },
  leftContent: {
    position: 'relative',
    marginRight: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  textContainer: {
    flex: 1,
  },
  messageText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  unreadText: {
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.gray,
    marginTop: 4,
  },
  chevron: {
    marginLeft: 8,
  },
});

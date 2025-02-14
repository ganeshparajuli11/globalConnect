import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import ScreenWrapper from "../../components/ScreenWrapper";
import Header from "../../components/Header"; // Shared header component with back button & title styling
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { userAuth } from "../../contexts/AuthContext";
import config from "../../constants/config";

const BlockedUser = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const ip = config.API_IP;

  // Call hook at top-level
  const { authToken } = userAuth();

  const fetchBlockedUsers = async () => {
    try {
      const response = await axios.get(
        `http://${ip}:3000/api/profile/get-blocked`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setBlockedUsers(response.data.blocked_users);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const handleUnblock = (targetUserId) => {
    Alert.alert("Unblock User", "Do you really want to unblock this user?", [
      { text: "Cancel", style: "cancel" },
      { text: "Unblock", onPress: () => unblockUser(targetUserId) },
    ]);
  };

  const unblockUser = async (targetUserId) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      await axios.put(
        `http://${ip}:3000/api/profile/block-unblock`,
        { targetUserId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      // Remove the unblocked user from the list
      setBlockedUsers((prev) =>
        prev.filter((user) => user._id !== targetUserId)
      );
      Alert.alert("Success", "User unblocked successfully.");
    } catch (error) {
      console.error("Error unblocking user:", error);
      Alert.alert("Error", "Failed to unblock user.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.userContainer}>
      <Image source={{ uri: item.profile_image }} style={styles.profileImage} />
      <Text style={styles.userName}>{item.name}</Text>
      <TouchableOpacity
        onPress={() => handleUnblock(item._id)}
        style={styles.optionsButton}
      >
        <Text style={styles.optionsText}>⋮</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScreenWrapper bg="#fff">
      <StatusBar style="dark" />
      {/* Use the shared Header for consistent top bar styling */}
      <Header title="Blocked Users" showBackButton={true} />
      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No blocked users found.</Text>
          }
        />
      )}
    </ScreenWrapper>
  );
};

export default BlockedUser;

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userName: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  optionsButton: {
    padding: 8,
  },
  optionsText: {
    fontSize: 24,
    color: "#888",
  },
  loader: {
    marginTop: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
    fontSize: 16,
  },
});

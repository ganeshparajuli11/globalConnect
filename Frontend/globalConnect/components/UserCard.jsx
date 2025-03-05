import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { theme } from "../constants/theme";
import { hp, wp } from "../helpers/common";
import config from "../constants/config";
import axios from "axios";
import { userAuth } from "../contexts/AuthContext";
import { useRouter } from "expo-router";

const UserCard = ({ user, onFollowToggle }) => {
  const router = useRouter();
  const { authToken, refreshUserProfile } = userAuth();
  const ip = config.API_IP;

  // Initialize local state with user.isFollowing (default to false if undefined)
  const [following, setFollowing] = useState(user.isFollowing || false);

  useEffect(() => {
    setFollowing(user.isFollowing || false);
  }, [user.isFollowing]);

  // Build the correct URL for the user's profile image
  const profileImageURL = user?.profile_image
    ? `http://${ip}:3000/${user.profile_image}`
    : "https://via.placeholder.com/100";

  // Follow/unfollow function using the same pattern as in UserProfileCard
  const performFollowToggle = async () => {
    try {
      const endpoint = following ? "unfollow" : "follow";
      const url = `http://${ip}:3000/api/${endpoint}`;
      const bodyKey = following ? "unfollowUserId" : "followUserId";
      const body = { [bodyKey]: user._id };

      const response = await axios.post(url, body, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.status === 200) {
        refreshUserProfile()
        setFollowing(!following);
        onFollowToggle && onFollowToggle(user._id, !following);
      } else {
        console.error("Unexpected response:", response);
      }
    } catch (error) {
      console.error("Error toggling follow/unfollow:", error.response?.data || error.message);
    }
  };

  // Show a confirmation alert before toggling follow status
  const confirmFollowToggle = () => {
    const message = following
      ? `Are you sure you want to unfollow ${user.name}?`
      : `Do you want to follow ${user.name}?`;
    const actionLabel = following ? "Unfollow" : "Follow";

    Alert.alert("", message, [
      { text: "Cancel", style: "cancel" },
      { text: actionLabel, onPress: performFollowToggle },
    ]);
  };

  // Navigate to the user's profile screen
  const navigateToProfile = () => {
    router.push({
      pathname: "/userProfile",
      params: { userId: user._id },
    });
  };

  return (
    <TouchableOpacity onPress={navigateToProfile} activeOpacity={0.8}>
      <View style={styles.card}>
        <Image source={{ uri: profileImageURL }} style={styles.avatar} />
        <Text style={styles.userName}>{user.name}</Text>

        <TouchableOpacity
          onPress={confirmFollowToggle}
          style={[
            styles.followButton,
            following ? styles.following : styles.notFollowing,
          ]}
          activeOpacity={0.8}
        >
          {following ? (
            <>
              <Icon name="check" size={16} color={theme.colors.primary} style={styles.icon} />
              <Text style={[styles.followButtonText, styles.followingText]}>
                Following
              </Text>
            </>
          ) : (
            <>
              <Icon name="plus" size={16} color={theme.colors.white} style={styles.icon} />
              <Text style={styles.followButtonText}>Follow</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default UserCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: hp(1),
    marginVertical: hp(0.5),
    borderRadius: 10,
    backgroundColor: theme.colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderColor: theme.colors.gray,
    borderWidth: 0.5,
  },
  avatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    marginRight: wp(3),
  },
  userName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(4),
    borderRadius: 20,
  },
  following: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  notFollowing: {
    backgroundColor: theme.colors.primary,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.white,
  },
  followingText: {
    color: theme.colors.primary,
  },
  icon: {
    marginRight: 5,
  },
});

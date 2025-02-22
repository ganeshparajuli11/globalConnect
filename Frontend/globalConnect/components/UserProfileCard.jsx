// UserProfileCard.jsx
import React from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity, Alert } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import axios from "axios";
import { theme } from "../constants/theme";
import { hp } from "../helpers/common";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";

const UserProfileCard = ({ user, isFollowing, onFollowToggle }) => {
  const { authToken, refreshUserProfile } = userAuth();
  // console.log("authToken: " + authToken);
  if (!user) return null;

  const ip = config.API_IP;
  const profileImageURL = user.profile_image
    ? `http://${ip}:3000/${user.profile_image}`
    : "https://via.placeholder.com/100";

    const performFollowToggle = async () => {
      try {
        const endpoint = isFollowing ? "unfollow" : "follow";
        const url = `http://${ip}:3000/api/${endpoint}`;
        const bodyKey = isFollowing ? "unfollowUserId" : "followUserId";
        const body = { [bodyKey]: user._id };
    
        const response = await axios.post(url, body, {
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
          },
        });
    
        if (response.status === 200) {
          if (onFollowToggle) {
            onFollowToggle(user._id, !isFollowing);
            refreshUserProfile()
          }
        } else {
          console.error("Unexpected response:", response);
        }
      } catch (error) {
        console.error("Error toggling follow/unfollow:", error.response?.data || error.message);
      }
    };
    

  const confirmFollowToggle = () => {
    const message = isFollowing
      ? `Are you sure you want to unfollow ${user.name}?`
      : `Do you want to follow ${user.name}?`;
    const actionLabel = isFollowing ? "Unfollow" : "Follow";

    Alert.alert("", message, [
      { text: "Cancel", style: "cancel" },
      { text: actionLabel, onPress: performFollowToggle },
    ]);
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: profileImageURL }} style={styles.avatar} />
      <Text style={styles.name}>{user.name}</Text>
      {/* Email removed to simplify the UI */}
      <Text style={styles.bio}>{user.bio}</Text>
      <View style={styles.stats}>
        <Text style={styles.statText}>Followers: {user.followers}</Text>
        <Text style={styles.statText}>Following: {user.following}</Text>
        <Text style={styles.statText}>Posts: {user.posts_count}</Text>
      </View>
      <TouchableOpacity
        onPress={confirmFollowToggle}
        style={[
          styles.followButton,
          isFollowing ? styles.following : styles.notFollowing,
        ]}
      >
        {isFollowing ? (
          <>
            <Icon name="check" size={16} color={theme.colors.primary} style={styles.icon} />
            <Text style={[styles.followButtonText, styles.followingText]}>Following</Text>
          </>
        ) : (
          <>
            <Icon name="plus" size={16} color={theme.colors.white} style={styles.icon} />
            <Text style={styles.followButtonText}>Follow</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default UserProfileCard;

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: hp(10),
    height: hp(10),
    borderRadius: hp(5),
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 5,
  },
  bio: {
    fontSize: 14,
    color: "black",
    textAlign: "center",
    marginVertical: 5,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 10,
  },
  statText: {
    fontSize: 12,
    color: "gray",
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  notFollowing: {
    backgroundColor: theme.colors.primary,
  },
  following: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  followButtonText: {
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

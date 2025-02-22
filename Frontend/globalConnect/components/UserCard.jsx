import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { theme } from "../constants/theme";
import { hp, wp } from "../helpers/common";
import config from "../constants/config";
import axios from "axios";
import { userAuth } from "../contexts/AuthContext";
import { useRouter } from "expo-router";

const UserCard = ({ user, isFollowing, onFollowToggle }) => {
    const router = useRouter(); 
  const { authToken } = userAuth();
  const ip = config.API_IP;
console.log("user in userCard: " , user)
  const [following, setFollowing] = useState(isFollowing);

  // Handle follow/unfollow action
  const toggleFollow = async () => {
    try {
      const url = `http://${ip}:3000/api/user/${following ? "unfollow" : "follow"}/${user._id}`;
      await axios.post(
        url,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setFollowing(!following);
      onFollowToggle && onFollowToggle(user._id, !following); 
    } catch (error) {
      console.error("Error toggling follow status:", error);
    }
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
        <Image
          source={{ uri: user.profile_image || "https://via.placeholder.com/100" }}
          style={styles.avatar}
        />
        <Text style={styles.userName}>{user.name}</Text>

        {/* Follow / Unfollow Button */}
        <TouchableOpacity
          onPress={toggleFollow}
          style={[styles.followButton, following ? styles.following : styles.notFollowing]}
          activeOpacity={0.8}
        >
          <Text style={styles.followButtonText}>{following ? "Following" : "Follow"}</Text>
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
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(4),
    borderRadius: 20,
  },
  following: {
    backgroundColor: theme.colors.primary,
  },
  notFollowing: {
    backgroundColor: theme.colors.lightGray,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.white,
  },
});

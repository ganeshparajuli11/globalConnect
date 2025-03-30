import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import axios from "axios";
import { theme } from "../constants/theme";
import { hp } from "../helpers/common";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";

const UserProfileCard = ({ user, isFollowing, onFollowToggle }) => {
  const { authToken, refreshUserProfile } = userAuth();
  const router = useRouter();
  const ip = config.API_IP;
  const [following, setFollowing] = useState(isFollowing || false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update local state when the isFollowing prop changes
  useEffect(() => {
    setFollowing(isFollowing || false);
  }, [isFollowing]);

  // Follow/unfollow function
  const performFollowToggle = async () => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
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
        refreshUserProfile();
        setFollowing(!following);
        onFollowToggle && onFollowToggle(user._id, !following);
      } else {
        console.error("Unexpected response:", response);
      }
    } catch (error) {
      console.error("Error toggling follow/unfollow:", error.response?.data || error.message);
      Alert.alert("Error", "Unable to update follow status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirmation alert before toggling follow status
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

  // Build the profile image URL
  const profileImageURL = user.profile_image
    ? `http://${ip}:3000/${user.profile_image}`
    : "https://via.placeholder.com/100";

  return (
    <View style={styles.container}>
      {/* Header: Avatar, Name, and Menu Button */}
      <View style={styles.header}>
        <Image source={{ uri: profileImageURL }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <TouchableOpacity onPress={() => {}} style={styles.menuButton}>
          <Icon name="ellipsis-v" size={20} color={theme.colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* Optional Bio */}
      {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

      {/* Stats Row */}
      <View style={styles.stats}>
        <Text style={styles.statText}>Followers: {user.followers}</Text>
        <Text style={styles.statText}>Following: {user.following}</Text>
        <Text style={styles.statText}>Posts: {user.posts_count}</Text>
      </View>

      {/* Action Buttons: Follow/Unfollow and Message */}
      <View style={styles.buttonsRow}>
        {/* Follow/Unfollow Button */}
        <TouchableOpacity
          onPress={confirmFollowToggle}
          disabled={isUpdating}
          style={[
            styles.actionButton,
            following ? styles.following : styles.notFollowing,
            isUpdating && styles.updatingButton
          ]}
        >
          {following ? (
            <>
              <Icon
                name="check"
                size={16}
                color={theme.colors.primary}
                style={styles.icon}
              />
              <Text style={[styles.buttonText, styles.followingText]}>
                {isUpdating ? "Updating..." : "Following"}
              </Text>
            </>
          ) : (
            <>
              <Icon
                name="plus"
                size={16}
                color={theme.colors.white}
                style={styles.icon}
              />
              <Text style={styles.buttonText}>
                {isUpdating ? "Following..." : "Follow"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Message Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={() => {
            router.replace(
              `/chat?userId=${encodeURIComponent(user._id)}&name=${encodeURIComponent(user.name)}`
            );
          }}
        >
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserProfileCard;
const additionalStyles = {
  updatingButton: {
    opacity: 0.7
  }
};
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
    elevation: 2
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between"
  },
  avatar: {
    width: hp(10),
    height: hp(10),
    borderRadius: hp(5)
  },
  name: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center"
  },
  menuButton: {
    padding: 10
  },
  menu: {
    position: "absolute",
    top: 50,
    right: 15,
    backgroundColor: "white",
    borderRadius: 5,
    elevation: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8
  },
  menuIcon: {
    marginRight: 8
  },
  menuText: {
    fontSize: 14,
    fontWeight: "bold"
  },
  bio: {
    fontSize: 14,
    color: "black",
    textAlign: "center",
    marginVertical: 8
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 10
  },
  statText: {
    fontSize: 12,
    color: "gray"
  },
  buttonsRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 5
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: "center",
    marginRight: 5
  },
  notFollowing: {
    backgroundColor: theme.colors.primary
  },
  following: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary
  },
  buttonText: {
    fontWeight: "bold",
    color: theme.colors.white
  },
  followingText: {
    color: theme.colors.primary
  },
  icon: {
    marginRight: 5
  },
  messageButton: {
    marginRight: 0, // remove extra space on the rightmost button
    backgroundColor: theme.colors.primary
  },
  messageButtonText: {
    fontWeight: "bold",
    color: theme.colors.white
  }
});

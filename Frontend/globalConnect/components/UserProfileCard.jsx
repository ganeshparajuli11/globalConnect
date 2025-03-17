import React, { useState } from "react";
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
  const { authToken } = userAuth();
  const router = useRouter();
  const ip = config.API_IP;

  // For showing/hiding the three-dot menu
  const [menuVisible, setMenuVisible] = useState(false);

  // Track whether we have blocked this user
  // If your API/user object has a built-in flag, replace `false` with user.isBlocked
  const [isBlocked, setIsBlocked] = useState(false);

  if (!user) return null;

  const profileImageURL = user.profile_image
    ? `http://${ip}:3000/${user.profile_image}`
    : "https://via.placeholder.com/100";

  /**
   * Toggle the menu open/closed
   */
  const toggleMenu = () => setMenuVisible(!menuVisible);

  /**
   * Show a confirmation alert for blocking/unblocking
   */
  const handleBlockToggle = () => {
    if (isBlocked) {
      // If currently blocked, confirm "Unblock"
      Alert.alert(
        "Unblock User",
        `Are you sure you want to unblock ${user.name}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Unblock", style: "default", onPress: unblockUser }
        ]
      );
    } else {
      // If not blocked, confirm "Block"
      Alert.alert(
        "Block User",
        `Are you sure you want to block ${user.name}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Block", style: "destructive", onPress: blockUser }
        ]
      );
    }
  };

  /**
   * Call PUT for "block"
   */
  const blockUser = async () => {
    try {
      const url = `http://${ip}:3000/api/profile/block-unblock`;
      await axios.put(
        url,
        { targetUserId: user._id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      Alert.alert("Success", `${user.name} is now blocked.`);
      setIsBlocked(true);
      toggleMenu(); // Hide menu
    } catch (error) {
      console.error("Error blocking user:", error?.response?.data || error.message);
      Alert.alert("Error", "Failed to block user. Please try again.");
    }
  };

  /**
   * Call POST for "unblock"
   */
  const unblockUser = async () => {
    try {
      const url = `http://${ip}:3000/api/profile/block-unblock`;
      await axios.post(
        url,
        { targetUserId: user._id },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      Alert.alert("Success", `${user.name} is now unblocked.`);
      setIsBlocked(false);
      toggleMenu(); // Hide menu
    } catch (error) {
      console.error("Error unblocking user:", error?.response?.data || error.message);
      Alert.alert("Error", "Failed to unblock user. Please try again.");
    }
  };

  /**
   * For demonstration only
   */
  const handleReportUser = () => {
    Alert.alert("Report User", `You have reported ${user.name}.`);
    toggleMenu();
  };
  const handleShareProfile = () => {
    Alert.alert("Share Profile", `Sharing ${user.name}'s profile...`);
    toggleMenu();
  };

  return (
    <View style={styles.container}>
      {/* Header: Avatar, Name, Menu Button */}
      <View style={styles.header}>
        <Image source={{ uri: profileImageURL }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>

        {/* Three-dot Menu Button */}
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Icon name="ellipsis-v" size={20} color={theme.colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* Menu Options (Block/Unblock, Report, Share) */}
      {menuVisible && (
        <View style={styles.menu}>
          <TouchableOpacity onPress={handleBlockToggle} style={styles.menuItem}>
            <Icon
              name="ban"
              size={16}
              color={isBlocked ? "#26B93E" : "red"}
              style={styles.menuIcon}
            />
            <Text style={styles.menuText}>
              {isBlocked ? "Unblock User" : "Block User"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleReportUser} style={styles.menuItem}>
            <Icon name="flag" size={16} color="#FF6347" style={styles.menuIcon} />
            <Text style={styles.menuText}>Report User</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShareProfile} style={styles.menuItem}>
            <Icon name="share" size={16} color="#4682B4" style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: "#4682B4" }]}>Share Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bio */}
      {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

      {/* Stats Row */}
      <View style={styles.stats}>
        <Text style={styles.statText}>Followers: {user.followers}</Text>
        <Text style={styles.statText}>Following: {user.following}</Text>
        <Text style={styles.statText}>Posts: {user.posts_count}</Text>
      </View>

      {/* Action Buttons: Follow/Unfollow + Message */}
      <View style={styles.buttonsRow}>
        {/* Follow/Unfollow Button */}
        <TouchableOpacity
          onPress={onFollowToggle}
          style={[
            styles.actionButton,
            isFollowing ? styles.following : styles.notFollowing
          ]}
        >
          {isFollowing ? (
            <>
              <Icon
                name="check"
                size={16}
                color={theme.colors.primary}
                style={styles.icon}
              />
              <Text style={[styles.buttonText, styles.followingText]}>
                Following
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
              <Text style={styles.buttonText}>Follow</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Message Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={() => {
            // Navigate to chat screen with userId & name
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

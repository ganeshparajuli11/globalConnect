import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import axios from "axios";
import { theme } from "../constants/theme";
import { hp } from "../helpers/common";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";
import { reportUser } from "../services/reportService"; // Ensure this is imported
import ReportCategoryCard from "./ReportCategoryCard";
import { useFetchCategories } from "../services/reportService";

const UserProfileCard = ({ user, isFollowing, onFollowToggle }) => {
  const { authToken, refreshUserProfile } = userAuth();
  const router = useRouter();
  const ip = config.API_IP;
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Local state for following status
  const [following, setFollowing] = useState(isFollowing || false);
  const [isUpdating, setIsUpdating] = useState(false);
  // State for options modal visibility
  const [menuVisible, setMenuVisible] = useState(false);
  // State for report user modal (report card)
  const [reportUserModalVisible, setReportUserModalVisible] = useState(false);
  // State for report category (or reason) input
  const [reportCategory, setReportCategory] = useState("");
  // Add these states inside UserProfileCard component
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { categories, loading: categoriesLoading } = useFetchCategories();

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
      console.error(
        "Error toggling follow/unfollow:",
        error.response?.data || error.message
      );
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

  // Functions for modal options
  const handleBlockUser = () => {
    setMenuVisible(false);
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${user.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            // Block logic will go here
          },
        },
      ]
    );
  };

  // Instead of directly alerting, open the report user modal (Report Card)
  const handleReportUser = () => {
    setMenuVisible(false);
    setReportUserModalVisible(true);
  };

  // Handle report submission
  const submitReportUser = async () => {
    if (!selectedCategory) {
      Alert.alert("Error", "Please select a reason for reporting");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await reportUser(user._id, selectedCategory);

      if (response.success) {
        setReportUserModalVisible(false);
        setSelectedCategory(null);
        Alert.alert(
          "Report Submitted",
          "Thank you for your report. We will review it shortly.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Report Failed",
          response.message || "Unable to submit report. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Report submission error:", error);
      Alert.alert(
        "Error",
        "An error occurred while submitting your report. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
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
    <>
      <TouchableOpacity onPress={navigateToProfile} activeOpacity={0.8}>
        <View style={styles.container}>
          {/* Header: Avatar, Name, and Menu Button */}
          <View style={styles.header}>
            <Image source={{ uri: profileImageURL }} style={styles.avatar} />
            <Text style={styles.name}>
              {user.name}{" "}
              {user.verified && (
                <Icon
                  name="verify"
                  size={16}
                  color="blue"
                  style={{ marginLeft: 4 }}
                />
              )}
            </Text>
            {/* Ellipsis Menu Button */}
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={styles.menuButton}
            >
              <Icon
                name="ellipsis-v"
                size={20}
                color={theme.colors.textDark}
              />
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
            <TouchableOpacity
              onPress={confirmFollowToggle}
              disabled={isUpdating}
              style={[
                styles.actionButton,
                following ? styles.following : styles.notFollowing,
                isUpdating && styles.updatingButton,
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

            <TouchableOpacity
              style={[styles.actionButton, styles.messageButton]}
              onPress={() => {
                router.replace(
                  `/chat?userId=${encodeURIComponent(
                    user._id
                  )}&name=${encodeURIComponent(user.name)}`
                );
              }}
            >
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Options Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.menuItem} onPress={handleBlockUser}>
              <Icon name="ban" size={20} color={theme.colors.error} />
              <Text
                style={[styles.menuText, { color: theme.colors.error }]}
              >
                Block User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleReportUser}>
              <Icon name="flag" size={20} color={theme.colors.warning} />
              <Text
                style={[styles.menuText, { color: theme.colors.warning }]}
              >
                Report User
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={reportUserModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!isSubmitting) {
            setReportUserModalVisible(false);
            setSelectedCategory(null);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report User</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  if (!isSubmitting) {
                    setReportUserModalVisible(false);
                    setSelectedCategory(null);
                  }
                }}
              >
                <Icon name="times" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select a reason for reporting {user.name}
            </Text>

            {categoriesLoading ? (
              <ActivityIndicator
                size="large"
                color={theme.colors.primary}
              />
            ) : (
              <ScrollView style={styles.categoriesList}>
                {categories.map((category) => (
                  <ReportCategoryCard
                    key={category._id}
                    title={category.name}
                    description={category.description}
                    selected={selectedCategory === category._id}
                    onPress={() => setSelectedCategory(category._id)}
                  />
                ))}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.colors.border },
                ]}
                onPress={() => {
                  if (!isSubmitting) {
                    setReportUserModalVisible(false);
                    setSelectedCategory(null);
                  }
                }}
                disabled={isSubmitting}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: theme.colors.text },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: !selectedCategory || isSubmitting ? 0.5 : 1,
                  },
                ]}
                onPress={submitReportUser}
                disabled={!selectedCategory || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: "white" }]}>
                    Submit Report
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default UserProfileCard;

const additionalStyles = {
  updatingButton: {
    opacity: 0.7,
  },
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
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
  },
  avatar: {
    width: hp(10),
    height: hp(10),
    borderRadius: hp(5),
  },
  name: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  menuButton: {
    padding: 10,
  },
  bio: {
    fontSize: 14,
    color: "black",
    textAlign: "center",
    marginVertical: 8,
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
  buttonsRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 5,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: "center",
    marginRight: 5,
  },
  notFollowing: {
    backgroundColor: theme.colors.primary,
  },
  following: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  buttonText: {
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
  messageButton: {
    marginRight: 0,
    backgroundColor: theme.colors.primary,
  },
  messageButtonText: {
    fontWeight: "bold",
    color: theme.colors.white,
  },
  // Modal styles for options
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 10,
  },
  modalContainer: {
    backgroundColor: "white",
    width: "90%",
    borderRadius: 15,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  closeButton: {
    padding: 5,
  },
  categoriesList: {
    marginVertical: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    textAlign: "center",
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 15,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import ScreenWrapper from "../../components/ScreenWrapper";
import BottomNav from "../../components/bottomNav";
import config from "../../constants/config";
import { userAuth } from "../../contexts/AuthContext";
import { theme } from "../../constants/theme";
import Icon from "../../assets/icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import UserPostCardDetails from "../../components/UserPostCardDetails";
import axios from "axios";

const Profile = () => {
  const router = useRouter();
  const { user, authToken, setUserData, refreshUserProfile } = userAuth(); // Make sure user contains your token (e.g. user.token)
  const ip = config.API_IP;
  const profileImageURL = user?.profile_image
    ? `http://${ip}:3000/${user.profile_image}`
    : "https://via.placeholder.com/100";

  // State to show the full-screen profile image modal
  const [fullImageModalVisible, setFullImageModalVisible] = useState(false);
  // State for showing our custom camera options dialog
  const [cameraOptionsVisible, setCameraOptionsVisible] = useState(false);

  // Called when the profile image (or camera icon) is tapped
  const handleCameraPress = () => {
    setCameraOptionsVisible(true);
  };

  // Option: View the image in full screen
  const handleViewImage = () => {
    setCameraOptionsVisible(false);
    setFullImageModalVisible(true);
  };

  // Option: Update the profile image by picking an image from the library
  const handleUpdateImage = async () => {
    setCameraOptionsVisible(false);

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      const formData = new FormData();
      formData.append("profileImage", {
        uri: uri,
        name: "profile.jpg",
        type: "image/jpeg",
      });

      try {
        const response = await axios.post(
          `http://${ip}:3000/api/profile/update-profile`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.status === 200) {
          Alert.alert("Success", "Profile updated successfully");

          const fullImageUrl = response.data.profileImage;

          await refreshUserProfile()

          console.log("User data updated:", fullImageUrl);
        } else {
          Alert.alert(
            "Error",
            response.data.message || "Profile update failed"
          );
        }
      } catch (error) {
        console.error("Update Error:", error);

        if (error.response) {
          console.error("Backend Response:", error.response.data);
          Alert.alert(
            "Error",
            error.response.data.message ||
              "An error occurred while updating your profile"
          );
        } else {
          Alert.alert("Error", "An error occurred while updating your profile");
        }
      }
    }
  };

  console.log("user", user)
  return (
    <ScreenWrapper>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Settings Icon */}
        <TouchableOpacity
          style={styles.settingIcon}
          onPress={() => router.push("/setting")}
        >
          <Icon name="setting" size={24} color={theme.colors.black} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handleCameraPress}>
              <View style={styles.profileImageWrapper}>
                <Image
                  source={{ uri: profileImageURL }}
                  style={styles.profileImage}
                />
                {/* Camera Icon overlay */}
                <TouchableOpacity
                  style={styles.cameraIcon}
                  onPress={handleCameraPress}
                >
                  <Icon name="camera" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            {/* User Information */}
            <Text style={styles.userName}>{user?.name || "John Doe"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userLocation}>
              destination: {user?.destination_country}
            </Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statsContainer}>
              <Text style={styles.statsCount}>
                {user?.followers?.length || 0}
              </Text>
              <Text style={styles.statsLabel}>Followers</Text>
            </View>
            <View style={styles.statsContainer}>
              <Text style={styles.statsCount}>
                {user?.following?.length || 0}
              </Text>
              <Text style={styles.statsLabel}>Following</Text>
            </View>
            <View style={styles.statsContainer}>
              <Text style={styles.statsCount}>{user?.posts_count || 0}</Text>
              <Text style={styles.statsLabel}>Posts</Text>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.bioSection}>
            <Text style={styles.bioTitle}>Bio</Text>
            <Text style={styles.bioText}>
              {user?.bio || "No bio available"}
            </Text>
          </View>

          {/* Interests Section */}
          {user?.interests?.length > 0 && (
            <View style={styles.interestsSection}>
              <Text style={styles.interestsTitle}>Interests</Text>
              <Text style={styles.interestsText}>
                {user?.interests.join(", ")}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNav />

        {/* Custom Modal for Camera Options */}
        <Modal
          transparent={true}
          visible={cameraOptionsVisible}
          animationType="fade"
          onRequestClose={() => setCameraOptionsVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setCameraOptionsVisible(false)}
          >
            <View style={styles.cameraModal}>
              <Text style={styles.cameraModalTitle}>Profile Image</Text>
              <TouchableOpacity
                style={styles.cameraModalButton}
                onPress={handleViewImage}
              >
                <Text style={styles.cameraModalButtonText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cameraModalButton}
                onPress={handleUpdateImage}
              >
                <Text style={styles.cameraModalButtonText}>Update</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cameraModalButton, styles.cancelButton]}
                onPress={() => setCameraOptionsVisible(false)}
              >
                <Text style={styles.cameraModalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Full-screen Modal for Viewing Profile Image */}
        <Modal
          visible={fullImageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setFullImageModalVisible(false)}
        >
          <View style={styles.fullImageModalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setFullImageModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: profileImageURL }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  settingIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  profileImageWrapper: {
    position: "relative",
    width: 100,
    height: 100,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: 15,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.black,
    marginTop: 10,
  },
  userEmail: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  userLocation: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 5,
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },
  statsContainer: {
    alignItems: "center",
  },
  statsCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.black,
  },
  statsLabel: {
    fontSize: 14,
    color: theme.colors.black,
  },
  bioSection: {
    marginBottom: 15,
  },
  bioTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.black,
  },
  bioText: {
    fontSize: 14,
    color: theme.colors.black,
    marginTop: 5,
  },
  interestsSection: {
    marginBottom: 15,
  },
  interestsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.black,
  },
  interestsText: {
    fontSize: 14,
    color: theme.colors.gray,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraModal: {
    width: 250,
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  cameraModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: theme.colors.black,
  },
  cameraModalButton: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  cancelButton: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  cameraModalButtonText: {
    fontSize: 16,
    color: theme.colors.black,
  },
  fullImageModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 5,
    padding: 10,
    zIndex: 10,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.black,
  },
  fullScreenImage: {
    width: "90%",
    height: "80%",
  },
});

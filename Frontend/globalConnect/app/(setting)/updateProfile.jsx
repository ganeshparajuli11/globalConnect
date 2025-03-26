import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { userAuth } from "../../contexts/AuthContext";
import config from "../../constants/config";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import Header from "../../components/Header";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";

const UpdateProfile = () => {
  const { user, authToken, refreshUserProfile } = userAuth();
  const ip = config.API_IP;
  const router = useRouter();

  // State for user details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");         // Single email field
  const [bio, setBio] = useState("");
  const [token, setToken] = useState("");         // For OTP
  const [showTokenField, setShowTokenField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullImageModalVisible, setFullImageModalVisible] = useState(false);
  const [cameraOptionsVisible, setCameraOptionsVisible] = useState(false);
  const [error, setError] = useState("");
  const [errorVisible, setErrorVisible] = useState(false);

  // Capture original email to check if it has been changed
  const [originalEmail, setOriginalEmail] = useState("");

  // On component mount, fill fields with user data
  useEffect(() => {
    if (user && user.user) {
      setName(user.user.name || "");
      setEmail(user.user.email || "");
      setBio(user.user.bio || "");
      setOriginalEmail(user.user.email || "");
    }
  }, [user]);

  // If user has a profile image, build the URL
  const profileImageURL =
    user && user.user && user.user.profile_image
      ? `http://${ip}:3000/${user.user.profile_image}`
      : null;

  // Simple client-side validation for emails
  const validateEmail = (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };

  // 1) Called when user wants to verify changed email
  const handleVerifyEmail = async () => {
    setError("");
    // If the email hasn't changed from the original, there's no need to verify
    if (email === originalEmail) {
      setError("You have not changed the email.");
      setErrorVisible(true);
      return;
    }
    // Make sure an email is entered
    if (!email) {
      setError("Please enter an email address");
      setErrorVisible(true);
      return;
    }
    // Validate format
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setErrorVisible(true);
      return;
    }

    // Attempt to send OTP
    try {
      setLoading(true);
      await axios.post(
        `http://${ip}:3000/api/profile/update-email`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      // Show token field once OTP is sent
      setShowTokenField(true);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      setError(errorMsg);
      setErrorVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // 2) Called when user taps “Save Changes” to update name, bio, possibly email
  const handleUpdateProfile = async () => {
    try {
      // We pass OTP only if the user changed the email
      // (But it doesn’t hurt to pass it always)
      const payload = {
        name,
        email,
        bio,
        otp: token,
      };

      await axios.post(`http://${ip}:3000/api/profile/update`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      await refreshUserProfile();
      Alert.alert("Success", "Profile updated successfully!");
      router.push("/profile");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      Alert.alert("Error", errorMsg);
    }
  };

  // Show camera options (view/update photo)
  const handleCameraPress = () => {
    setCameraOptionsVisible(true);
  };

  // View the full profile picture
  const handleViewImage = () => {
    setCameraOptionsVisible(false);
    setFullImageModalVisible(true);
  };

  // Choose a new image and upload
  const handleUpdateImage = async () => {
    setCameraOptionsVisible(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
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
          Alert.alert("Success", "Profile image updated successfully");
          await refreshUserProfile();
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || "Failed to update profile image";
        Alert.alert("Error", errorMsg);
      }
    }
  };

  return (
    <ScreenWrapper bg="#fff">
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Header title="Update Profile" showBackButton={true} />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Profile Image + Camera Icon */}
            <View style={styles.imageSection}>
              <TouchableOpacity onPress={handleCameraPress}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{
                      uri: profileImageURL || "https://via.placeholder.com/100",
                    }}
                    style={styles.profileImage}
                  />
                  <View style={styles.cameraBadge}>
                    <Icon name="camera" size={20} color={theme.colors.white} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Name Field */}
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />

            {/* Single Email Field */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setShowTokenField(false); // Reset OTP if user re-edits email
                setToken("");
              }}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Show “Verify Email” button only if email changed & user hasn't verified yet */}
            {email !== originalEmail && !showTokenField && (
              <TouchableOpacity
                style={styles.button}
                onPress={handleVerifyEmail}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </TouchableOpacity>
            )}

            {/* OTP Field */}
            {showTokenField && (
              <>
                <Text style={styles.label}>Enter Token</Text>
                <TextInput
                  style={styles.input}
                  value={token}
                  onChangeText={setToken}
                  placeholder="Enter verification token"
                  autoCapitalize="none"
                />
              </>
            )}

            {/* Bio Field */}
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Tell us about yourself"
            />

            {/* Save Button */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Camera Options Modal */}
        <Modal
          transparent
          visible={cameraOptionsVisible}
          animationType="fade"
          onRequestClose={() => setCameraOptionsVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setCameraOptionsVisible(false)}
          >
            <View style={styles.optionsModal}>
              <Text style={styles.modalTitle}>Profile Image</Text>
              <TouchableOpacity style={styles.modalButton} onPress={handleViewImage}>
                <Text style={styles.modalButtonText}>View Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleUpdateImage}>
                <Text style={styles.modalButtonText}>Update Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCameraOptionsVisible(false)}
              >
                <Text style={[styles.modalButtonText, styles.cancelText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Full Image Modal */}
        <Modal
          visible={fullImageModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setFullImageModalVisible(false)}
        >
          <View style={styles.fullImageContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setFullImageModalVisible(false)}
            >
              <Icon name="close" size={24} color={theme.colors.white} />
            </TouchableOpacity>
            <Image
              source={{ uri: profileImageURL }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal
          transparent
          visible={errorVisible}
          animationType="fade"
          onRequestClose={() => setErrorVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setErrorVisible(false)}
          >
            <View style={styles.errorModal}>
              <View style={styles.errorIconContainer}>
                <Icon name="alert-circle" size={32} color={theme.colors.danger} />
              </View>
              <Text style={styles.errorTitle}>Error</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity
                style={styles.errorButton}
                onPress={() => setErrorVisible(false)}
              >
                <Text style={styles.errorButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
    color: "#000",
  },
  input: {
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomContainer: {
    marginTop: 10,
    marginBottom: 30,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionsModal: {
    width: 300,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 20,
  },
  modalButton: {
    width: "100%",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    textAlign: "center",
  },
  cancelButton: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  cancelText: {
    color: theme.colors.danger,
  },
  fullImageContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "90%",
    height: "80%",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  imageSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  imageContainer: {
    position: "relative",
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  errorModal: {
    width: 300,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.danger + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.textLight,
    textAlign: "center",
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UpdateProfile;

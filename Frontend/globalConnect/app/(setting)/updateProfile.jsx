import React, { useState } from "react";
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
} from "react-native";
import axios from "axios";
import { userAuth } from "../../contexts/AuthContext";
import config from "../../constants/config";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import Header from "../../components/Header"; // Reusing the same header as in Settings
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
const UpdateProfile = () => {
  // Destructure both user and authToken from userAuth
  const { user, authToken, setUserData, refreshUserProfile } = userAuth();
  const ip = config.API_IP;
  const router = useRouter();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [newEmail, setNewEmail] = useState("");
  const [token, setToken] = useState("");
  const [showTokenField, setShowTokenField] = useState(false);
  const [loading, setLoading] = useState(false); // For verifying email

  const profileImageURL = user?.profile_image
    ? `http://${ip}:3000/${user.profile_image}`
    : null;

  // Function to verify email (send OTP) using axios
  const handleVerifyEmail = async () => {
    if (!newEmail) {
      alert("Please enter a new email");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `http://${ip}:3000/api/profile/update-email`,
        { email: newEmail },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      alert("Verification email sent! Please check your inbox for the token.");
      setShowTokenField(true);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to update profile with new details and OTP using axios
  const handleUpdateProfile = async () => {
    // Use newEmail if provided; otherwise, fall back to the original email.
    const updatedEmail = newEmail ? newEmail : email;

    try {
      const payload = {
        name,
        email: updatedEmail,
        bio,
        otp: token, // Provide OTP if email is updated; else it may be empty
      };

      await axios.post(`http://${ip}:3000/api/profile/update`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      await refreshUserProfile();
      alert("Profile updated successfully!");
      router.push("/profile");
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      alert(`Error: ${errorMsg}`);
    }
  };

  return (
    <ScreenWrapper bg="#fff">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Back Button and Title (same as Settings page) */}
          <Header title="Update Profile" showBackButton={true} />

          {/* Profile Image */}
          {profileImageURL && (
            <Image
              source={{ uri: profileImageURL }}
              style={styles.profileImage}
            />
          )}

          {/* Name Field */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />

          {/* Email Field */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={newEmail}
            onChangeText={(text) => {
              setNewEmail(text);
              // Reset OTP field if the email changes
              setShowTokenField(false);
              setToken("");
            }}
            placeholder={email} // Show original email as placeholder
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Show Verify Email button if a new email is entered and token field is not yet visible */}
          {newEmail && !showTokenField && (
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

          {/* Show the OTP input field if token is needed */}
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

          {/* Save Changes Button */}
          <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default UpdateProfile;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: "#fff",
    flexGrow: 1, // Allows content to grow and be scrollable
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginVertical: 20,
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
    textAlignVertical: "top", // For proper multiline text alignment
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
});

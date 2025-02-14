import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { useRouter } from "expo-router";
import config from "../../constants/config";
import BackButton from "../../components/BackButton";
import Button from "../../components/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userAuth } from "../../contexts/AuthContext";
import { StatusBar } from "expo-status-bar";

const ChangePassword = () => {
     const { authToken  } = userAuth(); 
    //  console.log('auth token', authToken);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [hideCurrentPassword, setHideCurrentPassword] = useState(true);
  const [hideNewPassword, setHideNewPassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);

  const router = useRouter();
  const ip = config.API_IP;


  const handleChangePassword = async () => {
    console.log("Button pressed: ");

    // const authToken = AsyncStorage.getItem("authToken");
    // console.log("auth token: ", authToken)
    // if (!authToken) {
    //   Alert.alert("Error", "No authentication token found. Please log in.");
    //   return;
    // }
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password do not match.");
      return;
    }

    try {
      const response = await axios.post(
        `http://${ip}:3000/api/profile/change-password`,
        { currentPassword, newPassword },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      Alert.alert("Success", response.data.message);
      router.replace("/login");
    } catch (error) {
      console.error("Error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to change password. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <View style={styles.container}>
       <StatusBar style="dark" />
      {/* Header with Back Button and Title */}
      <View style={styles.header}>
        <BackButton size={24} />
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>

      {/* Current Password Field */}
      <View style={styles.field}>
        <Text style={styles.label}>Current Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={hideCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={() => setHideCurrentPassword(!hideCurrentPassword)}
          >
            <Icon
              name={hideCurrentPassword ? "eye-off" : "eye"}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* New Password Field */}
      <View style={styles.field}>
        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={hideNewPassword}
            placeholder="Enter new password"
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={() => setHideNewPassword(!hideNewPassword)}
          >
            <Icon
              name={hideNewPassword ? "eye-off" : "eye"}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password Field */}
      <View style={styles.field}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={hideConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={() => setHideConfirmPassword(!hideConfirmPassword)}
          >
            <Icon
              name={hideConfirmPassword ? "eye-off" : "eye"}
              size={20}
              color="#888"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Change Password Button using Custom Button Component */}
      <Button
        title="Change Password"
        onPress={handleChangePassword}
        buttonStyle={styles.customButton}
        textStyle={styles.customButtonText}
      />
    </View>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginRight: 32, // Provides space to balance the back button on the left
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#000",
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#000",
  },
  // Optional custom styles for the Button component
  customButton: {
    marginTop: 10,
  },
  customButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
});

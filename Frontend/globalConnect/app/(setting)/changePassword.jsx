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
import { theme } from "../../constants/theme";
import ScreenWrapper from "../../components/ScreenWrapper";
import Header from "../../components/Header";

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
    <ScreenWrapper>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Header title="Change Password" showBackButton={true} />
        
        <View style={styles.content}>
          <View style={styles.card}>
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
                  placeholderTextColor={theme.colors.gray}
                />
                <TouchableOpacity
                  onPress={() => setHideCurrentPassword(!hideCurrentPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={hideCurrentPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.colors.gray}
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
                  placeholderTextColor={theme.colors.gray}
                />
                <TouchableOpacity
                  onPress={() => setHideNewPassword(!hideNewPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={hideNewPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.colors.gray}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Field */}
            <View style={[styles.field, styles.lastField]}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={hideConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.colors.gray}
                />
                <TouchableOpacity
                  onPress={() => setHideConfirmPassword(!hideConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={hideConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color={theme.colors.gray}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Button
            title="Change Password"
            onPress={handleChangePassword}
            buttonStyle={styles.button}
            textStyle={styles.buttonText}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  field: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    paddingBottom: 20,
  },
  lastField: {
    marginBottom: 0,
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  eyeIcon: {
    padding: 12,
  },
  button: {
    marginTop: 'auto',
    marginBottom: 30,
    borderRadius: 12,
    height: 56,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
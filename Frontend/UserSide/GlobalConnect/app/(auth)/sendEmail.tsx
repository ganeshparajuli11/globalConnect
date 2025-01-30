import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import config from "../config";
export default function SendEmail() {
  const ip = config.API_IP;
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      // Make API call to send OTP
      const response = await axios.post(
        `http://${ip}:3000/api/profile/forgot-password`,
        { email }
      );

      // Check the response from the backend
      if (response.data?.message === "OTP sent to your email.") {
        // Show success message using Toast
        Toast.show({
          type: "success",
          position: "top",
          text1: "OTP sent to your email",
          visibilityTime: 3000,
          autoHide: true,
        });

        // Navigate to EnterOTP page with email as query parameter
        router.replace(`/enterOTP?email=${encodeURIComponent(email)}`);
      } else {
        // Show error message using Toast
        Toast.show({
          type: "error",
          position: "top",
          text1: "Something went wrong. Please try again.",
          visibilityTime: 3000,
          autoHide: true,
        });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      // Show error message using Toast
      Toast.show({
        type: "error",
        position: "top",
        text1: "Failed to send OTP. Please try again later.",
        visibilityTime: 3000,
        autoHide: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>

      {/* Email input field */}
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Send OTP button */}
      <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
        <Text style={styles.buttonText}>Send OTP</Text>
      </TouchableOpacity>

      {/* Toast container */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "80%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    color: "#333",
  },
  button: {
    width: "80%",
    padding: 12,
    backgroundColor: "#000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

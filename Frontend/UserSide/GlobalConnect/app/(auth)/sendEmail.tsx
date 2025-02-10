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
      const response = await axios.post(
        `http://${ip}:3000/api/profile/forgot-password`,
        { email }
      );
      const message = response.data?.message;

      if (message === "OTP sent to your email.") {
        Toast.show({
          type: "success",
          position: "top",
          text1: message,
          visibilityTime: 3000,
          autoHide: true,
        });
        router.replace(`/enterOTP?email=${encodeURIComponent(email)}`);
      } else {
        Alert.alert("Error", message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      const errMessage =
        error.response?.data?.message ||
        "Failed to send OTP. Please try again later.";
      Alert.alert("Error", errMessage);
    }
  };

  return (
    <View style={styles.container}>
      {/* Text Logo */}
      <Text style={styles.logoText}>
        <Text style={styles.logoGlobal}>Global</Text>
        <Text style={styles.logoConnect}>Connect</Text>
      </Text>

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your email address to receive an OTP
      </Text>

      {/* Form Container with a simple border */}
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#888"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
          <Text style={styles.buttonText}>Send OTP</Text>
        </TouchableOpacity>
      </View>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // White background for a clean look
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  logoText: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 20,
  },
  logoGlobal: {
    color: "#007ACC", // Dark blue (like VS Code icon) for "Global"
  },
  logoConnect: {
    color: "#000", // Black for "Connect"
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
  },
  formContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 10,
    padding: 20,
  },
  input: {
    fontSize: 16,
    color: "#000",
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

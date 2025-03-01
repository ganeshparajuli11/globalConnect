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
import config from "../../constants/config";
import { theme } from "../../constants/theme";
import Loading from "../../components/Loading";


export default function SendEmail() {
  const ip = config.API_IP;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `http://${ip}:3000/api/profile/forgot-password`,
        { email }
      );
      const message = response.data?.message;

      if (message === "OTP sent to your email.") {
        router.replace(`/enterOTP?email=${encodeURIComponent(email)}`);
      } else {
        Alert.alert("Error", message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      const errMessage =
        error.response?.data?.message ||
        "Failed to send OTP. Please try again later.";
      Alert.alert("Error", errMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>
        <Text style={styles.logoGlobal}>Global</Text>
        <Text style={styles.logoConnect}>Connect</Text>
      </Text>

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your email address to receive an OTP
      </Text>

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
        <TouchableOpacity style={styles.button} onPress={handleSendOTP} disabled={loading}>
          {loading ? <Loading inline /> : <Text style={styles.buttonText}>Send OTP</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    color: "#007ACC",
  },
  logoConnect: {
    color: "#000",
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
    backgroundColor: theme.colors.primary,
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
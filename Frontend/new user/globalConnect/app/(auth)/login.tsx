import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';  // Import Ionicons for the eye icon

export default function Login() {
  console.log("Problem here in login.");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);  // State for toggling password visibility
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://192.168.18.105:3000/api/users/login", { email, password });

      if (response.data?.token) {
        // Store authToken and userData in AsyncStorage
        await AsyncStorage.setItem("authToken", response.data.token);
        await AsyncStorage.setItem("userData", JSON.stringify(response.data.user));

        Alert.alert("Login Successful!", `Welcome, ${response.data.user.name}`);
        router.replace("/(tab)/Home");  // Navigate to the next screen
      } else {
        Alert.alert("Error", "Invalid response from server.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Login Failed", "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome</Text>
      <Text style={styles.subtitle}>Login to your account</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Email here"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry={!showPassword}  // Toggle secureTextEntry based on showPassword state
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.showHideButton}
          onPress={() => setShowPassword(!showPassword)}  // Toggle password visibility
        >
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="gray" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace("/sendEmail")}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.loginButton, loading && styles.disabledButton]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginText}>{loading ? "Logging in..." : "Login"}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>
        <TouchableOpacity onPress={() => router.push("/signup")}>
          <Text style={styles.createAccount}> Create Now</Text>
        </TouchableOpacity>
      </View>

      <Image source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }} style={styles.googleIcon} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "white",
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
    position: "relative",  // Needed for positioning the show/hide button
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#000",
    backgroundColor: "#F7FAFC",
  },
  showHideButton: {
    position: "absolute",
    right: 10,
    top: 35,
  },
  forgotPassword: {
    fontSize: 14,
    color: "red",
    textAlign: "right",
    marginTop: 8,
  },
  loginButton: {
    backgroundColor: "black",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: "#A0AEC0",
  },
  loginText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  footerText: {
    color: "#666",
  },
  createAccount: {
    color: "red",
    fontWeight: "bold",
  },
  googleIcon: {
    width: 32,
    height: 32,
    alignSelf: "center",
    marginTop: 24,
  },
});

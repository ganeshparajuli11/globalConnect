import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  BackHandler,
  Modal,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import BackButton from "../components/BackButton";
import Button from "../components/Button"; // Reusable Button component
import { StatusBar } from "expo-status-bar";
import axios from "axios";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import config from "../constants/config";
import { theme } from "../constants/theme";
import { hp, wp } from "../helpers/common";
import { userAuth } from "../contexts/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
// --- Axios interceptor to suppress error popups after logout ---
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Log the error for debugging but do not show an alert popup.
      console.warn("Axios 401 error suppressed:", error);
    }
    return Promise.reject(error);
  }
);
// Update the axios interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors silently
    if (error.response && error.response.status === 401) {
      console.warn("Token expired or invalid - redirecting to login");
      return Promise.reject(error);
    }
    // For other errors, let them propagate
    return Promise.reject(error);
  }
);
const Login = () => {
  const ip = config.API_IP;
  console.log("ip", ip);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const router = useRouter();
  const { setAuth } = userAuth();

  // Override hardware back button so that it navigates to the Welcome page.
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/Welcome");
        return true; // Prevent default back action
      };
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [router])
  );

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      setShowErrorModal(true);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `http://${ip}:3000/api/users/login`,
        { email, password }
      );
      if (response.data?.authToken) {
        // Use the authContext to store user data and token
        await setAuth(response.data.data.user, response.data.authToken);
  
        Alert.alert(
          "Login Successful!",
          `Welcome, ${response.data.data.user.name}`
        );
        router.replace("/home");
      } else {
        setErrorMessage("Invalid response from server.");
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Invalid email or password."
      );
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <StatusBar style="dark" />

      <View style={styles.backButtonContainer}>
        <BackButton onPress={() => router.replace("/Welcome")} />
      </View>

      <View style={styles.container}>
        <Text style={styles.welcomeText}>Welcome Back !!</Text>
        <Text style={styles.subtitle}>Login to your account</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Email here"
            placeholderTextColor={theme.colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Password"
              placeholderTextColor={theme.colors.textLight}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.showHideButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color={theme.colors.textLight}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.replace("/sendEmail")}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Reusable Button component for Login */}
        <Button
          title="Login"
          onPress={handleLogin}
          loading={loading}
          buttonStyle={styles.button}
          textStyle={styles.buttonText}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/signUp")}>
            <Text style={styles.createAccount}> Create Now</Text>
          </TouchableOpacity>
        </View>

        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg",
          }}
          style={styles.googleIcon}
        />
      </View>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              onPress={() => setShowErrorModal(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  backButtonContainer: {
    position: "absolute",
    top: hp(6),
    left: wp(3),
    zIndex: 10,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: theme.colors.white,
    paddingHorizontal: wp(5),
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: theme.fonts.bold,
    textAlign: "center",
    color: theme.colors.black,
    marginBottom: hp(1),
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: theme.colors.textLight,
    marginBottom: hp(3),
  },
  inputContainer: {
    marginBottom: hp(2),
  },
  label: {
    fontSize: 14,
    color: theme.colors.textDark,
    marginBottom: hp(1),
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(3),
    height: hp(6),
    fontSize: 14,
    color: theme.colors.textDark,
    backgroundColor: theme.colors.lightGray,
  },
  inputWrapper: {
    position: "relative",
    height: hp(6),
    justifyContent: "center",
  },
  inputWithIcon: {
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(3),
    paddingRight: wp(10),
    height: "100%",
    fontSize: 14,
    color: theme.colors.textDark,
    backgroundColor: theme.colors.lightGray,
  },
  showHideButton: {
    position: "absolute",
    right: wp(3),
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  forgotPassword: {
    fontSize: 14,
    color: theme.colors.primary,
    textAlign: "right",
    marginTop: hp(1),
  },
  button: {
    marginTop: hp(2),
  },
  buttonText: {},
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: hp(2),
  },
  footerText: {
    color: theme.colors.textLight,
  },
  createAccount: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.bold,
  },
  googleIcon: {
    width: wp(10),
    height: wp(10),
    alignSelf: "center",
    marginTop: hp(3),
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: wp(80),
    padding: wp(5),
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: hp(2.5),
    fontWeight: theme.fonts.bold,
    color: theme.colors.black,
    marginBottom: hp(1),
  },
  modalMessage: {
    fontSize: hp(2),
    color: theme.colors.textDark,
    textAlign: "center",
    marginBottom: hp(2),
  },
  modalButton: {
    width: wp(50),
    paddingVertical: hp(1.5),
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: hp(2),
    color: theme.colors.white,
    textAlign: "center",
  },
});
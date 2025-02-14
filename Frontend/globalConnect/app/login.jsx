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
import { useFocusEffect } from '@react-navigation/native';

const Login = () => {
  const ip = config.API_IP;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { setAuth } = userAuth();

  // Disable hardware back button on this screen
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Returning true prevents the default back navigation
        return true;
      };
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(
        `http://${ip}:3000/api/users/login`,
        { email, password }
      );
      if (response.data?.token) {
        await setAuth(response.data.user, response.data.token);
        Alert.alert("Login Successful!", `Welcome, ${response.data.user.name}`);
        router.replace('/home');
      } else {
        Alert.alert("Error", "Invalid response from server.");
      }
    } catch (error) {
      Alert.alert("Login Failed", "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <StatusBar style="dark" />

      <View style={styles.backButtonContainer}>
        <BackButton onPress={() => router.back("/Welcome")} />
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
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  backButtonContainer: {
    position: "absolute",
    top: hp(6), // Offset to avoid overlapping the status bar
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
    paddingRight: wp(10), // Extra space for the icon
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
  buttonText: {
    // Optionally override button text styles here if needed
  },
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
});

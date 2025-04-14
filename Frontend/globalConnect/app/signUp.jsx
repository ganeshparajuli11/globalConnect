import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Platform,
  Modal,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import config from "../constants/config";
import axios from "axios";
import { theme } from "../constants/theme";
import { hp, wp } from "../helpers/common";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { userAuth } from "../contexts/AuthContext";

const SignUp = () => {
  const ip = config.API_IP;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  const router = useRouter();
  const { setAuth } = userAuth();

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Enhanced password validation using regex:
  // At least 8 characters, one uppercase, one lowercase, one number, and one special character.
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  const isValidPassword = (pwd) => {
    return passwordRegex.test(pwd);
  };

  const formatDate = (date) => {
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    return `${month < 10 ? "0" + month : month}/${
      day < 10 ? "0" + day : day
    }/${year}`;
  };

  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleSignup = async () => {
    // Validate that all fields are filled
    if (!name || !email || !password || !confirmPassword || !dob) {
      setErrorMessage("Please fill in all fields.");
      setShowErrorModal(true);
      return;
    }
    // Validate email format
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      setShowErrorModal(true);
      return;
    }
    // Validate enhanced password strength
    if (!isValidPassword(password)) {
      setErrorMessage(
        "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character."
      );
      setShowErrorModal(true);
      return;
    }
    // Validate matching passwords
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setShowErrorModal(true);
      return;
    }
    // Validate age requirement
    if (calculateAge(dob) < 18) {
      setErrorMessage("You must be at least 18 years old to sign up.");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`http://${ip}:3000/api/users/signup`, {
        name,
        email,
        password,
        dob: dob.toISOString(),
      });

      // Check for the authToken key as returned from the backend.
      if (response.data?.authToken) {
        // Store user data and token using the auth context.
        await setAuth(response.data.data.user, response.data.authToken);

        // Send OTP to the user's email
        const otpResponse = await axios.post(
          `http://${ip}:3000/api/profile/newuser`,
          { email }
        );

        const message = otpResponse.data?.message;
        if (message === "OTP sent to your email.") {
          // Redirect to verifyOTP page with the user's email
          router.replace(`/verifyNewUserOtp?email=${encodeURIComponent(email)}`);
        } else {
          setErrorMessage(message || "Something went wrong. Please try again.");
          setShowErrorModal(true);
        }
      } else {
        setErrorMessage("Invalid response from server.");
        setShowErrorModal(true);
      }
    } catch (error) {
      // Extract message from error response if available
      const backendMessage =
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : error.message;

      // Suppress detailed backend error and show a user-friendly message
      if (backendMessage.includes("Password must be at least 8 characters")) {
        setErrorMessage("Your password does not meet the strength requirements.");
      } else {
        setErrorMessage("Something went wrong. Please try again.");
      }
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <StatusBar style="dark" />
      <View style={styles.backButtonContainer}>
        <BackButton />
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>Signup</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={theme.colors.textLight}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.colors.textLight}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* Password Field with Toggle */}
        <View style={styles.inputWithIcon}>
          <TextInput
            style={styles.inputField}
            placeholder="Password"
            placeholderTextColor={theme.colors.textLight}
            secureTextEntry={!isPasswordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off" : "eye"}
              size={hp(2.5)}
              color={theme.colors.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password Field with Toggle */}
        <View style={styles.inputWithIcon}>
          <TextInput
            style={styles.inputField}
            placeholder="Confirm Password"
            placeholderTextColor={theme.colors.textLight}
            secureTextEntry={!isConfirmPasswordVisible}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
          >
            <Ionicons
              name={isConfirmPasswordVisible ? "eye-off" : "eye"}
              size={hp(2.5)}
              color={theme.colors.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* Date of Birth Picker */}
        <Pressable
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateText, { color: theme.colors.textDark }]}>
            {dob ? formatDate(dob) : "Date of Birth"}
          </Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={dob}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === "ios");
              if (selectedDate) {
                setDob(selectedDate);
              }
            }}
            maximumDate={new Date()}
          />
        )}

        <Button
          title="Signup"
          onPress={handleSignup}
          loading={loading}
          buttonStyle={styles.button}
          textStyle={styles.buttonText}
        />

        <Text style={styles.loginText}>
          Already have an account?{" "}
          <Text style={styles.loginLink} onPress={() => router.push("login")}>
            Login
          </Text>
        </Text>
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

export default SignUp;

const styles = StyleSheet.create({
  backButtonContainer: {
    position: "absolute",
    top: hp(6),
    left: wp(3),
    zIndex: 10,
  },
  container: {
    flex: 1,
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    justifyContent: "center",
    backgroundColor: theme.colors.white,
  },
  title: {
    fontSize: hp(3),
    fontWeight: theme.fonts.bold,
    textAlign: "center",
    color: theme.colors.black,
    marginBottom: hp(2),
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(3),
    height: hp(6),
    fontSize: hp(2),
    color: theme.colors.textDark,
    backgroundColor: theme.colors.lightGray,
    marginBottom: hp(2),
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.lightGray,
    marginBottom: hp(2),
    paddingHorizontal: wp(3),
    height: hp(6),
  },
  inputField: {
    flex: 1,
    fontSize: hp(2),
    color: theme.colors.textDark,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: theme.colors.gray,
    borderRadius: theme.radius.md,
    paddingHorizontal: wp(3),
    height: hp(6),
    justifyContent: "center",
    backgroundColor: theme.colors.lightGray,
    marginBottom: hp(2),
  },
  dateText: {
    fontSize: hp(2),
  },
  button: {
    marginTop: hp(2),
  },
  buttonText: {},
  loginText: {
    textAlign: "center",
    marginTop: hp(2),
    fontSize: hp(2),
    color: theme.colors.textLight,
  },
  loginLink: {
    color: theme.colors.primary,
    fontWeight: theme.fonts.bold,
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

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Platform,
} from "react-native";
import ScreenWrapper from "../components/ScreenWrapper";
import BackButton from "../components/BackButton";
import Button from "../components/Button";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import config from "../constants/config";

// Import theme and responsive helpers
import { theme } from "../constants/theme";
import { hp, wp } from "../helpers/common";

// Import vector icons for password toggle
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

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

  const router = useRouter();

  const formatDate = (date) => {
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    return `${month < 10 ? "0" + month : month}/${
      day < 10 ? "0" + day : day
    }/${year}`;
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword || !dob) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://${ip}:3000/api/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          dob: dob.toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Signup successful!");
        await AsyncStorage.setItem("authToken", data.token);
        router.replace("/destination");
      } else {
        Alert.alert("Error", data.message || "Something went wrong!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <StatusBar style="dark" />
      {/* Back button container now uses the same top offset as Login */}
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
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
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
        <Pressable style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
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
    </ScreenWrapper>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  backButtonContainer: {
    position: "absolute",
    top: hp(6), // Updated to match Login's back button position so it doesn't cover the status bar
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
  buttonText: {
    // Optionally override button text styles here if needed
  },
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
});

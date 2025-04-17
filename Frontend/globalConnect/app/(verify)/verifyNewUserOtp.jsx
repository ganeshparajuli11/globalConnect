import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import axios from "axios";
import { useRouter, useLocalSearchParams } from "expo-router";
import config from "../../constants/config";
import { theme } from "../../constants/theme";
import Loading from "../../components/Loading";

export default function VerifyOTP() {
  const ip = config.API_IP;  
  const [otpDigits, setOtpDigits] = useState(new Array(6).fill(""));
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { email: emailFromQuery } = useLocalSearchParams(); 
  const router = useRouter();
  const inputRefs = useRef([]);

  // If email is passed in query parameters, set it
  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery); 
    }
  }, [emailFromQuery]);

  // Resend OTP cooldown effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handler for each OTP digit change
  const handleChangeText = (value, index) => {
    if (value && !/^\d$/.test(value)) {
      // Allow only a single numeric digit
      return;
    }
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);

    // Auto-focus the next input if a digit is entered
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handler to detect backspace on an empty input for refocusing previous field
  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Verify OTP by calling the verify-newuser endpoint
  const handleVerifyOTP = async () => {
    if (otpDigits.includes("")) {
      Alert.alert("Error", "Please fill in all the OTP fields.");
      return;
    }
    const otp = otpDigits.join("");
    setLoading(true);
    try {
      const response = await axios.post(`http://${ip}:3000/api/profile/verify-newuser`, {
        email,
        otp,
      });
      const message = response.data?.message;
      if (message === "Email verified successfully.") {
        Alert.alert("Success", message);
        // Navigate to destination page upon success
        router.replace("/destination");
      } else {
        Alert.alert("Error", message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      const errMessage = error.response?.data?.message || "Failed to verify OTP. Please try again later.";
      Alert.alert("Error", errMessage);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler using the new user endpoint for email sending
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`http://${ip}:3000/api/profile/newuser`, { email });
      const message = response.data?.message;
      if (message === "OTP sent to your email.") {
        Alert.alert("Success", "OTP has been resent to your email");
      } else {
        Alert.alert("Error", message || "Failed to resend OTP");
      }
      setResendCooldown(30); // Start 30-second cooldown
    } catch (error) {
      const errMessage = error.response?.data?.message || "Failed to resend OTP";
      Alert.alert("Error", errMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>

      {/* OTP Input Fields */}
      <View style={styles.otpContainer}>
        {otpDigits.map((digit, index) => (
          <TextInput
            key={index}
            style={styles.otpInput}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(value) => handleChangeText(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            ref={(ref) => (inputRefs.current[index] = ref)}
            autoFocus={index === 0}
          />
        ))}
      </View>

      {/* Verify OTP Button */}
      <TouchableOpacity style={styles.button} onPress={handleVerifyOTP} disabled={loading}>
        {loading ? <Loading inline /> : <Text style={styles.buttonText}>Verify OTP</Text>}
      </TouchableOpacity>

      {/* Resend OTP Button */}
      <TouchableOpacity 
        style={[
          styles.resendButton, 
          resendCooldown > 0 && styles.resendButtonDisabled
        ]} 
        onPress={handleResendOTP}
        disabled={resendCooldown > 0 || loading}
      >
        <Text style={styles.resendButtonText}>
          {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
        </Text>
      </TouchableOpacity>
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
    color: theme.colors.primary,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  otpInput: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 20,
    marginHorizontal: 5,
    color: "#333",
  },
  button: {
    width: "80%",
    padding: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Styles for the Resend OTP button
  resendButton: {
    marginTop: 20,
    padding: 10,
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
  resendButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

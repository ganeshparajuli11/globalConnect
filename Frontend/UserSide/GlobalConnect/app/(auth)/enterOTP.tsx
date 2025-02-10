import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import config from "../config";

export default function EnterOTP() {
  const ip = config.API_IP;  
  const [otpDigits, setOtpDigits] = useState(new Array(6).fill(''));
  const [email, setEmail] = useState('');
  const { email: emailFromQuery } = useLocalSearchParams(); 
  const router = useRouter();
  const inputRefs = useRef([]);

  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery); 
    }
  }, [emailFromQuery]);

  // Handler for each OTP digit change
  const handleChangeText = (value, index) => {
    if (value && !/^\d$/.test(value)) {
      // Only allow a single numeric digit
      return;
    }
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);

    // Auto-focus the next input if a value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handler to detect backspace on an empty input to focus the previous field
  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOTP = async () => {
    // Check if all fields are filled
    if (otpDigits.includes('')) {
      Alert.alert('Error', 'Please fill in all the OTP fields.');
      return;
    }

    const otp = otpDigits.join('');

    try {
      // Make API call to verify OTP
      const response = await axios.post(`http://${ip}:3000/api/profile/verify-otp`, {
        email,
        otp,
      });

      const message = response.data?.message;
      
      // Check if the OTP verification is successful
      if (message === 'OTP verified. You can now reset your password.') {
        Alert.alert('Success', message);
        // Navigate to the ConfirmPassword page with email as query parameter
        router.replace(`/confirmPassword?email=${encodeURIComponent(email)}`);
      } else {
        Alert.alert('Error', message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      // Show the error message from the backend, or a default message if none is provided
      const errMessage =
        error.response?.data?.message ||
        'Failed to verify OTP. Please try again later.';
      Alert.alert('Error', errMessage);
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
      <TouchableOpacity style={styles.button} onPress={handleVerifyOTP}>
        <Text style={styles.buttonText}>Verify OTP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 40,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    marginHorizontal: 5,
    color: '#333',
  },
  button: {
    width: '80%',
    padding: 12,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

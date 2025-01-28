import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function EnterOTP() {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const { email: emailFromQuery } = useLocalSearchParams(); 
  
  const router = useRouter();

  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery); 
    }
  }, [emailFromQuery]);

  console.log("checking email here: ", emailFromQuery);
  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    try {
      // Make API call to verify OTP
      const response = await axios.post('http://192.168.18.105:3000/api/profile/verify-otp', {
        email,
        otp
      });

      // Check if the OTP verification is successful
      if (response.data?.message === 'OTP verified. You can now reset your password.') {
        Alert.alert('Success', 'OTP verified successfully');
        
        // Navigate to the ConfirmPassword page with email as query parameter
        router.replace(`/confirmPassword?email=${encodeURIComponent(email)}`);
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>

      {/* OTP Input */}
      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={otp}
        onChangeText={setOtp}
      />

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
  input: {
    width: '80%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  button: {
    width: '80%',
    padding: 12,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';  // Import Ionicons for the eye icon

export default function ConfirmPassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);  // State for showing/hiding new password
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);  // State for showing/hiding confirm password
    const router = useRouter();

    // Use useSearchParams to fetch the email from query parameters
    const { email: emailFromQuery } = useLocalSearchParams();
    console.log("email in the confirm password", email)

    useEffect(() => {
        if (emailFromQuery) {
            setEmail(emailFromQuery);
        }
    }, [emailFromQuery]);

    // Function to handle password submission
    const handleSubmit = async () => {
        if (newPassword === '' || confirmPassword === '') {
            Alert.alert('Error', 'Please fill in both fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        console.log("Email:", email);
        console.log("New Password:", newPassword);
        console.log("Confirm Password:", confirmPassword);

        try {
            // Make API call to reset the password
            const response = await axios.post('http://192.168.18.105:3000/api/profile/reset-password', { email, newPassword });

            // Check the response from the backend
            if (response.data?.message === 'Password reset successful.') {
                Alert.alert('Success', 'Your password has been reset successfully');

                // Navigate to the login page
                router.replace('/login');
            } else {
                Alert.alert('Error', 'Failed to reset password. Please try again.');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            Alert.alert('Error', 'Failed to reset password. Please try again later.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Confirm New Password</Text>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter New Password"
                    placeholderTextColor="#aaa"
                    secureTextEntry={!showNewPassword}  // Toggle visibility based on showNewPassword state
                    value={newPassword}
                    onChangeText={setNewPassword}
                />
                <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}  // Toggle new password visibility
                >
                    <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={24} color="gray" />
                </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    placeholderTextColor="#aaa"
                    secureTextEntry={!showConfirmPassword}  // Toggle visibility based on showConfirmPassword state
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}  // Toggle confirm password visibility
                >
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="gray" />
                </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Submit</Text>
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
    inputContainer: {
        width: '80%',
        position: 'relative',  // Needed for positioning the eye icon
        marginBottom: 20,
    },
    input: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
    },
    eyeButton: {
        position: 'absolute',
        right: 10,
        top: 10,
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

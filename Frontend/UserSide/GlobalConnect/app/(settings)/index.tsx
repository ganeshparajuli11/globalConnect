import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage'; 
const Index = () => {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleLogout = () => {
    // Clear authToken from local storage
    try {
      AsyncStorage.removeItem('authToken');
      Alert.alert('Logged Out', 'You have been logged out successfully.');
      router.replace('/login'); // Redirect to login screen
    } catch (error) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
      console.error('Logout Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Settings</Text>
      </View>

      <View style={styles.body}>
        <TouchableOpacity style={styles.option} onPress={() => router.replace("/(settings)/password")}>
          <Text style={styles.optionText}>Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => router.replace("/(settings)/PrivacyPolicyScreen")}>
          <Text style={styles.optionText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => router.replace("/(settings)/termsAndCondition")}>
          <Text style={styles.optionText}>Terms and Conditions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => router.push("/destination")}>
          <Text style={styles.optionText}>Destination</Text>
        </TouchableOpacity>

        <View style={styles.option}>
          <Text style={styles.optionText}>Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
          />
        </View>

        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Blocked</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={handleLogout}>
          <Text style={styles.optionText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    height: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
});

export default Index;

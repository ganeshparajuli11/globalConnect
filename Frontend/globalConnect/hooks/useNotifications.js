import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../constants/config';

// Configure Notification Settings
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Function to Register for Push Notifications
export async function registerForPushNotificationsAsync() {
  try {
    console.log("🔄 Starting push notification registration...");

    if (!Device.isDevice) {
      console.log('❌ Must use a physical device for Push Notifications');
      return;
    }

    // Request notification permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Push notification permission denied.');
      return;
    }

    // Get the Expo push token (Include project ID if needed)
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: config.EXPO_PROJECT_ID, // Ensure this is defined in `config.js`
    });

    if (!token) {
      console.log('❌ Failed to retrieve push token.');
      return;
    }

    console.log('✅ Expo Push Token:', token);

    // Store token locally for debugging (Optional)
    await AsyncStorage.setItem("expoPushToken", token);

    // Ensure we have an authentication token
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) {
      console.log('❌ No auth token found, skipping push token upload.');
      return;
    }

    // Send token to the backend
    const response = await axios.post(
      `http://${config.API_IP}:3000/api/register`,  
      { expoPushToken: token },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log("✅ Push token uploaded successfully!", response.data);
  } catch (error) {
    console.error("❌ Error registering push notifications:", error.response?.data || error.message);
  }
}

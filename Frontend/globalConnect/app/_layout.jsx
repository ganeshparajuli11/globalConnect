import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, LogBox, Alert } from "react-native";
import { Stack, useRouter, useNavigationContainerRef } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Notifications from "expo-notifications";
import { AuthProvider, userAuth } from "../contexts/AuthContext";
import config from "../constants/config";
import { SocketProvider } from "./SocketProvider";

const ip = config.API_IP;

// Configure notification behavior (optional)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const MainLayout = () => {
  const { user, setUserData, setAuth } = userAuth();
  const router = useRouter();
  const navigationRef = useNavigationContainerRef();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Helper: Register push token if not set
  const registerPushToken = async (token, authToken) => {
    try {
      // Send token to API endpoint to update the user's expoPushToken
      const endpoint = `http://${ip}:3000/api/register/`;
      const response = await axios.post(
        endpoint,
        { expoPushToken: token },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      console.log("✅ Push token updated:", response.data);
    } catch (error) {
      console.error("❌ Error updating push token:", error?.response?.data || error.message);
    }
  };

  useEffect(() => {
    const checkToken = async () => {
      try {
        if (!isMounted) return;

        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          const endpoint = `http://${ip}:3000/api/dashboard/getUserData`;
          const response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.status === 200) {
            const userData = response.data.data;
            setUserData(userData);

            // Update status
            await axios.put(
              `http://${ip}:3000/api/dashboard/update-status`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );

            // Check if expoPushToken is missing or invalid, then register one.
            if (!userData.expoPushToken || !userData.expoPushToken.startsWith("ExponentPushToken")) {
              // Request permission and get the Expo push token
              const { status: existingStatus } = await Notifications.getPermissionsAsync();
              let finalStatus = existingStatus;
              if (existingStatus !== "granted") {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
              }
              if (finalStatus !== "granted") {
                Alert.alert("Push Notifications", "Failed to get push token for push notifications!");
              } else {
                const tokenResponse = await Notifications.getExpoPushTokenAsync();
                console.log("Expo push token:", tokenResponse.data);
                await registerPushToken(tokenResponse.data, token);
              }
            }
            if (navigationRef.isReady()) {
              router.replace("/home");
            }
          } else {
            handleAuthFailure();
          }
        } else {
          if (navigationRef.isReady()) {
            router.replace("/Welcome");
          }
        }
      } catch (error) {
        console.error("Error during token validation:", error);
        handleAuthFailure();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    const handleAuthFailure = () => {
      setAuth(null);
      AsyncStorage.removeItem("authToken");
      if (navigationRef.isReady()) {
        router.replace("/login");
      }
    };

    checkToken();
  }, [isMounted]);

  // **Notification Listener (Foreground and Background)**
  useEffect(() => {
    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received in foreground:", notification);
        // Handle the notification here (e.g., show an alert, update UI)
        // Alert.alert(
        //   notification.request.content.title,
        //   notification.request.content.body
        // );
        // Example: Navigate to a specific screen based on notification data
      //   if (notification.request.content.data.screen === "chat") {
      //     router.push("/chat");
      //   }else{
      //     router.push("/home");
      // }}
      }
    );

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification response received:", response);
        // Handle the user's interaction with the notification here
        // Example: Navigate to a specific screen based on notification data
        // if (response.notification.request.content.data.screen === "chat") {
        //   router.push("/chat");
        // }
      }
    );

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [router]);

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "white" },
        animation: "none",
        presentation: "transparentModal",
      }}
    >
      <Stack.Screen
        name="(main)"
        options={{
          headerShown: false,
          animation: "none",
        }}
      />
      <Stack.Screen
        name="(auth)"
        options={{
          headerShown: false,
          animation: "none",
        }}
      />
      <Stack.Screen
        name="(setting)"
        options={{
          headerShown: false,
          animation: "none",
        }}
      />
      <Stack.Screen
        name="postDetails"
        options={{
          presentation: "modal",
          animation: "fade",
        }}
      />
    </Stack>
  );
};

// Ignore specific LogBox warnings
LogBox.ignoreLogs([
  "Warning: TNodeChildrenRenderer",
  "Warning: bound renderChildren",
  "Warning: TNodeChildrenRenderer",
  "Warning: MemoizedTNodeRenderer",
  "Warning: TRenderEngineProvider",
]);

const Layout = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default Layout;

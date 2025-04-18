import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, LogBox, Alert, Platform } from "react-native";
import { Stack, useRouter, useNavigationContainerRef } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Notifications from "expo-notifications";
import { AuthProvider, userAuth } from "../contexts/AuthContext";
import config from "../constants/config";
import { SocketProvider } from "./SocketProvider";
import * as Location from "expo-location";

const ip = config.API_IP;

// Configure notification behavior (optional)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Updated location request function
const requestLocationWithFallback = async () => {
  try {
    // Skip location request on web since no native bridge is available.
    if (Platform.OS === "web") {
      console.log("Skipping location request on web (no bridge available)");
      return null;
    }

    const lastDenied = await AsyncStorage.getItem("locationPermissionDenied");
    const now = new Date().getTime();

    // If previously denied within 7 days, don’t ask again.
    if (lastDenied && now - JSON.parse(lastDenied) < 7 * 24 * 60 * 60 * 1000) {
      console.log("Skipping location request - recently denied");
      return null;
    }

    // Check current permissions.
    const { status: existingStatus } =
      await Location.getForegroundPermissionsAsync();

    if (existingStatus !== "granted") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // Save the denial timestamp and log the error
        await AsyncStorage.setItem("locationPermissionDenied", JSON.stringify(now));
        console.log("Permission to access location was denied");
        return null;
      }
    }

    // If permission granted, get current location.
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Reduced,
    }).catch((error) => {
      console.error("Error fetching current location:", error);
      return null;
    });

    return location;
  } catch (error) {
    console.error("Error requesting location:", error);
    return null;
  }
};

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
      const endpoint = `http://${ip}:3000/api/register/`;
      const response = await axios.post(
        endpoint,
        { expoPushToken: token },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      console.log("✅ Push token updated:", response.data);
    } catch (error) {
      console.error(
        "❌ Error updating push token:",
        error?.response?.data || error.message
      );
    }
  };

  // Update the useEffect where tokens are checked
  useEffect(() => {
    const checkToken = async () => {
      try {
        if (!isMounted) return;

        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          // Handle location request silently
          requestLocationWithFallback()
            .then((location) => {
              if (location) {
                AsyncStorage.setItem(
                  "lastKnownLocation",
                  JSON.stringify({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    timestamp: new Date().getTime(),
                  })
                ).catch(() => { }); // Ignore storage errors
              }
            })
            .catch(() => { }); // Ignore any location errors

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
            if (
              !userData.expoPushToken ||
              !userData.expoPushToken.startsWith("ExponentPushToken")
            ) {
              const { status: existingStatus } = await Notifications.getPermissionsAsync();
              let finalStatus = existingStatus;
              if (existingStatus !== "granted") {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
              }
              if (finalStatus !== "granted") {
                Alert.alert(
                  "Push Notifications",
                  "Failed to get push token for push notifications!"
                );
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

  // Notification listeners for foreground and background
  useEffect(() => {
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.screen) {
          if (data.screen === "chat") {
            router.push(
              `/chat?userId=${encodeURIComponent(data.senderId)}&name=${encodeURIComponent(data.name)}`
            );
          } else if (data.screen === "PostDetails") {
            router.push(`/postDetails?postId=${encodeURIComponent(data.postId)}`);
          } else if (data.screen === "UserProfile") {
            router.push(`/profile?userId=${encodeURIComponent(data.userId)}`);
          } else {
            router.push("/home");
          }
        }
      });

    return () => {
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
        options={{ headerShown: false, animation: "none" }}
      />
      <Stack.Screen
        name="(auth)"
        options={{ headerShown: false, animation: "none" }}
      />
      <Stack.Screen
        name="(setting)"
        options={{ headerShown: false, animation: "none" }}
      />
      <Stack.Screen
        name="postDetails"
        options={{ presentation: "modal", animation: "fade" }}
      />
    </Stack>
  );
};

// Function to request location later if needed
const requestLocationLater = async () => {
  try {
    const lastRequest = await AsyncStorage.getItem("lastLocationRequest");
    const now = new Date().getTime();

    // Only ask again after 7 days
    if (!lastRequest || now - JSON.parse(lastRequest) > 7 * 24 * 60 * 60 * 1000) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      await AsyncStorage.setItem("lastLocationRequest", JSON.stringify(now));
      return status === "granted";
    }
    return false;
  } catch (error) {
    console.log("Location permission request delayed");
    return false;
  }
};

LogBox.ignoreLogs([
  "Warning: TNodeChildrenRenderer",
  "Warning: bound renderChildren",
  "Warning: TNodeChildrenRenderer",
  "Warning: MemoizedTNodeRenderer",
  "Warning: TRenderEngineProvider",
  "Permission to access location was denied",
  "Setting a timer for a long period of time",
  "AsyncStorage has been extracted from react-native core",
  "Current location is unavailable. Make sure that location services are enabled",
 " AxiosError: Request failed with status code 401",
 "Error: [AsyncStorage] Passing null/undefined as value is not supported. If you want to remove value, Use .removeItem method instead. Passed value: undefined Passed key: authToken"
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

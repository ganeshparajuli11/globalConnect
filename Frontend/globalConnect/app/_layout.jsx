import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, LogBox } from "react-native";
import { Stack, useRouter, useNavigationContainerRef } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { AuthProvider, userAuth } from "../contexts/AuthContext";
import config from "../constants/config";

const ip = config.API_IP;

const MainLayout = () => {
  const { setUserData, setAuth } = userAuth();
  const router = useRouter();
  const navigationRef = useNavigationContainerRef(); // Track navigation readiness
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      try {
        if (!isMounted) return; // Prevent navigation before mount

        const token = await AsyncStorage.getItem("authToken");
        console.log("Token from AsyncStorage:", token);

        if (token) {
          const endpoint = `http://${ip}:3000/api/dashboard/getUserData`;
          console.log("Attempting to hit API endpoint:", endpoint);

          const response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });

          console.log("API Response:", response);

          if (response.status === 200) {
            const userData = response.data.data;
            setUserData(userData);
            if (navigationRef.isReady()) {
              router.replace("/home");
            }
          } else {
            console.warn("Non-200 response received:", response.status);
            setAuth(null);
            await AsyncStorage.removeItem("authToken");
            if (navigationRef.isReady()) {
              router.replace("/Welcome");
            }
          }
        } else {
          console.log("No token found, redirecting to Welcome");
          if (navigationRef.isReady()) {
            router.replace("/Welcome");
          }
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(
            "Axios error validating token:",
            error.response ? JSON.stringify(error.response.data) : error.message
          );
        } else {
          console.error("Unexpected error validating token:", error);
        }
        if (navigationRef.isReady()) {
          router.replace("/login");
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkToken();
  }, [isMounted]); // Ensure navigation only happens after mount

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
};

LogBox.ignoreLogs([
  "Warning: TNodeChildrenRenderer",
  "Warning: bound renderChildren",
  "Warning: TNodeChildrenRenderer",
  "Warning: MemoizedTNodeRenderer",
  "Warning: TRenderEngineProvider",
]);

const Layout = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default Layout;

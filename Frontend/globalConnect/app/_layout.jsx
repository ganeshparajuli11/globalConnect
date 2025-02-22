import React, { useEffect, useState, useRef } from "react";
import { View, ActivityIndicator, LogBox, Alert } from "react-native";
import { Stack, useRouter, useNavigationContainerRef } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { AuthProvider, userAuth } from "../contexts/AuthContext";
import config from "../constants/config";
import SocketInitializer from "../components/SocketInitializer";
import { SocketProvider } from "./SocketProvider";


const ip = config.API_IP;

const MainLayout = () => {
  const { user, setUserData, setAuth } = userAuth();
  const router = useRouter();
  const navigationRef = useNavigationContainerRef();
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

            // 🔥 NEW: Call the `update-status` API
            axios
              .put(
                `http://${ip}:3000/api/dashboard/update-status`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              )
              .then(() =>
                console.log("User status updated successfully")
              )
              .catch((error) =>
                console.error("Error updating user status:", error)
              );

            if (navigationRef.isReady()) {
              router.replace("/home");
            }
          } else {
            handleAuthFailure();
          }
        } else {
          console.log("No token found, redirecting to Welcome");
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
      Alert.alert("Authentication Failed", "Please log in again.");
    };

    checkToken();
  }, [isMounted]);

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      {user && <SocketInitializer />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="postDetails"
          options={{
            presentation: "modal",
          }}
        />
      </Stack>
    </>
  );
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
      <SocketProvider>
        <MainLayout />
      </SocketProvider>
    </AuthProvider>
  );
};

export default Layout;

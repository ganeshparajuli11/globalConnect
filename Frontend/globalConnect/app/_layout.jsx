import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, LogBox } from "react-native";
import { Stack, useRouter, useNavigationContainerRef } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
            await axios.put(
              `http://${ip}:3000/api/dashboard/update-status`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
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
        contentStyle: { backgroundColor: 'white' },
        animation: 'none',
        presentation: 'transparentModal',
      }}
    >
      <Stack.Screen 
        name="(main)" 
        options={{ 
          headerShown: false,
          animation: 'none'
        }} 
      />
      <Stack.Screen 
        name="(auth)" 
        options={{ 
          headerShown: false,
          animation: 'none'
        }} 
      />
      <Stack.Screen 
        name="(setting)" 
        options={{ 
          headerShown: false,
          animation: 'none'
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
        <SocketProvider>
          <MainLayout />
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default Layout;

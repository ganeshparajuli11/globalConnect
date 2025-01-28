import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const SplashScreen = () => {
  const router = useRouter();
  const [dots, setDots] = useState("");

  useEffect(() => {
    const checkToken = async () => {
      try {
        // Retrieve the token from storage
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          // Validate the token by hitting the backend API
          const response = await fetch("http://192.168.18.105:3000/api/dashboard/getUserData", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            // Store user data if needed
            await AsyncStorage.setItem("userData", JSON.stringify(data.data));
            router.replace("/(tab)"); // Navigate to dashboard
          } else {
            router.replace("/login"); // Token is invalid, navigate to login
          }
        } else {
          router.replace("/login"); // No token, navigate to login
        }
      } catch (error) {
        console.error("Error validating token:", error);
        router.replace("/login"); // Navigate to login in case of errors
      }
    };

    // Handle the animated dots for the "No more stress..."
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 200);

    // Check token immediately
    checkToken();

    // Cleanup the interval on unmount
    return () => {
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        <Text style={styles.global}>Global</Text>
        <Text style={styles.connect}>Connect</Text>
      </Text>
      <Text style={styles.tagline}>No more stress{dots}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9", // Matches the design's background color
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  global: {
    color: "#4F46E5", // Blue for "Global"
  },
  connect: {
    color: "#000", // Black for "Connect"
  },
  tagline: {
    marginTop: 10,
    fontSize: 16,
    color: "#666", // Slightly faded for the tagline
    fontStyle: "italic",
  },
});

export default SplashScreen;

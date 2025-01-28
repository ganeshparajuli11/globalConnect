import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const SplashScreen = () => {
  const router = useRouter();
  const [dots, setDots] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Loading state

  useEffect(() => {
    const checkToken = async () => {
      try {
        console.log("Checking token...");
        const token = await AsyncStorage.getItem("authToken");
        console.log("Token found:", token);

        if (token) {
          const response = await fetch("http://192.168.18.105:3000/api/dashboard/getUserData", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log("Response status:", response.status);
          
          if (response.ok) {
            const data = await response.json();
            await AsyncStorage.setItem("userData", JSON.stringify(data.data));
            console.log("User data saved. Redirecting to Home.");
            
            // Redirect to Home (ensure this route exists in your app)
            router.replace("/(tab)/Home");
          } else {
            console.log("Invalid token. Redirecting to Login.");
            router.replace("/login");
          }
        } else {
          console.log("No token found. Redirecting to Login.");
          router.replace("/(auth)/login");
        }
      } catch (error) {
        console.error("Error validating token:", error);
        router.replace("/(auth)/login");
      } finally {
        setIsLoading(false);
      }
    };

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 200);

    checkToken();

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
      {isLoading ? (
        <ActivityIndicator size="large" color="#4F46E5" />
      ) : (
        <Text style={styles.tagline}>No more stress{dots}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  global: {
    color: "#4F46E5",
  },
  connect: {
    color: "#000",
  },
  tagline: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
});

export default SplashScreen;

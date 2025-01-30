import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";// Import from react-native-config
import axios from "axios";  
import config from "../config";

const SplashScreen = () => {
  const ip = config.API_IP;  // Access IP from the config
  console.log("ip: " + ip);

  const router = useRouter();
  const [dots, setDots] = useState("");

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          const response = await axios.get(`http://${ip}:3000/api/dashboard/getUserData`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.status === 200) {  
            const data = response.data;  
            await AsyncStorage.setItem("userData", JSON.stringify(data.data));
            router.replace("/(tab)");  
          } else {
            router.replace("/login"); 
          }
        } else {
          router.replace("/login");  
        }
      } catch (error) {
        console.error("Error validating token:", error);
        router.replace("/login");  
      }
    };

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : "")); // Add dots animation
    }, 200);

    checkToken();  // Check the token on load

    return () => clearInterval(dotsInterval);  // Clean up interval when the component is unmounted
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
    backgroundColor: "#f9f9f9",
  },
  title: { fontSize: 28, fontWeight: "bold" },
  global: { color: "#4F46E5" },
  connect: { color: "#000" },
  tagline: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
});

export default SplashScreen;

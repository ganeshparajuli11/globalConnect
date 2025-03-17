import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import Header from "../../components/Header";
import ScreenWrapper from "../../components/ScreenWrapper";
import { theme } from "../../constants/theme";
import { StatusBar } from "expo-status-bar";
import { userAuth } from "../../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Axios interceptor to catch and log 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Suppressed Axios error:", error);
    }
    return Promise.reject(error);
  }
);

const Setting = () => {
  const router = useRouter();
  const auth = userAuth(); 
  const { logout } = auth; 
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  // ✅ Separate logout function that ensures React handles state updates correctly
  const confirmLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: handleLogout },
    ]);
  };

  const handleLogout = async () => {
    try {
        setIsLoading(true);
        
        // Remove authToken from AsyncStorage
        await AsyncStorage.removeItem("authToken");

        // Navigate to login screen
        router.replace("/login");
    } catch (error) {
        console.error("Logout Error:", error);
        Alert.alert("Error", "Failed to logout. Please try again.");
    } finally {
        setIsLoading(false);
    }
};


  return (
    <ScreenWrapper>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Header title="Settings" showBackButton={true} />
        <View style={styles.body}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading...</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.option}
                onPress={() => router.push("/changePassword")}
              >
                <Text style={styles.optionText}>Change Password</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => router.push("/privacyPolicy")}
              >
                <Text style={styles.optionText}>Privacy Policy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => router.push("/termsAndCondition")}
              >
                <Text style={styles.optionText}>Terms and Conditions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => router.push("/destination")}
              >
                <Text style={styles.optionText}>Destination</Text>
              </TouchableOpacity>

              <View style={styles.option}>
                <Text style={styles.optionText}>Notifications</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                />
              </View>

              <TouchableOpacity
                style={styles.option}
                onPress={() => router.push("/updateProfile")}
              >
                <Text style={styles.optionText}>Update Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => router.push("/blockedUser")}
              >
                <Text style={styles.optionText}>Blocked</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={confirmLogout} // ✅ Call confirmLogout instead
                disabled={isLoading}
              >
                <Text style={styles.optionText}>Logout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Setting;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  optionText: {
    fontSize: 16,
    color: "#000",
  },
});

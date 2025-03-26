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
  const settingsGroups = [
    {
      title: "Account",
      options: [
        {
          title: "Change Password",
          route: "/changePassword",
        },
        {
          title: "Update Profile",
          route: "/updateProfile",
        },
        {
          title: "Handle Account",
          route: "/handleAccount",
        },
        {
          title: "Destination",
          route: "/destination",
        },
      ],
    },
    {
      title: "Privacy & Safety",
      options: [
        {
          title: "Blocked Users",
          route: "/blockedUser",
        },
        
      ],
    },
    {
      title: "About",
      options: [
        {
          title: "Privacy Policy",
          route: "/privacyPolicy",
        },
        {
          title: "Terms and Conditions",
          route: "/termsAndCondition",
        },
      ],
    },
  ];

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
            <View style={styles.content}>
              {settingsGroups.map((group, groupIndex) => (
                <View key={group.title} style={styles.groupContainer}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  <View style={styles.optionsContainer}>
                    {group.options.map((option, index) => (
                      <TouchableOpacity
                        key={option.route}
                        style={[
                          styles.option,
                          index === group.options.length - 1 && styles.lastOption,
                        ]}
                        onPress={() => router.push(option.route)}
                      >
                        <Text style={styles.optionText}>{option.title}</Text>
                        <Text style={styles.chevron}>›</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={confirmLogout}
                disabled={isLoading}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  body: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  groupContainer: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textLight,
    marginLeft: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  optionsContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: "500",
  },
  chevron: {
    fontSize: 20,
    color: theme.colors.gray,
  },
  logoutButton: {
    backgroundColor: theme.colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginTop: "auto",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutText: {
    color: theme.colors.danger,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Setting;
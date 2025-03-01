import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import config from "../constants/config";

const ip = config.API_IP;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true); // 🔹 Added loading state

  // Load user data and token from AsyncStorage when app starts
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userData");
        const storedToken = await AsyncStorage.getItem("authToken");

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setAuthToken(storedToken);
        }
      } catch (error) {
        console.error("Error loading auth data:", error);
      } finally {
        setLoading(false); // 🔹 Mark loading as complete
      }
    };
    loadAuthData();
  }, []);

  // Set auth details when a user logs in
  const setAuth = async (authUser, token) => {
    try {
      await AsyncStorage.setItem("userData", JSON.stringify(authUser));
      await AsyncStorage.setItem("authToken", token);
      setUser(authUser);
      setAuthToken(token);
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  };

  // Update only user data (without changing token)
  const setUserData = async (updatedFields) => {
    try {
      const storedUser = await AsyncStorage.getItem("userData");
      const currentUserData = storedUser ? JSON.parse(storedUser) : {};

      const updatedUserData = { ...currentUserData, ...updatedFields }; // Merge old & new data

      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
      setUser(updatedUserData);
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  // NEW: Refresh the user profile by fetching updated data from the API
  const refreshUserProfile = async () => {
    if (!authToken) return;
    try {
      const endpoint = `http://${ip}:3000/api/dashboard/getUserData`;
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.status === 200) {
        const userData = response.data.data;
        await AsyncStorage.setItem("userData", JSON.stringify(userData));
        setUser(userData);
      } else {
        console.error("Failed to refresh user profile:", response.status);
      }
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  };

  // Logout function to clear storage and reset state
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("userData");
      await AsyncStorage.removeItem("authToken");
      // Reset your authentication state
      setUser(null);
      setAuthToken(null);
      // If there are any pending axios requests that rely on the token,
      // consider canceling them here using cancellation tokens.
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{ user, authToken, setAuth, setUserData, refreshUserProfile, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const userAuth = () => useContext(AuthContext);

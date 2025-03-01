import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import config from "../constants/config";

const ip = config.API_IP;

/**
 * Updates the user's location only once per day per user.
 * @param {string} token - The authentication token.
 * @param {string} userId - The ID of the currently logged-in user.
 */
export const updateUserLocation = async (token, userId) => {
  try {
    // Use a key that is specific to the user
    const storageKey = `locationLastUpdated_${userId}`;
    const lastUpdate = await AsyncStorage.getItem(storageKey);
    const today = new Date().toDateString();
    if (lastUpdate === today) {
      console.log("Location already updated for this user today.");
      return;
    }

    // Request foreground location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.error("Permission to access location was denied.");
      return;
    }

    // Get current location with high accuracy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      maximumAge: 60000,
    });

    const { latitude, longitude } = location.coords;
    console.log("Device coordinates:", latitude, longitude);

    // Reverse geocode to get address details
    const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!geocode || geocode.length === 0) {
      console.error("No address found for these coordinates.");
      return;
    }
    const address = geocode[0];
    const city = address.city || address.town || address.village || "Unknown";
    const country = address.country || "Unknown";
    console.log("Fetched location:", { city, country });

    // Update location on backend
    await axios.put(
      `http://${ip}:3000/api/dashboard/update-location`,
      { lat: latitude, lng: longitude, city, country },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("Location updated on backend.");

    // Save today's date under the user-specific key so that location updates only once per day per user
    await AsyncStorage.setItem(storageKey, today);
  } catch (error) {
    console.error("Error updating location:", error);
  }
};

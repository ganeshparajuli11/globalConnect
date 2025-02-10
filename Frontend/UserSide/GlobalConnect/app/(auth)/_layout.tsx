import React from 'react';
import { TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function _layout() {
  return (
    <Stack
      screenOptions={({ navigation, route }) => ({
        // Hide header on the login screen; show on all others
        headerShown: route.name !== 'login',
        // Render a back button on every screen except login
        headerLeft: () => (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              // If we can go back in the navigation stack, do so.
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                // Otherwise, exit the app (Android only; iOS typically ignores this)
                BackHandler.exitApp();
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        ),
        headerTitle: '',
      })}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" />
      <Stack.Screen name="destination" />
      <Stack.Screen name="SendEmail" />
      <Stack.Screen name="EnterOTP" />
      <Stack.Screen name="ConfirmPassword" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginLeft: 10,
  },
});

import React from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router'; // Import useRouter hook
import Icon from 'react-native-vector-icons/Ionicons'; // Import icon library

export default function TabRootLayout() {
  const router = useRouter(); 

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {/* Add other screens in the bottom navbar here */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarShowLabel: false,
          headerShown: true,
          headerTitle: 'Home', // Set a title for the index screen
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace("/(tab)")} style={{ marginLeft: 10 }}>
              <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="password"
        options={{
          headerShown: true,  // Shows the header
          headerTitle: 'Password Manager',  // Title in the header
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace("/(tab)")} style={{ marginLeft: 10 }}>
              <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="PrivacyPolicyScreen"
        options={{
          headerShown: true,  // Shows the header
          headerTitle: 'Privacy and Policy',  // Title in the header
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace("/(tab)")} style={{ marginLeft: 10 }}>
              <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="TermsAndConditionScreen"
        options={{
          headerShown: true,  // Shows the header
          headerTitle: 'Terms And Condition',  // Title in the header
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.replace("/(tab)")} style={{ marginLeft: 10 }}>
              <Icon name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}

import React from 'react';
import { Tabs } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router'; // Import useRouter hook

export default function TabRootLayout() {
  const router = useRouter(); // Initialize router

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {/* Add other screens in the bottom navbar here */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarShowLabel: false,
        }}
      />
      <Tabs.Screen
        name="password"
        options={{
          headerShown: true,  // Shows the header
          headerTitle: 'Password Manager',  // Title in the header
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Text style={{ fontSize: 16, color: '#000' }}>Back</Text>
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
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Text style={{ fontSize: 16, color: '#000' }}>Back</Text>
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
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 10 }}>
              <Text style={{ fontSize: 16, color: '#000' }}>Back</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}

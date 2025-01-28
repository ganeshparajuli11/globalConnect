import React from 'react';
import { Tabs } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons'; // You can change this to FontAwesome, Ionicons, etc.

export default function TabRootLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
          tabBarShowLabel: false, // Hides the label
        }}
      />

      {/* Notifications Tab */}
      <Tabs.Screen
        name="activityScreen"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="notifications" color={color} size={size} />
          ),
          tabBarShowLabel: false, // Hides the label
        }}
      />

<Tabs.Screen
        name="AddPost"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="chat" color={color} size={size} /> // Message icon
          ),
          tabBarShowLabel: false, // Hides the label
        }}
      />

      {/* Messages Tab */}
      <Tabs.Screen
        name="message"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="chat" color={color} size={size} /> // Message icon
          ),
          tabBarShowLabel: false, // Hides the label
        }}
      />
            <Tabs.Screen
        name="chatPage"
        options={{
          
          tabBarShowLabel: false, // Hides the label
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" color={color} size={size} />
          ),
          tabBarShowLabel: false, // Hides the label
        }}
      />
        
    </Tabs>
  );
}

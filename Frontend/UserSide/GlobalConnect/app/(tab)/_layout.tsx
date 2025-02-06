import React from "react";
import { Tabs } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons"; 
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
          tabBarShowLabel: false, 
        }}
      />
     
    </Tabs>
  );
}

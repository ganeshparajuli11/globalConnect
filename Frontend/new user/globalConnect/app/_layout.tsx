import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TabLayout from './(tab)';
import AuthLayout from './(auth)/_layout';

const Stack = createNativeStackNavigator();

export default function AppLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('authToken');
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return null; // Add a loading spinner or placeholder if necessary
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Tab" component={TabLayout} />
      ) : (
        <Stack.Screen name="Auth" component={AuthLayout} />
      )}
    </Stack.Navigator>
  );
}

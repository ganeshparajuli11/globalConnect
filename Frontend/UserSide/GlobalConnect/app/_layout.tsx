import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Auth-related screens */}
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      {/* Tab-related screens */}
      <Stack.Screen name="(tab)" options={{ headerShown: false }} />


    </Stack>
  );
}

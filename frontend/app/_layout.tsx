import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="merchant" />
        <Stack.Screen name="agent" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="store/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="product/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="order/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>
    </AuthProvider>
  );
}

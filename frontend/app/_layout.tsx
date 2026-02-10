import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

function AuthGate() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const prevUser = useRef<any>(undefined); // undefined = never set

  useEffect(() => {
    if (loading) return;

    const wasLoggedIn = prevUser.current !== undefined && prevUser.current !== null;
    const isLoggedIn = user !== null;
    const justLoggedIn = !wasLoggedIn && isLoggedIn;
    const justLoggedOut = wasLoggedIn && !isLoggedIn;
    const isFirstLoad = prevUser.current === undefined;

    prevUser.current = user;

    if (!isLoggedIn) {
      // Not authenticated - redirect to login
      router.replace('/(auth)/login');
    } else if (isFirstLoad || justLoggedIn) {
      // Just logged in or first load with stored token - go to home
      router.replace('/home');
    }
    // If already logged in and navigating between tabs, do nothing
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="store/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      <Stack.Screen name="product/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
      <Stack.Screen name="order/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AuthGate />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
});

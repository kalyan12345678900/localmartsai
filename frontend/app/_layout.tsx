import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const hasHandledInitialAuth = useRef(false);

  useEffect(() => {
    if (loading) return;

    // Only handle initial auth redirect (app startup)
    // Login/register screens handle post-auth navigation themselves
    if (hasHandledInitialAuth.current) {
      // After initial redirect, only handle logout (user becomes null)
      if (!user) {
        const seg0 = segments[0];
        const inAuth = seg0 === '(auth)' || seg0 === 'login' || seg0 === 'register';
        if (!inAuth) {
          router.replace('/(auth)/login');
        }
      }
      return;
    }

    hasHandledInitialAuth.current = true;

    if (!user) {
      router.replace('/(auth)/login');
    } else {
      // Initial load with stored token - redirect to role dashboard
      switch (user.active_role) {
        case 'merchant': router.replace('/merchant'); break;
        case 'agent': router.replace('/agent'); break;
        case 'admin': router.replace('/admin'); break;
        default: router.replace('/(customer)/home'); break;
      }
    }
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
      <Stack.Screen name="merchant" />
      <Stack.Screen name="agent" />
      <Stack.Screen name="admin" />
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

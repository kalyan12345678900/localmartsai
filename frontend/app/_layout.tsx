import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

function AuthGate() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasHandledInitialAuth = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (hasHandledInitialAuth.current) {
      // Only handle logout after initial redirect
      if (!user) {
        router.replace('/(auth)/login');
      }
      return;
    }

    hasHandledInitialAuth.current = true;

    if (!user) {
      router.replace('/(auth)/login');
    } else {
      // All roles go to /home which renders appropriate dashboard
      router.replace('/home');
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

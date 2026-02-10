import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const seg0 = segments[0];
    // On web, route groups don't appear in segments - check for actual screen names
    const inAuthGroup = seg0 === '(auth)' || seg0 === 'login' || seg0 === 'register';
    const isIndex = segments.length === 0 || seg0 === undefined || seg0 === '';

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (inAuthGroup || isIndex) {
      switch (user.active_role) {
        case 'merchant': router.replace('/merchant'); break;
        case 'agent': router.replace('/agent'); break;
        case 'admin': router.replace('/admin'); break;
        default: router.replace('/(customer)/home'); break;
      }
    }
  }, [user, loading, segments]);

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

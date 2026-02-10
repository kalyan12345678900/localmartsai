import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/Colors';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (loading || hasRedirected.current) return;
    hasRedirected.current = true;

    const timer = setTimeout(() => {
      if (!user) {
        router.replace('/(auth)/login');
      } else {
        switch (user.active_role) {
          case 'merchant': router.replace('/merchant'); break;
          case 'agent': router.replace('/agent'); break;
          case 'admin': router.replace('/admin'); break;
          default: router.replace('/(customer)/home'); break;
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [loading]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>QuickDrop</Text>
      <Text style={styles.tagline}>Hyperlocal Delivery</Text>
      <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  logo: { fontSize: 42, fontWeight: '800', color: Colors.light.primary, letterSpacing: -1 },
  tagline: { fontSize: 16, color: Colors.light.textSecondary, marginTop: 8 },
});

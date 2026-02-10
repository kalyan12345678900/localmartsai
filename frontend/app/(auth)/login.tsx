import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, FontSizes } from '../../constants/Colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const userData = await login(email, password);
      const role = userData?.active_role || 'customer';
      switch (role) {
        case 'merchant': router.replace('/(merchant)'); break;
        case 'agent': router.replace('/(agent)'); break;
        case 'admin': router.replace('/(admin)'); break;
        default: router.replace('/(customer)/home'); break;
      }
    } catch (e: any) {
      Alert.alert('Login Failed', e.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>QuickDrop</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              testID="login-email-input"
              style={styles.input}
              placeholder="you@email.com"
              placeholderTextColor={Colors.light.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              testID="login-password-input"
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor={Colors.light.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity
              testID="login-submit-btn"
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.btnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Demo Accounts</Text>
              {[
                { label: 'Customer', email: 'customer@delivery.com' },
                { label: 'Merchant', email: 'merchant@delivery.com' },
                { label: 'Agent', email: 'agent@delivery.com' },
                { label: 'Admin', email: 'admin@delivery.com' },
              ].map((d) => (
                <TouchableOpacity
                  key={d.label}
                  testID={`demo-${d.label.toLowerCase()}-btn`}
                  style={styles.demoBtn}
                  onPress={() => { setEmail(d.email); setPassword(`${d.label.toLowerCase()}123`); }}
                >
                  <Text style={styles.demoBtnText}>{d.label}</Text>
                  <Text style={styles.demoEmail}>{d.email}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity testID="go-register-btn" onPress={() => router.push('/(auth)/register')} style={styles.linkBtn}>
              <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl },
  header: { marginTop: 60, marginBottom: 40 },
  logo: { fontSize: 36, fontWeight: '800', color: Colors.light.primary, letterSpacing: -1 },
  subtitle: { fontSize: FontSizes.lg, color: Colors.light.textSecondary, marginTop: 8 },
  form: { flex: 1 },
  label: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.light.textPrimary, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: Colors.light.background, borderRadius: Radius.md, padding: 16,
    fontSize: FontSizes.base, color: Colors.light.textPrimary, borderWidth: 1, borderColor: Colors.light.border,
  },
  btn: {
    backgroundColor: Colors.light.primary, borderRadius: Radius.full, paddingVertical: 16,
    alignItems: 'center', marginTop: 32,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: FontSizes.base, fontWeight: '700' },
  demoBox: {
    marginTop: 32, padding: 16, backgroundColor: Colors.light.background,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.light.border,
  },
  demoTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.light.textSecondary, marginBottom: 12 },
  demoBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  },
  demoBtnText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.light.textPrimary },
  demoEmail: { fontSize: FontSizes.xs, color: Colors.light.textSecondary },
  linkBtn: { alignItems: 'center', marginTop: 24, paddingBottom: 32 },
  linkText: { fontSize: FontSizes.sm, color: Colors.light.textSecondary },
  linkBold: { color: Colors.light.primary, fontWeight: '700' },
});

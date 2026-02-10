import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, FontSizes } from '../../constants/Colors';

type RoleType = 'customer' | 'merchant' | 'agent';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<RoleType>('customer');
  const [licenseNo, setLicenseNo] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [joinWhatsapp, setJoinWhatsapp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
      const userData = await register({
        name, email, password, phone,
        roles: [role, 'customer'],
        license_no: licenseNo, vehicle_no: vehicleNo,
        shop_name: shopName, shop_address: shopAddress,
        working_hours: workingHours, join_whatsapp: joinWhatsapp,
      });
      const activeRole = userData?.active_role || 'customer';
      switch (activeRole) {
        case 'merchant': router.replace('/merchant'); break;
        case 'agent': router.replace('/agent'); break;
        case 'admin': router.replace('/admin'); break;
        default: router.replace('/(customer)/home'); break;
      }
    } catch (e: any) {
      Alert.alert('Registration Failed', e.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const roles: { key: RoleType; label: string; color: string }[] = [
    { key: 'customer', label: 'Customer', color: Colors.roles.customer },
    { key: 'merchant', label: 'Merchant', color: Colors.roles.merchant },
    { key: 'agent', label: 'Delivery Agent', color: Colors.roles.agent },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="back-to-login-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join QuickDrop today</Text>

          <Text style={styles.sectionLabel}>I want to join as</Text>
          <View style={styles.roleRow}>
            {roles.map((r) => (
              <TouchableOpacity
                key={r.key}
                testID={`role-${r.key}-btn`}
                style={[styles.roleBtn, role === r.key && { backgroundColor: r.color, borderColor: r.color }]}
                onPress={() => setRole(r.key)}
              >
                <Text style={[styles.roleBtnText, role === r.key && { color: r.key === 'agent' ? '#000' : '#FFF' }]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput testID="register-name-input" style={styles.input} placeholder="Full Name *" placeholderTextColor={Colors.light.textSecondary} value={name} onChangeText={setName} />
          <TextInput testID="register-email-input" style={styles.input} placeholder="Email *" placeholderTextColor={Colors.light.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput testID="register-password-input" style={styles.input} placeholder="Password *" placeholderTextColor={Colors.light.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput testID="register-phone-input" style={styles.input} placeholder="Phone Number" placeholderTextColor={Colors.light.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          {role === 'agent' && (
            <View style={styles.roleFields}>
              <Text style={styles.sectionLabel}>Agent Details</Text>
              <TextInput testID="register-license-input" style={styles.input} placeholder="License Number *" placeholderTextColor={Colors.light.textSecondary} value={licenseNo} onChangeText={setLicenseNo} />
              <TextInput testID="register-vehicle-input" style={styles.input} placeholder="Vehicle Number *" placeholderTextColor={Colors.light.textSecondary} value={vehicleNo} onChangeText={setVehicleNo} />
            </View>
          )}

          {role === 'merchant' && (
            <View style={styles.roleFields}>
              <Text style={styles.sectionLabel}>Shop Details</Text>
              <TextInput testID="register-shop-name-input" style={styles.input} placeholder="Shop Name *" placeholderTextColor={Colors.light.textSecondary} value={shopName} onChangeText={setShopName} />
              <TextInput testID="register-shop-address-input" style={styles.input} placeholder="Shop Address *" placeholderTextColor={Colors.light.textSecondary} value={shopAddress} onChangeText={setShopAddress} />
              <TextInput testID="register-working-hours-input" style={styles.input} placeholder="Working Hours (e.g., 9AM-10PM)" placeholderTextColor={Colors.light.textSecondary} value={workingHours} onChangeText={setWorkingHours} />
            </View>
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Join WhatsApp Community</Text>
            <Switch testID="whatsapp-switch" value={joinWhatsapp} onValueChange={setJoinWhatsapp} trackColor={{ true: Colors.light.success }} />
          </View>

          <TouchableOpacity testID="register-submit-btn" style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity testID="go-login-btn" onPress={() => router.back()} style={styles.linkBtn}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: 40 },
  backBtn: { marginTop: 16 },
  backText: { fontSize: FontSizes.base, color: Colors.light.primary, fontWeight: '600' },
  title: { fontSize: 32, fontWeight: '800', color: Colors.light.textPrimary, marginTop: 24 },
  subtitle: { fontSize: FontSizes.base, color: Colors.light.textSecondary, marginTop: 4 },
  sectionLabel: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.light.textSecondary, marginTop: 24, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.light.border, alignItems: 'center' },
  roleBtnText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.light.textPrimary },
  input: {
    backgroundColor: Colors.light.background, borderRadius: Radius.md, padding: 16,
    fontSize: FontSizes.base, color: Colors.light.textPrimary, borderWidth: 1, borderColor: Colors.light.border, marginTop: 12,
  },
  roleFields: { marginTop: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingVertical: 8 },
  switchLabel: { fontSize: FontSizes.base, color: Colors.light.textPrimary },
  btn: { backgroundColor: Colors.light.primary, borderRadius: Radius.full, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: FontSizes.base, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: 20 },
  linkText: { fontSize: FontSizes.sm, color: Colors.light.textSecondary },
  linkBold: { color: Colors.light.primary, fontWeight: '700' },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function MerchantProfile() {
  const { user, logout, switchRole } = useAuth();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  const handleSwitchRole = async (role: string) => {
    setSwitching(true);
    try {
      await switchRole(role);
      switch (role) {
        case 'customer': router.replace('/(customer)/home'); break;
        case 'agent': router.replace('/(agent)'); break;
        case 'admin': router.replace('/(admin)'); break;
        default: router.replace('/(merchant)'); break;
      }
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSwitching(false); }
  };

  const handleSettlement = async () => {
    try {
      const stats = await api.getDashboardStats();
      await api.requestSettlement(stats.total_revenue || 0);
      Alert.alert('Success', 'Settlement request submitted!');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll}>
        <Text style={s.title}>Profile</Text>
        <View style={s.card}>
          <View style={s.avatar}><Ionicons name="storefront" size={28} color={Colors.roles.merchant} /></View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={s.name}>{user?.name}</Text>
            <Text style={s.email}>{user?.email}</Text>
            <View style={[s.badge, { backgroundColor: Colors.roles.merchant }]}><Text style={s.badgeText}>MERCHANT</Text></View>
          </View>
        </View>
        {user && user.roles.length > 1 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Switch Role</Text>
            {switching && <ActivityIndicator color={Colors.roles.merchant} />}
            <View style={s.roleGrid}>
              {user.roles.filter(r => r !== user.active_role).map(role => (
                <TouchableOpacity key={role} testID={`switch-${role}`} style={s.roleBtn} onPress={() => handleSwitchRole(role)}>
                  <Ionicons name={role === 'customer' ? 'person' : role === 'agent' ? 'bicycle' : 'shield'} size={18} color={Colors.roles[role as keyof typeof Colors.roles] || '#666'} />
                  <Text style={s.roleBtnText}>{role.charAt(0).toUpperCase() + role.slice(1)} Mode</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        <TouchableOpacity testID="request-settlement-btn" style={s.settlementBtn} onPress={handleSettlement}>
          <Ionicons name="wallet" size={20} color="#FFF" />
          <Text style={s.settlementText}>Request Settlement</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="logout-btn" style={s.logoutBtn} onPress={() => Alert.alert('Logout', 'Sure?', [{ text: 'Cancel' }, { text: 'Logout', onPress: logout }])}>
          <Ionicons name="log-out-outline" size={22} color={Colors.light.error} />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { paddingHorizontal: Spacing.xl },
  title: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary, marginTop: Spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: Radius.lg, marginTop: Spacing.xl, ...Shadows.sm },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.light.background, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.roles.merchant },
  name: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.light.textPrimary },
  email: { fontSize: FontSizes.sm, color: Colors.light.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start', marginTop: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFF', letterSpacing: 1 },
  section: { marginTop: Spacing.xxl },
  sectionTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.light.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  roleGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  roleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.light.border, backgroundColor: '#FFF' },
  roleBtnText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.light.textPrimary },
  settlementBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.roles.merchant, paddingVertical: 16, borderRadius: Radius.full, marginTop: Spacing.xxl },
  settlementText: { color: '#FFF', fontSize: FontSizes.base, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, marginTop: 16 },
  logoutText: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.light.error },
});

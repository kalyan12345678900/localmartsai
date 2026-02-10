import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes } from '../../constants/Colors';

export default function AgentProfile() {
  const { user, logout, switchRole } = useAuth();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  const handleSwitchRole = async (role: string) => {
    setSwitching(true);
    try {
      await switchRole(role);
      switch (role) {
        case 'customer': router.replace('/home'); break;
        case 'merchant': router.replace('/merchant-dashboard'); break;
        case 'admin': router.replace('/admin-dashboard'); break;
        default: router.replace('/agent-dashboard'); break;
      }
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSwitching(false); }
  };

  const handleSettlement = async () => {
    try {
      const stats = await api.getDashboardStats();
      await api.requestSettlement(stats.total_earnings || 0);
      Alert.alert('Success', 'Settlement request submitted!');
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll}>
        <Text style={s.title}>Profile</Text>
        <View style={s.card}>
          <View style={s.avatar}><Ionicons name="bicycle" size={28} color={Colors.roles.agent} /></View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={s.name}>{user?.name}</Text>
            <Text style={s.email}>{user?.email}</Text>
            <Text style={s.detail}>License: {user?.license_no || 'N/A'}</Text>
            <Text style={s.detail}>Vehicle: {user?.vehicle_no || 'N/A'}</Text>
          </View>
        </View>
        {user && user.roles.length > 1 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Switch Role</Text>
            {switching && <ActivityIndicator color={Colors.roles.agent} />}
            <View style={s.roleGrid}>
              {user.roles.filter(r => r !== user.active_role).map(role => (
                <TouchableOpacity key={role} testID={`switch-${role}`} style={s.roleBtn} onPress={() => handleSwitchRole(role)}>
                  <Ionicons name={role === 'customer' ? 'person' : role === 'merchant' ? 'storefront' : 'shield'} size={18} color={Colors.roles[role as keyof typeof Colors.roles] || '#666'} />
                  <Text style={s.roleBtnText}>{role.charAt(0).toUpperCase() + role.slice(1)} Mode</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        <TouchableOpacity testID="request-settlement-btn" style={s.settlementBtn} onPress={handleSettlement}>
          <Ionicons name="wallet" size={20} color="#000" />
          <Text style={s.settlementText}>Request Settlement</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="logout-btn" style={s.logoutBtn} onPress={() => Alert.alert('Logout', 'Sure?', [{ text: 'Cancel' }, { text: 'Logout', onPress: logout }])}>
          <Ionicons name="log-out-outline" size={22} color={Colors.light.error} />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark.background },
  scroll: { paddingHorizontal: Spacing.xl },
  title: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.dark.textPrimary, marginTop: Spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.dark.surface, padding: 20, borderRadius: Radius.lg, marginTop: Spacing.xl, borderWidth: 1, borderColor: Colors.dark.border },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.dark.background, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.roles.agent },
  name: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.dark.textPrimary },
  email: { fontSize: FontSizes.sm, color: Colors.dark.textSecondary, marginTop: 2 },
  detail: { fontSize: FontSizes.xs, color: Colors.dark.textSecondary, marginTop: 2 },
  section: { marginTop: Spacing.xxl },
  sectionTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.dark.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  roleGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  roleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.dark.border, backgroundColor: Colors.dark.surface },
  roleBtnText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.dark.textPrimary },
  settlementBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.roles.agent, paddingVertical: 16, borderRadius: Radius.full, marginTop: Spacing.xxl },
  settlementText: { color: '#000', fontSize: FontSizes.base, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, marginTop: 16 },
  logoutText: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.light.error },
});

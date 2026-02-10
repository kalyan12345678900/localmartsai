import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function AdminProfile() {
  const { user, logout, switchRole } = useAuth();
  const router = useRouter();
  const handleSwitchRole = async (role: string) => {
    try {
      await switchRole(role);
      switch (role) {
        case 'customer': router.replace('/(customer)/home'); break;
        case 'merchant': router.replace('/merchant'); break;
        case 'agent': router.replace('/agent'); break;
        default: router.replace('/admin'); break;
      }
    } catch (e: any) { Alert.alert('Error', e.message); }
  };
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll}>
        <Text style={s.title}>Profile</Text>
        <View style={s.card}>
          <View style={s.avatar}><Ionicons name="shield" size={28} color={Colors.roles.admin} /></View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={s.name}>{user?.name}</Text>
            <Text style={s.email}>{user?.email}</Text>
            <View style={[s.badge, { backgroundColor: Colors.roles.admin }]}><Text style={s.badgeText}>ADMIN</Text></View>
          </View>
        </View>
        {user && user.roles.length > 1 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Switch Role</Text>
            <View style={s.roleGrid}>
              {user.roles.filter(r => r !== user.active_role).map(role => (
                <TouchableOpacity key={role} testID={`switch-${role}`} style={s.roleBtn} onPress={() => handleSwitchRole(role)}>
                  <Text style={s.roleBtnText}>{role.charAt(0).toUpperCase() + role.slice(1)} Mode</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        <TouchableOpacity testID="logout-btn" style={s.logoutBtn} onPress={() => Alert.alert('Logout', 'Sure?', [{ text: 'Cancel' }, { text: 'Logout', onPress: logout }])}>
          <Ionicons name="log-out-outline" size={22} color={Colors.light.error} />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { paddingHorizontal: Spacing.xl },
  title: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary, marginTop: Spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: Radius.lg, marginTop: Spacing.xl, ...Shadows.sm },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.light.background, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.roles.admin },
  name: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.light.textPrimary },
  email: { fontSize: FontSizes.sm, color: Colors.light.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start', marginTop: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFF', letterSpacing: 1 },
  section: { marginTop: Spacing.xxl },
  sectionTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.light.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  roleGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  roleBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.light.border, backgroundColor: '#FFF' },
  roleBtnText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.light.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, marginTop: Spacing.xxl },
  logoutText: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.light.error },
});

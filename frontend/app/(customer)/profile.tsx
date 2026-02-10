import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function ProfileScreen() {
  const { user, logout, switchRole } = useAuth();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  const handleSwitchRole = async (role: string) => {
    setSwitching(true);
    try {
      await switchRole(role);
      switch (role) {
        case 'merchant': router.replace('/merchant'); break;
        case 'agent': router.replace('/agent'); break;
        case 'admin': router.replace('/admin'); break;
        default: router.replace('/(customer)/home'); break;
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={Colors.light.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.active_role?.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Role Switching */}
        {user && user.roles.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Switch Role</Text>
            {switching && <ActivityIndicator color={Colors.light.primary} style={{ marginBottom: 8 }} />}
            <View style={styles.roleGrid}>
              {user.roles.filter(r => r !== user.active_role).map((role) => (
                <TouchableOpacity
                  key={role}
                  testID={`switch-role-${role}-btn`}
                  style={[styles.roleBtn, { borderColor: Colors.roles[role as keyof typeof Colors.roles] || Colors.light.primary }]}
                  onPress={() => handleSwitchRole(role)}
                >
                  <Ionicons
                    name={role === 'merchant' ? 'storefront' : role === 'agent' ? 'bicycle' : role === 'admin' ? 'shield' : 'person'}
                    size={20}
                    color={Colors.roles[role as keyof typeof Colors.roles] || Colors.light.primary}
                  />
                  <Text style={[styles.roleBtnText, { color: Colors.roles[role as keyof typeof Colors.roles] || Colors.light.primary }]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)} Mode
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.section}>
          {[
            { icon: 'receipt-outline' as const, label: 'Order History', onPress: () => router.push('/(customer)/orders') },
            { icon: 'card-outline' as const, label: 'Payment Methods', onPress: () => {} },
            { icon: 'location-outline' as const, label: 'Saved Addresses', onPress: () => {} },
            { icon: 'notifications-outline' as const, label: 'Notifications', onPress: () => {} },
            { icon: 'help-circle-outline' as const, label: 'Help & Support', onPress: () => {} },
          ].map((item, idx) => (
            <TouchableOpacity key={idx} testID={`menu-${item.label.toLowerCase().replace(/\s/g, '-')}`} style={styles.menuItem} onPress={item.onPress}>
              <Ionicons name={item.icon} size={22} color={Colors.light.textPrimary} />
              <Text style={styles.menuText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.light.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flex: 1, paddingHorizontal: Spacing.xl },
  title: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary, marginTop: Spacing.lg },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: Radius.lg, marginTop: Spacing.xl, ...Shadows.sm },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.light.background, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.light.primary },
  profileInfo: { marginLeft: 16, flex: 1 },
  name: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.light.textPrimary },
  email: { fontSize: FontSizes.sm, color: Colors.light.textSecondary, marginTop: 2 },
  roleBadge: { backgroundColor: Colors.light.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start', marginTop: 6 },
  roleText: { fontSize: 10, fontWeight: '700', color: '#FFF', letterSpacing: 1 },
  section: { marginTop: Spacing.xxl },
  sectionTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.light.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  roleGrid: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  roleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: Radius.md, borderWidth: 2, backgroundColor: '#FFF' },
  roleBtnText: { fontSize: FontSizes.sm, fontWeight: '600' },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: Radius.md, marginBottom: 8, gap: 12, ...Shadows.sm },
  menuText: { flex: 1, fontSize: FontSizes.base, color: Colors.light.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, marginTop: 16 },
  logoutText: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.light.error },
});

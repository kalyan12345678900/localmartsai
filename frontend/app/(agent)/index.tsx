import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function AgentDashboard() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try { const data = await api.getDashboardStats(); setStats(data); }
    catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const toggleOnline = async () => {
    try { await api.toggleOnline(); await refreshUser(); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.roles.agent} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />}>
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Hey, {user?.name?.split(' ')[0]}</Text>
            <Text style={s.role}>Delivery Agent</Text>
          </View>
          <TouchableOpacity testID="toggle-online-btn" style={[s.onlineBtn, user?.is_online ? s.onlineActive : s.onlineInactive]} onPress={toggleOnline}>
            <View style={[s.onlineDot, { backgroundColor: user?.is_online ? Colors.light.success : Colors.light.error }]} />
            <Text style={[s.onlineText, { color: user?.is_online ? Colors.light.success : Colors.light.error }]}>
              {user?.is_online ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.earningsCard}>
          <Text style={s.earningsLabel}>Total Earnings</Text>
          <Text style={s.earningsValue}>₹{(stats?.total_earnings || 0).toLocaleString()}</Text>
          <Text style={s.earningsLabel}>{stats?.total_deliveries || 0} deliveries completed</Text>
        </View>

        <View style={s.grid}>
          {[
            { icon: 'flash', label: 'Active', value: stats?.active_orders || 0, color: Colors.roles.agent },
            { icon: 'checkmark-done', label: 'Delivered', value: stats?.total_deliveries || 0, color: Colors.light.success },
          ].map((c, i) => (
            <View key={i} style={s.statCard}>
              <Ionicons name={c.icon as any} size={24} color={c.color} />
              <Text style={s.statValue}>{c.value}</Text>
              <Text style={s.statLabel}>{c.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  greeting: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.dark.textPrimary },
  role: { fontSize: FontSizes.sm, color: Colors.roles.agent, fontWeight: '600', marginTop: 4 },
  onlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 2 },
  onlineActive: { borderColor: Colors.light.success, backgroundColor: 'rgba(16,185,129,0.1)' },
  onlineInactive: { borderColor: Colors.light.error, backgroundColor: 'rgba(239,68,68,0.1)' },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: { fontSize: FontSizes.sm, fontWeight: '700' },
  earningsCard: { margin: Spacing.xl, backgroundColor: Colors.dark.surface, padding: 24, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.roles.agent },
  earningsLabel: { fontSize: FontSizes.sm, color: Colors.dark.textSecondary },
  earningsValue: { fontSize: 36, fontWeight: '800', color: Colors.roles.agent, marginTop: 4, marginBottom: 4 },
  grid: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: 12 },
  statCard: { flex: 1, backgroundColor: Colors.dark.surface, padding: 20, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.dark.border },
  statValue: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.dark.textPrimary, marginTop: 8 },
  statLabel: { fontSize: FontSizes.sm, color: Colors.dark.textSecondary, marginTop: 2 },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadStats = useCallback(async () => {
    try { setStats(await api.getDashboardStats()); } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { loadStats(); }, [loadStats]);
  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.roles.admin} /></View></SafeAreaView>;
  const cards = [
    { icon: 'cart', label: 'Total Orders', value: stats?.total_orders || 0, color: Colors.roles.admin },
    { icon: 'checkmark-circle', label: 'Delivered', value: stats?.delivered || 0, color: Colors.light.success },
    { icon: 'close-circle', label: 'Cancelled', value: stats?.cancelled || 0, color: Colors.light.error },
    { icon: 'people', label: 'Merchants', value: stats?.total_merchants || 0, color: Colors.roles.merchant },
    { icon: 'bicycle', label: 'Agents', value: stats?.total_agents || 0, color: '#CCFF00' },
    { icon: 'person', label: 'Customers', value: stats?.total_customers || 0, color: Colors.light.primary },
  ];
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />}>
        <View style={s.header}>
          <Text style={s.title}>Admin Dashboard</Text>
          <Text style={s.subtitle}>Platform Overview</Text>
        </View>
        <View style={s.earningsCard}>
          <Text style={s.earningsLabel}>Total Platform Earnings</Text>
          <Text style={s.earningsValue}>₹{(stats?.total_earnings || 0).toLocaleString()}</Text>
          <Text style={s.earningsLabel}>Platform Fees: ₹{(stats?.platform_fees || 0).toLocaleString()}</Text>
        </View>
        <View style={s.grid}>
          {cards.map((c, i) => (
            <View key={i} style={s.statCard}>
              <Ionicons name={c.icon as any} size={22} color={c.color} />
              <Text style={s.statValue}>{c.value}</Text>
              <Text style={s.statLabel}>{c.label}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  title: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary },
  subtitle: { fontSize: FontSizes.sm, color: Colors.roles.admin, fontWeight: '600', marginTop: 4 },
  earningsCard: { margin: Spacing.xl, backgroundColor: Colors.roles.admin, padding: 24, borderRadius: Radius.lg, ...Shadows.md },
  earningsLabel: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)' },
  earningsValue: { fontSize: 36, fontWeight: '800', color: '#FFF', marginVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, gap: 12 },
  statCard: { width: '47%', backgroundColor: '#FFF', padding: 16, borderRadius: Radius.lg, ...Shadows.sm },
  statValue: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary, marginTop: 6 },
  statLabel: { fontSize: FontSizes.xs, color: Colors.light.textSecondary, marginTop: 2 },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function MerchantDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try { const data = await api.getDashboardStats(); setStats(data); }
    catch (e) { console.log('Stats error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.roles.merchant} /></View></SafeAreaView>;

  const cards = [
    { icon: 'checkmark-circle', label: 'Delivered', value: stats?.delivered || 0, color: Colors.light.success },
    { icon: 'close-circle', label: 'Cancelled', value: stats?.cancelled || 0, color: Colors.light.error },
    { icon: 'cart', label: 'Total Orders', value: stats?.total_orders || 0, color: Colors.roles.merchant },
    { icon: 'time', label: 'Pending', value: stats?.pending_orders || 0, color: Colors.light.warning },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />}>
        <View style={s.header}>
          <Text style={s.greeting}>Welcome, {user?.shop_name || user?.name}</Text>
          <Text style={s.role}>Merchant Dashboard</Text>
        </View>
        <View style={s.revenueCard}>
          <Text style={s.revenueLabel}>Total Revenue</Text>
          <Text style={s.revenueValue}>₹{(stats?.total_revenue || 0).toLocaleString()}</Text>
        </View>
        <View style={s.grid}>
          {cards.map((c, i) => (
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
  safe: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  greeting: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary },
  role: { fontSize: FontSizes.sm, color: Colors.roles.merchant, fontWeight: '600', marginTop: 4 },
  revenueCard: { margin: Spacing.xl, backgroundColor: Colors.roles.merchant, padding: 24, borderRadius: Radius.lg, ...Shadows.md },
  revenueLabel: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)' },
  revenueValue: { fontSize: 36, fontWeight: '800', color: '#FFF', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, gap: 12 },
  statCard: { width: '47%', backgroundColor: '#FFF', padding: 20, borderRadius: Radius.lg, ...Shadows.sm },
  statValue: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.light.textPrimary, marginTop: 8 },
  statLabel: { fontSize: FontSizes.sm, color: Colors.light.textSecondary, marginTop: 2 },
});

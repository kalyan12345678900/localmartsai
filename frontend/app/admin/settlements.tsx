import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function AdminSettlements() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { load(); }, []);
  const load = async () => { try { setSettlements(await api.getSettlements()); } catch (e) { console.log(e); } finally { setLoading(false); } };
  const settle = async (id: string) => {
    try { await api.settlePayment(id); load(); Alert.alert('Settled!'); } catch (e: any) { Alert.alert('Error', e.message); }
  };
  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.roles.admin} /></View></SafeAreaView>;
  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.title}>Settlements</Text>
      <FlatList data={settlements} keyExtractor={i => i.id} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
        ListEmptyComponent={<View style={s.center}><Ionicons name="wallet-outline" size={48} color={Colors.light.border} /><Text style={s.emptyText}>No settlements</Text></View>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <View>
                <Text style={s.name}>{item.user_name}</Text>
                <Text style={s.role}>{item.role?.toUpperCase()}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: item.status === 'settled' ? Colors.light.success : Colors.light.warning }]}>
                <Text style={s.badgeText}>{item.status?.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={s.amount}>₹{item.amount?.toLocaleString()}</Text>
            <Text style={s.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            {item.status === 'pending' && (
              <TouchableOpacity testID={`settle-${item.id}`} style={s.settleBtn} onPress={() => settle(item.id)}>
                <Text style={s.settleBtnText}>Settle / Pay</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  title: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 32 },
  emptyText: { fontSize: FontSizes.base, color: Colors.light.textSecondary, marginTop: 12 },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: Radius.lg, marginBottom: 12, ...Shadows.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.light.textPrimary },
  role: { fontSize: FontSizes.xs, color: Colors.light.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  amount: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.roles.admin, marginTop: 8 },
  date: { fontSize: FontSizes.xs, color: Colors.light.textSecondary, marginTop: 4 },
  settleBtn: { backgroundColor: Colors.light.success, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center', marginTop: 12 },
  settleBtnText: { color: '#FFF', fontSize: FontSizes.sm, fontWeight: '700' },
});

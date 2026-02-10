import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function AgentDeliveries() {
  const [orders, setOrders] = useState<any[]>([]);
  const [available, setAvailable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'available' | 'my'>('available');
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const [avail, my] = await Promise.all([api.getAvailableOrders(), api.getOrders()]);
      setAvailable(avail);
      setOrders(my);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async (orderId: string) => {
    try { await api.assignOrder(orderId); load(); Alert.alert('Assigned!', 'Order assigned to you'); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handlePickup = async (orderId: string) => {
    try { await api.updateOrderStatus(orderId, 'picked_up'); load(); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleVerifyOTP = async (orderId: string) => {
    const otp = otpInputs[orderId];
    if (!otp) { Alert.alert('Enter OTP'); return; }
    try { await api.verifyOTP(orderId, otp); load(); Alert.alert('Delivered!', 'Delivery confirmed'); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.roles.agent} /></View></SafeAreaView>;

  const data = tab === 'available' ? available : orders;

  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.title}>Deliveries</Text>
      <View style={s.tabs}>
        {(['available', 'my'] as const).map(t => (
          <TouchableOpacity key={t} testID={`tab-${t}`} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t === 'available' ? 'Available' : 'My Orders'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={data} keyExtractor={i => i.id} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
        ListEmptyComponent={<View style={s.center}><Ionicons name="bicycle-outline" size={48} color={Colors.dark.border} /><Text style={s.emptyText}>No orders</Text></View>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.orderNum}>{item.order_number}</Text>
              <Text style={s.statusText}>{item.status?.replace(/_/g, ' ').toUpperCase()}</Text>
            </View>
            <Text style={s.store}>{item.store_name}</Text>
            <Text style={s.address}>{item.delivery_address}</Text>
            <Text style={s.total}>₹{item.total?.toFixed(2)} · {item.distance_km}km</Text>
            {tab === 'available' && item.status === 'accepted' && (
              <TouchableOpacity testID={`assign-${item.id}`} style={s.actionBtn} onPress={() => handleAssign(item.id)}>
                <Text style={s.actionText}>Accept Delivery</Text>
              </TouchableOpacity>
            )}
            {tab === 'my' && item.status === 'ready_for_pickup' && (
              <TouchableOpacity testID={`pickup-${item.id}`} style={s.actionBtn} onPress={() => handlePickup(item.id)}>
                <Text style={s.actionText}>Mark Picked Up</Text>
              </TouchableOpacity>
            )}
            {tab === 'my' && item.status === 'picked_up' && (
              <View style={s.otpRow}>
                <TextInput testID={`otp-input-${item.id}`} style={s.otpInput} placeholder="Enter OTP" placeholderTextColor={Colors.dark.textSecondary} keyboardType="number-pad" maxLength={4} value={otpInputs[item.id] || ''} onChangeText={t => setOtpInputs(p => ({ ...p, [item.id]: t }))} />
                <TouchableOpacity testID={`verify-otp-${item.id}`} style={s.verifyBtn} onPress={() => handleVerifyOTP(item.id)}>
                  <Text style={s.verifyText}>Verify</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  title: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.dark.textPrimary, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.xl, marginTop: Spacing.lg, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.dark.surface, alignItems: 'center', borderWidth: 1, borderColor: Colors.dark.border },
  tabActive: { backgroundColor: Colors.roles.agent, borderColor: Colors.roles.agent },
  tabText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.dark.textSecondary },
  tabTextActive: { color: '#000' },
  list: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: 32 },
  emptyText: { fontSize: FontSizes.base, color: Colors.dark.textSecondary, marginTop: 12 },
  card: { backgroundColor: Colors.dark.surface, padding: 16, borderRadius: Radius.lg, marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderNum: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.dark.textPrimary },
  statusText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.roles.agent },
  store: { fontSize: FontSizes.sm, color: Colors.dark.textSecondary, marginTop: 6 },
  address: { fontSize: FontSizes.xs, color: Colors.dark.textSecondary, marginTop: 2 },
  total: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.roles.agent, marginTop: 8 },
  actionBtn: { backgroundColor: Colors.roles.agent, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', marginTop: 12 },
  actionText: { fontSize: FontSizes.sm, fontWeight: '700', color: '#000' },
  otpRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  otpInput: { flex: 1, backgroundColor: Colors.dark.background, borderRadius: Radius.md, padding: 12, color: Colors.dark.textPrimary, fontSize: FontSizes.lg, textAlign: 'center', letterSpacing: 4, borderWidth: 1, borderColor: Colors.dark.border },
  verifyBtn: { backgroundColor: Colors.light.success, paddingHorizontal: 24, borderRadius: Radius.md, justifyContent: 'center' },
  verifyText: { fontSize: FontSizes.sm, fontWeight: '700', color: '#FFF' },
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

const statusColors: Record<string, string> = { placed: '#3B82F6', accepted: '#8B5CF6', preparing: '#F59E0B', ready_for_pickup: '#06B6D4', assigned: '#6366F1', picked_up: '#F97316', delivered: '#10B981', cancelled: '#EF4444' };

export default function MerchantOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadOrders = useCallback(async () => {
    try { const data = await api.getOrders(); setOrders(data); }
    catch (e) { console.log('Orders error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleAccept = async (orderId: string) => {
    try { await api.acceptOrder(orderId); loadOrders(); Alert.alert('Success', 'Order accepted!'); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try { await api.updateOrderStatus(orderId, status); loadOrders(); }
    catch (e: any) { Alert.alert('Error', e.message); }
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.roles.merchant} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.title}>Orders</Text>
      <FlatList data={orders} keyExtractor={i => i.id} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />}
        ListEmptyComponent={<View style={s.center}><Ionicons name="receipt-outline" size={48} color={Colors.light.border} /><Text style={s.emptyText}>No orders yet</Text></View>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.orderNum}>{item.order_number}</Text>
              <View style={[s.badge, { backgroundColor: statusColors[item.status] || '#666' }]}><Text style={s.badgeText}>{item.status?.replace(/_/g, ' ').toUpperCase()}</Text></View>
            </View>
            <Text style={s.customer}>Customer: {item.user_name}</Text>
            <Text style={s.items}>{item.items?.map((i: any) => `${i.product_name} x${i.quantity}`).join(', ')}</Text>
            <Text style={s.total}>₹{item.total?.toFixed(2)}</Text>
            <View style={s.actions}>
              {item.status === 'placed' && (
                <>
                  <TouchableOpacity testID={`accept-order-${item.id}`} style={[s.actionBtn, { backgroundColor: Colors.light.success }]} onPress={() => handleAccept(item.id)}>
                    <Text style={s.actionText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity testID={`cancel-order-${item.id}`} style={[s.actionBtn, { backgroundColor: Colors.light.error }]} onPress={() => handleStatusUpdate(item.id, 'cancelled')}>
                    <Text style={s.actionText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
              {item.status === 'accepted' && (
                <TouchableOpacity testID={`preparing-order-${item.id}`} style={[s.actionBtn, { backgroundColor: Colors.light.warning }]} onPress={() => handleStatusUpdate(item.id, 'preparing')}>
                  <Text style={s.actionText}>Start Preparing</Text>
                </TouchableOpacity>
              )}
              {item.status === 'preparing' && (
                <TouchableOpacity testID={`ready-order-${item.id}`} style={[s.actionBtn, { backgroundColor: '#06B6D4' }]} onPress={() => handleStatusUpdate(item.id, 'ready_for_pickup')}>
                  <Text style={s.actionText}>Ready for Pickup</Text>
                </TouchableOpacity>
              )}
            </View>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNum: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.light.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  customer: { fontSize: FontSizes.sm, color: Colors.light.textSecondary, marginTop: 6 },
  items: { fontSize: FontSizes.xs, color: Colors.light.textSecondary, marginTop: 4 },
  total: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.roles.merchant, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center' },
  actionText: { color: '#FFF', fontSize: FontSizes.sm, fontWeight: '700' },
});

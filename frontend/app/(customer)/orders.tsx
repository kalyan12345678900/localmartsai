import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

const statusColors: Record<string, string> = {
  placed: '#3B82F6', accepted: '#8B5CF6', preparing: '#F59E0B',
  ready_for_pickup: '#06B6D4', assigned: '#6366F1', picked_up: '#F97316',
  delivered: '#10B981', cancelled: '#EF4444',
};

const statusLabels: Record<string, string> = {
  placed: 'Placed', accepted: 'Accepted', preparing: 'Preparing',
  ready_for_pickup: 'Ready', assigned: 'Assigned', picked_up: 'Picked Up',
  delivered: 'Delivered', cancelled: 'Cancelled',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (e) {
      console.log('Orders error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  if (loading) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color={Colors.light.primary} /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.title}>My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <Ionicons name="receipt-outline" size={48} color={Colors.light.border} />
            <Text style={styles.emptyText}>No orders yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity testID={`order-item-${item.id}`} style={styles.orderCard} onPress={() => router.push(`/order/${item.id}`)}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>{item.order_number}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] || '#666' }]}>
                <Text style={styles.statusText}>{statusLabels[item.status] || item.status}</Text>
              </View>
            </View>
            <Text style={styles.storeName}>{item.store_name}</Text>
            <Text style={styles.itemCount}>{item.items?.length || 0} item{(item.items?.length || 0) > 1 ? 's' : ''}</Text>
            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>₹{item.total?.toFixed(2)}</Text>
              <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  title: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 32 },
  emptyText: { fontSize: FontSizes.base, color: Colors.light.textSecondary, marginTop: 12 },
  orderCard: { backgroundColor: '#FFF', padding: 16, borderRadius: Radius.lg, marginBottom: 12, ...Shadows.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.light.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: FontSizes.xs, fontWeight: '700', color: '#FFF' },
  storeName: { fontSize: FontSizes.sm, color: Colors.light.textSecondary, marginTop: 6 },
  itemCount: { fontSize: FontSizes.xs, color: Colors.light.textSecondary, marginTop: 2 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.light.border },
  orderTotal: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.light.primary },
  orderDate: { fontSize: FontSizes.xs, color: Colors.light.textSecondary },
});

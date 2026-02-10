import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

const statusSteps = ['placed', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up', 'delivered'];
const statusLabels: Record<string, string> = { placed: 'Order Placed', accepted: 'Accepted', preparing: 'Preparing', ready_for_pickup: 'Ready for Pickup', picked_up: 'Picked Up', delivered: 'Delivered', cancelled: 'Cancelled' };

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  const loadOrder = () => {
    api.getOrder(id!).then(setOrder).catch(console.log).finally(() => setLoading(false));
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.light.primary} /></View></SafeAreaView>;
  if (!order) return <SafeAreaView style={s.safe}><View style={s.center}><Text>Order not found</Text></View></SafeAreaView>;

  const currentStep = statusSteps.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Order Details</Text>
        <TouchableOpacity testID="refresh-btn" onPress={loadOrder}>
          <Ionicons name="refresh" size={22} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView style={s.scroll}>
        <View style={s.orderHeader}>
          <Text style={s.orderNum}>{order.order_number}</Text>
          <Text style={s.storeName}>{order.store_name}</Text>
          <Text style={s.date}>{new Date(order.created_at).toLocaleString()}</Text>
        </View>

        {/* OTP Box */}
        {!isCancelled && order.status !== 'delivered' && (
          <View style={s.otpBox}>
            <Text style={s.otpLabel}>Delivery OTP</Text>
            <Text style={s.otpValue}>{order.otp}</Text>
            <Text style={s.otpHint}>Share this with your delivery agent</Text>
          </View>
        )}

        {/* Status Tracker */}
        <View style={s.tracker}>
          <Text style={s.sectionTitle}>Order Status</Text>
          {isCancelled ? (
            <View style={s.cancelledBox}>
              <Ionicons name="close-circle" size={24} color={Colors.light.error} />
              <Text style={s.cancelledText}>Order Cancelled</Text>
            </View>
          ) : (
            statusSteps.map((step, idx) => (
              <View key={step} style={s.stepRow}>
                <View style={[s.stepDot, idx <= currentStep && s.stepDotActive]} />
                {idx < statusSteps.length - 1 && <View style={[s.stepLine, idx < currentStep && s.stepLineActive]} />}
                <Text style={[s.stepLabel, idx <= currentStep && s.stepLabelActive]}>{statusLabels[step]}</Text>
              </View>
            ))
          )}
        </View>

        {/* Items */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Items</Text>
          {order.items?.map((item: any, idx: number) => (
            <View key={idx} style={s.itemRow}>
              <Text style={s.itemQty}>{item.quantity}x</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.product_name}</Text>
                <Text style={s.itemVariant}>{item.variant_name}{item.size_name ? ` · ${item.size_name}` : ''}</Text>
              </View>
              <Text style={s.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Bill */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Bill Details</Text>
          <View style={s.billRow}><Text style={s.billLabel}>Subtotal</Text><Text style={s.billValue}>₹{order.subtotal?.toFixed(2)}</Text></View>
          <View style={s.billRow}><Text style={s.billLabel}>Delivery Fee</Text><Text style={s.billValue}>{order.delivery_fee === 0 ? 'FREE' : `₹${order.delivery_fee?.toFixed(2)}`}</Text></View>
          <View style={[s.billRow, s.billTotal]}><Text style={s.totalLabel}>Total</Text><Text style={s.totalValue}>₹{order.total?.toFixed(2)}</Text></View>
        </View>

        {/* Delivery Address */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Delivery Address</Text>
          <Text style={s.address}>{order.delivery_address}</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.light.textPrimary },
  scroll: { flex: 1, paddingHorizontal: Spacing.xl },
  orderHeader: { marginBottom: Spacing.lg },
  orderNum: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary },
  storeName: { fontSize: FontSizes.base, color: Colors.light.textSecondary, marginTop: 4 },
  date: { fontSize: FontSizes.xs, color: Colors.light.textSecondary, marginTop: 2 },
  otpBox: { backgroundColor: Colors.light.primary, padding: 20, borderRadius: Radius.lg, alignItems: 'center', marginBottom: Spacing.xl },
  otpLabel: { fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)' },
  otpValue: { fontSize: 40, fontWeight: '800', color: '#FFF', letterSpacing: 8, marginVertical: 8 },
  otpHint: { fontSize: FontSizes.xs, color: 'rgba(255,255,255,0.7)' },
  tracker: { backgroundColor: '#FFF', padding: 20, borderRadius: Radius.lg, marginBottom: Spacing.lg, ...Shadows.sm },
  sectionTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.light.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.light.border, marginRight: 12 },
  stepDotActive: { backgroundColor: Colors.light.success },
  stepLine: { position: 'absolute', left: 5, top: 12, width: 2, height: 24, backgroundColor: Colors.light.border },
  stepLineActive: { backgroundColor: Colors.light.success },
  stepLabel: { fontSize: FontSizes.sm, color: Colors.light.textSecondary, paddingVertical: 8 },
  stepLabelActive: { color: Colors.light.textPrimary, fontWeight: '600' },
  cancelledBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelledText: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.light.error },
  section: { backgroundColor: '#FFF', padding: 16, borderRadius: Radius.lg, marginBottom: Spacing.lg, ...Shadows.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  itemQty: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.light.primary, width: 30 },
  itemName: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.light.textPrimary },
  itemVariant: { fontSize: FontSizes.xs, color: Colors.light.textSecondary },
  itemPrice: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.light.textPrimary },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  billLabel: { fontSize: FontSizes.sm, color: Colors.light.textSecondary },
  billValue: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.light.textPrimary },
  billTotal: { borderTopWidth: 1, borderTopColor: Colors.light.border, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.light.textPrimary },
  totalValue: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.light.primary },
  address: { fontSize: FontSizes.sm, color: Colors.light.textPrimary },
});

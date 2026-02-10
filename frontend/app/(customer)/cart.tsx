import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator,
  Alert, TextInput, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function CartScreen() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [address, setAddress] = useState('123 Main St, Downtown');
  const router = useRouter();

  const loadCart = useCallback(async () => {
    try {
      const data = await api.getCart();
      setCart(data);
    } catch (e) {
      console.log('Cart error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCart(); }, [loadCart]);

  const updateQty = async (itemId: string, qty: number) => {
    try {
      await api.updateCartItem({ item_id: itemId, quantity: qty });
      loadCart();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCheckout = async () => {
    if (!cart?.items?.length) return;
    setCheckoutLoading(true);
    try {
      const order = await api.checkout({
        delivery_address: address,
        lat: 12.9716,
        lng: 77.5946,
        distance_km: cart.distance_km || 2.0,
      });
      Alert.alert('Order Placed!', `Order #${order.order_number}\nOTP: ${order.otp}`, [
        { text: 'View Order', onPress: () => router.push(`/order/${order.id}`) },
      ]);
      loadCart();
    } catch (e: any) {
      Alert.alert('Checkout Failed', e.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color={Colors.light.primary} /></View>
      </SafeAreaView>
    );
  }

  const items = cart?.items || [];
  const promotions = cart?.promotions || {};

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        {items.length > 0 && (
          <TouchableOpacity testID="clear-cart-btn" onPress={async () => { await api.clearCart(); loadCart(); }}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cart-outline" size={64} color={Colors.light.border} />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity testID="browse-btn" style={styles.browseBtn} onPress={() => router.push('/(customer)/home')}>
            <Text style={styles.browseBtnText}>Browse Stores</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={false} onRefresh={loadCart} />}>
          {items.map((item: any) => (
            <View key={item.item_id} style={styles.cartItem}>
              {item.product_image ? (
                <Image source={{ uri: item.product_image }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, { backgroundColor: Colors.light.border }]} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                <Text style={styles.itemVariant}>{item.variant_name}{item.size_name ? ` · ${item.size_name}` : ''}</Text>
                <Text style={styles.itemPrice}>₹{item.item_total}</Text>
              </View>
              <View style={styles.qtyControls}>
                <TouchableOpacity testID={`qty-minus-${item.item_id}`} style={styles.qtyBtn} onPress={() => updateQty(item.item_id, item.quantity - 1)}>
                  <Ionicons name="remove" size={18} color={Colors.light.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity testID={`qty-plus-${item.item_id}`} style={styles.qtyBtn} onPress={() => updateQty(item.item_id, item.quantity + 1)}>
                  <Ionicons name="add" size={18} color={Colors.light.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Promotion Messages */}
          {promotions.upsell_message ? (
            <View style={styles.promoBox}>
              <Ionicons name="gift" size={18} color={Colors.light.warning} />
              <Text style={styles.promoText}>{promotions.upsell_message}</Text>
            </View>
          ) : null}
          {promotions.gift_eligible && (
            <View style={[styles.promoBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="gift" size={18} color={Colors.light.success} />
              <Text style={[styles.promoText, { color: Colors.light.success }]}>{promotions.gift_message}</Text>
            </View>
          )}
          {promotions.free_delivery_message ? (
            <View style={[styles.promoBox, promotions.free_delivery_applied && { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="bicycle" size={18} color={promotions.free_delivery_applied ? Colors.light.success : Colors.light.warning} />
              <Text style={[styles.promoText, promotions.free_delivery_applied && { color: Colors.light.success }]}>
                {promotions.free_delivery_message}
              </Text>
            </View>
          ) : null}

          {/* Delivery Address */}
          <View style={styles.addressBox}>
            <Text style={styles.addressLabel}>Delivery Address</Text>
            <TextInput
              testID="delivery-address-input"
              style={styles.addressInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your address"
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          {/* Bill Summary */}
          <View style={styles.billBox}>
            <Text style={styles.billTitle}>Bill Details</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal</Text>
              <Text style={styles.billValue}>₹{cart.subtotal?.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={[styles.billValue, promotions.free_delivery_applied && { color: Colors.light.success }]}>
                {promotions.free_delivery_applied ? 'FREE' : `₹${cart.delivery_fee?.toFixed(2)}`}
              </Text>
            </View>
            <View style={[styles.billRow, styles.billTotal]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{cart.total?.toFixed(2)}</Text>
            </View>
          </View>
          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {items.length > 0 && (
        <View style={styles.checkoutBar}>
          <View>
            <Text style={styles.checkoutTotal}>₹{cart?.total?.toFixed(2)}</Text>
            <Text style={styles.checkoutItems}>{items.length} item{items.length > 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity testID="checkout-btn" style={styles.checkoutBtn} onPress={handleCheckout} disabled={checkoutLoading}>
            {checkoutLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.checkoutBtnText}>Place Order</Text>}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  headerTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary },
  clearText: { fontSize: FontSizes.sm, color: Colors.light.error, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: FontSizes.lg, color: Colors.light.textSecondary, marginTop: 16 },
  browseBtn: { marginTop: 16, backgroundColor: Colors.light.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full },
  browseBtnText: { color: '#FFF', fontWeight: '700', fontSize: FontSizes.sm },
  scroll: { flex: 1, paddingHorizontal: Spacing.xl },
  cartItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: Radius.md, marginBottom: 10, ...Shadows.sm },
  itemImage: { width: 60, height: 60, borderRadius: Radius.sm },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.light.textPrimary },
  itemVariant: { fontSize: FontSizes.xs, color: Colors.light.textSecondary, marginTop: 2 },
  itemPrice: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.light.primary, marginTop: 4 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.light.primary, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.light.textPrimary, minWidth: 20, textAlign: 'center' },
  promoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E6', padding: 12, borderRadius: Radius.md, marginTop: 8, gap: 8 },
  promoText: { fontSize: FontSizes.sm, color: Colors.light.warning, fontWeight: '600', flex: 1 },
  addressBox: { marginTop: 16 },
  addressLabel: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.light.textPrimary, marginBottom: 8 },
  addressInput: { backgroundColor: '#FFF', padding: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.light.border, fontSize: FontSizes.sm, color: Colors.light.textPrimary },
  billBox: { marginTop: 16, backgroundColor: '#FFF', padding: 16, borderRadius: Radius.lg, ...Shadows.sm },
  billTitle: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.light.textPrimary, marginBottom: 12 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { fontSize: FontSizes.sm, color: Colors.light.textSecondary },
  billValue: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.light.textPrimary },
  billTotal: { borderTopWidth: 1, borderTopColor: Colors.light.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.light.textPrimary },
  totalValue: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.light.primary },
  checkoutBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: Spacing.xl, paddingTop: 16, paddingBottom: 34, borderTopWidth: 1, borderTopColor: Colors.light.border, ...Shadows.md },
  checkoutTotal: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.light.textPrimary },
  checkoutItems: { fontSize: FontSizes.xs, color: Colors.light.textSecondary },
  checkoutBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: Radius.full },
  checkoutBtnText: { color: '#FFF', fontSize: FontSizes.base, fontWeight: '700' },
});

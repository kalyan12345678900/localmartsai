import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function MerchantSettings() {
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try { const data = await api.getStores(); setStores(data.filter((s: any) => s.merchant_id === user?.id)); }
    catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const toggleStore = async (storeId: string, currentOpen: boolean) => {
    try {
      await api.updateStore(storeId, { is_open: !currentOpen });
      loadStores();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.roles.merchant} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView>
        <Text style={s.title}>Store Settings</Text>
        {stores.map((store) => (
          <View key={store.id} style={s.storeCard}>
            <View style={s.storeHeader}>
              <Ionicons name="storefront" size={24} color={Colors.roles.merchant} />
              <View style={s.storeInfo}>
                <Text style={s.storeName}>{store.name}</Text>
                <Text style={s.storeAddress}>{store.address}</Text>
              </View>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Status</Text>
              <TouchableOpacity
                testID={`toggle-store-${store.id}`}
                style={[s.statusBtn, store.is_open ? s.openBtn : s.closedBtn]}
                onPress={() => toggleStore(store.id, store.is_open)}
              >
                <Text style={s.statusText}>{store.is_open ? 'OPEN' : 'CLOSED'}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Working Hours</Text>
              <Text style={s.value}>{store.working_hours}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Rating</Text>
              <View style={s.ratingRow}><Ionicons name="star" size={14} color="#FFB800" /><Text style={s.value}>{store.rating}</Text></View>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Total Orders</Text>
              <Text style={s.value}>{store.total_orders}</Text>
            </View>
          </View>
        ))}
        {stores.length === 0 && (
          <View style={s.center}><Text style={s.emptyText}>No stores found</Text></View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  title: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.lg },
  storeCard: { backgroundColor: '#FFF', marginHorizontal: Spacing.xl, padding: 20, borderRadius: Radius.lg, ...Shadows.sm },
  storeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  storeInfo: { flex: 1 },
  storeName: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.light.textPrimary },
  storeAddress: { fontSize: FontSizes.sm, color: Colors.light.textSecondary, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.light.border },
  label: { fontSize: FontSizes.sm, color: Colors.light.textSecondary },
  value: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.light.textPrimary },
  statusBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.full },
  openBtn: { backgroundColor: Colors.light.success },
  closedBtn: { backgroundColor: Colors.light.error },
  statusText: { fontSize: FontSizes.xs, fontWeight: '700', color: '#FFF' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emptyText: { fontSize: FontSizes.base, color: Colors.light.textSecondary },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function StoreDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (id) api.getStore(id).then(setStore).catch(console.log).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.light.primary} /></View></SafeAreaView>;
  if (!store) return <SafeAreaView style={s.safe}><View style={s.center}><Text>Store not found</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView>
        <Image source={{ uri: store.image }} style={s.hero} />
        <TouchableOpacity testID="back-btn" style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={s.content}>
          <Text style={s.name}>{store.name}</Text>
          <View style={s.metaRow}>
            <Ionicons name="star" size={14} color="#FFB800" />
            <Text style={s.meta}>{store.rating} · {store.total_orders} orders</Text>
            <View style={[s.statusDot, { backgroundColor: store.is_open ? Colors.light.success : Colors.light.error }]} />
            <Text style={s.meta}>{store.is_open ? 'Open' : 'Closed'}</Text>
          </View>
          <Text style={s.address}>{store.address}</Text>
          <Text style={s.hours}>{store.working_hours}</Text>

          <Text style={s.sectionTitle}>Menu ({store.products?.length || 0} items)</Text>
          {store.products?.map((product: any) => {
            const firstVariant = product.variants?.[0];
            return (
              <TouchableOpacity key={product.id} testID={`product-${product.id}`} style={s.productCard} onPress={() => router.push(`/product/${product.id}`)}>
                <View style={s.productInfo}>
                  <Text style={s.productName}>{product.name}</Text>
                  <Text style={s.productDesc} numberOfLines={2}>{product.description}</Text>
                  <Text style={s.productPrice}>₹{firstVariant?.price || 0}</Text>
                </View>
                <Image source={{ uri: product.image }} style={s.productImg} />
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { width: '100%', height: 200 },
  backBtn: { position: 'absolute', top: 50, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.xl },
  name: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  meta: { fontSize: FontSizes.sm, color: Colors.light.textSecondary },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  address: { fontSize: FontSizes.sm, color: Colors.light.textSecondary, marginTop: 8 },
  hours: { fontSize: FontSizes.sm, color: Colors.light.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.light.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.lg },
  productCard: { flexDirection: 'row', padding: 12, borderRadius: Radius.md, marginBottom: 12, backgroundColor: Colors.light.background, ...Shadows.sm },
  productInfo: { flex: 1, marginRight: 12 },
  productName: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.light.textPrimary },
  productDesc: { fontSize: FontSizes.xs, color: Colors.light.textSecondary, marginTop: 4 },
  productPrice: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.light.primary, marginTop: 8 },
  productImg: { width: 80, height: 80, borderRadius: Radius.sm },
});

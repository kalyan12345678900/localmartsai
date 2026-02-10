import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (id) api.getProduct(id).then(p => { setProduct(p); if (p.variants?.length) { setSelectedVariant(p.variants[0]); if (p.variants[0].sizes?.length) setSelectedSize(p.variants[0].sizes[0]); } }).catch(console.log).finally(() => setLoading(false));
  }, [id]);

  const getPrice = () => {
    const base = selectedVariant?.price || 0;
    const mod = selectedSize?.price_modifier || 0;
    return base + mod;
  };

  const addToCart = async () => {
    if (!selectedVariant) { Alert.alert('Select a variant'); return; }
    setAdding(true);
    try {
      await api.addToCart({ product_id: product.id, variant_id: selectedVariant.id, size_id: selectedSize?.id || '', quantity: 1 });
      Alert.alert('Added!', `${product.name} added to cart`, [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/(customer)/cart') },
      ]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setAdding(false); }
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.light.primary} /></View></SafeAreaView>;
  if (!product) return <SafeAreaView style={s.safe}><View style={s.center}><Text>Product not found</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView>
        <Image source={{ uri: product.image }} style={s.hero} />
        <TouchableOpacity testID="back-btn" style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={s.content}>
          <Text style={s.name}>{product.name}</Text>
          <Text style={s.desc}>{product.description}</Text>
          <Text style={s.price}>₹{getPrice()}</Text>

          {product.variants?.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Variant</Text>
              <View style={s.optionRow}>
                {product.variants.map((v: any) => (
                  <TouchableOpacity key={v.id} testID={`variant-${v.id}`}
                    style={[s.optionBtn, selectedVariant?.id === v.id && s.optionActive]}
                    onPress={() => { setSelectedVariant(v); if (v.sizes?.length) setSelectedSize(v.sizes[0]); else setSelectedSize(null); }}>
                    <Text style={[s.optionText, selectedVariant?.id === v.id && s.optionTextActive]}>{v.name}</Text>
                    <Text style={[s.optionPrice, selectedVariant?.id === v.id && s.optionTextActive]}>₹{v.price}</Text>
                    {v.variant_type === 'subscription' && <Text style={s.subTag}>SUBSCRIPTION</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {selectedVariant?.sizes?.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Size</Text>
              <View style={s.optionRow}>
                {selectedVariant.sizes.map((sz: any) => (
                  <TouchableOpacity key={sz.id} testID={`size-${sz.id}`}
                    style={[s.optionBtn, selectedSize?.id === sz.id && s.optionActive]}
                    onPress={() => setSelectedSize(sz)}>
                    <Text style={[s.optionText, selectedSize?.id === sz.id && s.optionTextActive]}>{sz.name}</Text>
                    {sz.price_modifier > 0 && <Text style={[s.optionPrice, selectedSize?.id === sz.id && s.optionTextActive]}>+₹{sz.price_modifier}</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <View style={s.footer}>
        <View>
          <Text style={s.footerPrice}>₹{getPrice()}</Text>
          <Text style={s.footerDetail}>{selectedVariant?.name}{selectedSize ? ` · ${selectedSize.name}` : ''}</Text>
        </View>
        <TouchableOpacity testID="add-to-cart-btn" style={s.addBtn} onPress={addToCart} disabled={adding}>
          {adding ? <ActivityIndicator color="#FFF" /> : <Text style={s.addBtnText}>Add to Cart</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { width: '100%', height: 250 },
  backBtn: { position: 'absolute', top: 50, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.xl },
  name: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary },
  desc: { fontSize: FontSizes.sm, color: Colors.light.textSecondary, marginTop: 8 },
  price: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.light.primary, marginTop: 12 },
  sectionTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.light.textSecondary, marginTop: 24, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.light.border, backgroundColor: '#FFF', minWidth: 80, alignItems: 'center' },
  optionActive: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primary },
  optionText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.light.textPrimary },
  optionTextActive: { color: '#FFF' },
  optionPrice: { fontSize: FontSizes.xs, color: Colors.light.textSecondary, marginTop: 2 },
  subTag: { fontSize: 9, fontWeight: '700', color: Colors.light.warning, marginTop: 4, letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.xl, paddingBottom: 34, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: Colors.light.border, ...Shadows.md },
  footerPrice: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.light.textPrimary },
  footerDetail: { fontSize: FontSizes.xs, color: Colors.light.textSecondary },
  addBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: Radius.full },
  addBtnText: { color: '#FFF', fontSize: FontSizes.base, fontWeight: '700' },
});

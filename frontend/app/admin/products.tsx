import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { load(); }, []);
  const load = async () => { try { setProducts(await api.getProducts()); } catch (e) { console.log(e); } finally { setLoading(false); } };
  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.roles.admin} /></View></SafeAreaView>;
  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.title}>Products ({products.length})</Text>
      <FlatList data={products} keyExtractor={i => i.id} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Image source={{ uri: item.image }} style={s.img} />
            <View style={s.info}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.desc} numberOfLines={1}>{item.description}</Text>
              <Text style={s.type}>{item.base_type?.toUpperCase()}</Text>
              {item.variants?.map((v: any) => (
                <Text key={v.id} style={s.variant}>{v.name}: ₹{v.price} ({v.variant_type})</Text>
              ))}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: 32 },
  card: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: Radius.lg, marginBottom: 10, ...Shadows.sm },
  img: { width: 72, height: 72, borderRadius: Radius.sm },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: FontSizes.base, fontWeight: '700', color: Colors.light.textPrimary },
  desc: { fontSize: FontSizes.xs, color: Colors.light.textSecondary, marginTop: 2 },
  type: { fontSize: 10, fontWeight: '700', color: Colors.roles.admin, marginTop: 4 },
  variant: { fontSize: FontSizes.xs, color: Colors.light.textSecondary, marginTop: 2 },
});

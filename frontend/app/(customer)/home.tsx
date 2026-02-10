import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator,
  RefreshControl, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [banners, setBanners] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [b, s, p] = await Promise.all([api.getBanners(), api.getStores(), api.getProducts()]);
      setBanners(b);
      setStores(s);
      setProducts(p);
    } catch (e) {
      console.log('Error loading home data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
            <Text style={styles.location}>What would you like today?</Text>
          </View>
          <TouchableOpacity testID="home-profile-btn" onPress={() => router.push('/(customer)/profile')} style={styles.avatarBtn}>
            <Ionicons name="person-circle" size={40} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity testID="home-search-btn" style={styles.searchBar} onPress={() => router.push('/(customer)/search')}>
          <Ionicons name="search" size={20} color={Colors.light.textSecondary} />
          <Text style={styles.searchPlaceholder}>Search stores & items...</Text>
        </TouchableOpacity>

        {/* Banners */}
        {banners.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bannerScroll}>
            {banners.map((banner, idx) => (
              <View key={banner.id || idx} style={styles.bannerCard}>
                <Image source={{ uri: banner.image_url }} style={styles.bannerImage} />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle}>{banner.title}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Shop by Store */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop by Store</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {stores.map((store) => (
              <TouchableOpacity
                key={store.id}
                testID={`store-card-${store.id}`}
                style={styles.storeCard}
                onPress={() => router.push(`/store/${store.id}`)}
              >
                <Image source={{ uri: store.image }} style={styles.storeImage} />
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                  <View style={styles.storeMetaRow}>
                    <Ionicons name="star" size={12} color="#FFB800" />
                    <Text style={styles.storeMeta}>{store.rating || '4.5'}</Text>
                    <Text style={styles.storeDot}>·</Text>
                    <Text style={styles.storeMeta}>{store.is_open ? 'Open' : 'Closed'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Shop by Item */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Items</Text>
          <View style={styles.itemGrid}>
            {products.slice(0, 6).map((product) => {
              const firstVariant = product.variants?.[0];
              const price = firstVariant?.price || 0;
              return (
                <TouchableOpacity
                  key={product.id}
                  testID={`product-card-${product.id}`}
                  style={styles.itemCard}
                  onPress={() => router.push(`/product/${product.id}`)}
                >
                  <Image source={{ uri: product.image }} style={styles.itemImage} />
                  <Text style={styles.itemName} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.itemPrice}>₹{price}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  greeting: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary },
  location: { fontSize: FontSizes.sm, color: Colors.light.textSecondary, marginTop: 2 },
  avatarBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg, paddingHorizontal: 16, paddingVertical: 14, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.light.border, gap: 10, ...Shadows.sm,
  },
  searchPlaceholder: { fontSize: FontSizes.base, color: Colors.light.textSecondary },
  bannerScroll: { marginTop: Spacing.xl, paddingLeft: Spacing.xl },
  bannerCard: { width: width - 64, height: 160, borderRadius: Radius.lg, overflow: 'hidden', marginRight: 16 },
  bannerImage: { width: '100%', height: '100%' },
  bannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
  bannerTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: '#FFF' },
  section: { marginTop: Spacing.xxl, paddingHorizontal: Spacing.xl },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.light.textPrimary, marginBottom: Spacing.lg },
  storeCard: { width: 160, marginRight: 16, backgroundColor: '#FFF', borderRadius: Radius.lg, overflow: 'hidden', ...Shadows.sm },
  storeImage: { width: '100%', height: 100 },
  storeInfo: { padding: 12 },
  storeName: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.light.textPrimary },
  storeMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  storeMeta: { fontSize: FontSizes.xs, color: Colors.light.textSecondary },
  storeDot: { fontSize: FontSizes.xs, color: Colors.light.textSecondary },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  itemCard: { width: (width - 60) / 2, backgroundColor: '#FFF', borderRadius: Radius.lg, overflow: 'hidden', ...Shadows.sm },
  itemImage: { width: '100%', height: 120 },
  itemName: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.light.textPrimary, paddingHorizontal: 12, paddingTop: 10 },
  itemPrice: { fontSize: FontSizes.base, fontWeight: '800', color: Colors.light.primary, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 4 },
});

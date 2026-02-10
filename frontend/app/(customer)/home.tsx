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

// ======================== CUSTOMER HOME ========================
function CustomerHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [banners, setBanners] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadData = useCallback(async () => {
    try { const [b, s, p] = await Promise.all([api.getBanners(), api.getStores(), api.getProducts()]); setBanners(b); setStores(s); setProducts(p); }
    catch (e) { console.log('Error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);
  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.light.primary} /></View></SafeAreaView>;
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />} showsVerticalScrollIndicator={false}>
        <View style={s.header}><View><Text style={s.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'} 👋</Text><Text style={s.location}>What would you like today?</Text></View>
          <TouchableOpacity testID="home-profile-btn" onPress={() => router.push('/profile')}><Ionicons name="person-circle" size={40} color={Colors.light.primary} /></TouchableOpacity>
        </View>
        <TouchableOpacity testID="home-search-btn" style={s.searchBar} onPress={() => router.push('/search')}>
          <Ionicons name="search" size={20} color={Colors.light.textSecondary} /><Text style={s.searchPlaceholder}>Search stores & items...</Text>
        </TouchableOpacity>
        {banners.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.bannerScroll}>
          {banners.map((banner, idx) => <View key={banner.id || idx} style={s.bannerCard}><Image source={{ uri: banner.image_url }} style={s.bannerImage} /><View style={s.bannerOverlay}><Text style={s.bannerTitle}>{banner.title}</Text></View></View>)}
        </ScrollView>}
        <View style={s.section}><Text style={s.sectionTitle}>Shop by Store</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {stores.map(store => <TouchableOpacity key={store.id} testID={`store-card-${store.id}`} style={s.storeCard} onPress={() => router.push(`/store/${store.id}`)}>
            <Image source={{ uri: store.image }} style={s.storeImage} /><View style={s.storeInfo}><Text style={s.storeName} numberOfLines={1}>{store.name}</Text>
            <View style={s.storeMetaRow}><Ionicons name="star" size={12} color="#FFB800" /><Text style={s.storeMeta}>{store.rating || '4.5'}</Text><Text style={s.storeDot}>·</Text><Text style={s.storeMeta}>{store.is_open ? 'Open' : 'Closed'}</Text></View></View>
          </TouchableOpacity>)}
        </ScrollView></View>
        <View style={s.section}><Text style={s.sectionTitle}>Popular Items</Text><View style={s.itemGrid}>
          {products.slice(0, 6).map(product => { const price = product.variants?.[0]?.price || 0; return (
            <TouchableOpacity key={product.id} testID={`product-card-${product.id}`} style={s.itemCard} onPress={() => router.push(`/product/${product.id}`)}>
              <Image source={{ uri: product.image }} style={s.itemImage} /><Text style={s.itemName} numberOfLines={2}>{product.name}</Text><Text style={s.itemPrice}>₹{price}</Text>
            </TouchableOpacity>); })}
        </View></View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ======================== MERCHANT DASHBOARD ========================
function MerchantDash() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadStats = useCallback(async () => { try { setStats(await api.getDashboardStats()); } catch (e) { console.log(e); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { loadStats(); }, [loadStats]);
  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.roles.merchant} /></View></SafeAreaView>;
  const cards = [
    { icon: 'checkmark-circle', label: 'Delivered', value: stats?.delivered || 0, color: Colors.light.success },
    { icon: 'close-circle', label: 'Cancelled', value: stats?.cancelled || 0, color: Colors.light.error },
    { icon: 'cart', label: 'Total Orders', value: stats?.total_orders || 0, color: Colors.roles.merchant },
    { icon: 'time', label: 'Pending', value: stats?.pending_orders || 0, color: Colors.light.warning },
  ];
  return (
    <SafeAreaView style={s.safe}><ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />}>
      <View style={s.header}><View><Text style={s.greeting}>Welcome, {user?.shop_name || user?.name}</Text><Text style={{ fontSize: FontSizes.sm, color: Colors.roles.merchant, fontWeight: '600', marginTop: 4 }}>Merchant Dashboard</Text></View></View>
      <View style={{ margin: Spacing.xl, backgroundColor: Colors.roles.merchant, padding: 24, borderRadius: Radius.lg }}><Text style={{ fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)' }}>Total Revenue</Text><Text style={{ fontSize: 36, fontWeight: '800', color: '#FFF', marginTop: 4 }}>₹{(stats?.total_revenue || 0).toLocaleString()}</Text></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, gap: 12 }}>
        {cards.map((c, i) => <View key={i} style={{ width: '47%', backgroundColor: '#FFF', padding: 20, borderRadius: Radius.lg, ...Shadows.sm }}><Ionicons name={c.icon as any} size={24} color={c.color} /><Text style={{ fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.light.textPrimary, marginTop: 8 }}>{c.value}</Text><Text style={{ fontSize: FontSizes.sm, color: Colors.light.textSecondary, marginTop: 2 }}>{c.label}</Text></View>)}
      </View>
    </ScrollView></SafeAreaView>
  );
}

// ======================== AGENT DASHBOARD ========================
function AgentDash() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const loadStats = useCallback(async () => { try { setStats(await api.getDashboardStats()); } catch (e) { console.log(e); } finally { setLoading(false); } }, []);
  useEffect(() => { loadStats(); }, [loadStats]);
  const toggleOnline = async () => { try { await api.toggleOnline(); await refreshUser(); } catch (e) { } };
  if (loading) return <SafeAreaView style={[s.safe, { backgroundColor: '#09090B' }]}><View style={s.center}><ActivityIndicator size="large" color="#CCFF00" /></View></SafeAreaView>;
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: '#09090B' }]}><ScrollView>
      <View style={[s.header, { justifyContent: 'space-between' }]}><View><Text style={[s.greeting, { color: '#FFF' }]}>Hey, {user?.name?.split(' ')[0]}</Text><Text style={{ fontSize: FontSizes.sm, color: '#CCFF00', fontWeight: '600', marginTop: 4 }}>Delivery Agent</Text></View>
        <TouchableOpacity testID="toggle-online-btn" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 2, borderColor: user?.is_online ? Colors.light.success : Colors.light.error }} onPress={toggleOnline}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: user?.is_online ? Colors.light.success : Colors.light.error }} /><Text style={{ fontSize: FontSizes.sm, fontWeight: '700', color: user?.is_online ? Colors.light.success : Colors.light.error }}>{user?.is_online ? 'Online' : 'Offline'}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ margin: Spacing.xl, backgroundColor: '#18181B', padding: 24, borderRadius: Radius.lg, borderWidth: 1, borderColor: '#CCFF00' }}><Text style={{ fontSize: FontSizes.sm, color: '#A1A1A9' }}>Total Earnings</Text><Text style={{ fontSize: 36, fontWeight: '800', color: '#CCFF00', marginTop: 4, marginBottom: 4 }}>₹{(stats?.total_earnings || 0).toLocaleString()}</Text><Text style={{ fontSize: FontSizes.sm, color: '#A1A1A9' }}>{stats?.total_deliveries || 0} deliveries</Text></View>
      <View style={{ flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: 12 }}>
        {[{ icon: 'flash', label: 'Active', value: stats?.active_orders || 0, color: '#CCFF00' }, { icon: 'checkmark-done', label: 'Delivered', value: stats?.total_deliveries || 0, color: Colors.light.success }].map((c, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: '#18181B', padding: 20, borderRadius: Radius.lg, borderWidth: 1, borderColor: '#27272A' }}><Ionicons name={c.icon as any} size={24} color={c.color} /><Text style={{ fontSize: FontSizes.xxl, fontWeight: '800', color: '#FFF', marginTop: 8 }}>{c.value}</Text><Text style={{ fontSize: FontSizes.sm, color: '#A1A1A9', marginTop: 2 }}>{c.label}</Text></View>))}
      </View>
    </ScrollView></SafeAreaView>
  );
}

// ======================== ADMIN DASHBOARD ========================
function AdminDash() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const loadStats = useCallback(async () => { try { setStats(await api.getDashboardStats()); } catch (e) { console.log(e); } finally { setLoading(false); } }, []);
  useEffect(() => { loadStats(); }, [loadStats]);
  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.roles.admin} /></View></SafeAreaView>;
  const cards = [
    { icon: 'cart', label: 'Total Orders', value: stats?.total_orders || 0, color: Colors.roles.admin },
    { icon: 'checkmark-circle', label: 'Delivered', value: stats?.delivered || 0, color: Colors.light.success },
    { icon: 'close-circle', label: 'Cancelled', value: stats?.cancelled || 0, color: Colors.light.error },
    { icon: 'people', label: 'Merchants', value: stats?.total_merchants || 0, color: Colors.roles.merchant },
    { icon: 'bicycle', label: 'Agents', value: stats?.total_agents || 0, color: '#CCFF00' },
    { icon: 'person', label: 'Customers', value: stats?.total_customers || 0, color: Colors.light.primary },
  ];
  return (
    <SafeAreaView style={s.safe}><ScrollView>
      <View style={s.header}><View><Text style={s.greeting}>Admin Dashboard</Text><Text style={{ fontSize: FontSizes.sm, color: Colors.roles.admin, fontWeight: '600', marginTop: 4 }}>Platform Overview</Text></View></View>
      <View style={{ margin: Spacing.xl, backgroundColor: Colors.roles.admin, padding: 24, borderRadius: Radius.lg }}><Text style={{ fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)' }}>Total Platform Earnings</Text><Text style={{ fontSize: 36, fontWeight: '800', color: '#FFF', marginVertical: 4 }}>₹{(stats?.total_earnings || 0).toLocaleString()}</Text><Text style={{ fontSize: FontSizes.sm, color: 'rgba(255,255,255,0.8)' }}>Platform Fees: ₹{(stats?.platform_fees || 0).toLocaleString()}</Text></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, gap: 12 }}>
        {cards.map((c, i) => <View key={i} style={{ width: '47%', backgroundColor: '#FFF', padding: 16, borderRadius: Radius.lg, ...Shadows.sm }}><Ionicons name={c.icon as any} size={22} color={c.color} /><Text style={{ fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary, marginTop: 6 }}>{c.value}</Text><Text style={{ fontSize: FontSizes.xs, color: Colors.light.textSecondary, marginTop: 2 }}>{c.label}</Text></View>)}
      </View>
    </ScrollView></SafeAreaView>
  );
}

// ======================== MAIN HOME (ROLE ROUTER) ========================
export default function HomeScreen() {
  const { user } = useAuth();
  switch (user?.active_role) {
    case 'merchant': return <MerchantDash />;
    case 'agent': return <AgentDash />;
    case 'admin': return <AdminDash />;
    default: return <CustomerHome />;
  }
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  greeting: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.light.textPrimary },
  location: { fontSize: FontSizes.sm, color: Colors.light.textSecondary, marginTop: 2 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: Spacing.xl, marginTop: Spacing.lg, paddingHorizontal: 16, paddingVertical: 14, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.light.border, gap: 10, ...Shadows.sm },
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

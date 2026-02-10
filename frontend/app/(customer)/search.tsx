import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../constants/Colors';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ stores: any[]; products: any[] }>({ stores: [], products: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) { setResults({ stores: [], products: [] }); setSearched(false); return; }
    setLoading(true);
    try {
      const data = await api.search(text);
      setResults(data);
      setSearched(true);
    } catch (e) {
      console.log('Search error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={Colors.light.textSecondary} />
        <TextInput
          testID="search-input"
          style={styles.input}
          placeholder="Search stores & items..."
          placeholderTextColor={Colors.light.textSecondary}
          value={query}
          onChangeText={handleSearch}
          autoFocus
        />
        {query ? (
          <TouchableOpacity testID="search-clear-btn" onPress={() => { setQuery(''); setResults({ stores: [], products: [] }); setSearched(false); }}>
            <Ionicons name="close-circle" size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 32 }} color={Colors.light.primary} />}

      {searched && !loading && (
        <FlatList
          data={[
            ...results.stores.map(s => ({ ...s, _type: 'store' })),
            ...results.products.map(p => ({ ...p, _type: 'product' })),
          ]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={Colors.light.border} />
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`search-result-${item.id}`}
              style={styles.resultCard}
              onPress={() => router.push(item._type === 'store' ? `/store/${item.id}` : `/product/${item.id}`)}
            >
              <Image source={{ uri: item.image || item.image_url }} style={styles.resultImage} />
              <View style={styles.resultInfo}>
                <Text style={styles.resultType}>{item._type === 'store' ? 'STORE' : 'ITEM'}</Text>
                <Text style={styles.resultName}>{item.name}</Text>
                {item.description && <Text style={styles.resultDesc} numberOfLines={1}>{item.description}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.light.border, gap: 10,
  },
  input: { flex: 1, fontSize: FontSizes.base, color: Colors.light.textPrimary },
  list: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 12, borderRadius: Radius.md, marginBottom: 10, ...Shadows.sm,
  },
  resultImage: { width: 56, height: 56, borderRadius: Radius.sm },
  resultInfo: { flex: 1, marginLeft: 12 },
  resultType: { fontSize: 10, fontWeight: '700', color: Colors.light.primary, letterSpacing: 1 },
  resultName: { fontSize: FontSizes.base, fontWeight: '600', color: Colors.light.textPrimary, marginTop: 2 },
  resultDesc: { fontSize: FontSizes.xs, color: Colors.light.textSecondary, marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: FontSizes.base, color: Colors.light.textSecondary, marginTop: 12 },
});

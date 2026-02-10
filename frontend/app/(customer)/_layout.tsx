import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/Colors';

export default function TabsLayout() {
  const { user } = useAuth();
  const role = user?.active_role || 'customer';

  const roleColor = Colors.roles[role as keyof typeof Colors.roles] || Colors.light.primary;
  const isDarkRole = role === 'agent';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDarkRole ? '#CCFF00' : roleColor,
        tabBarInactiveTintColor: isDarkRole ? '#666' : Colors.light.textSecondary,
        tabBarStyle: {
          backgroundColor: isDarkRole ? '#18181B' : '#FFF',
          borderTopColor: isDarkRole ? '#27272A' : Colors.light.border,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {/* Customer Tabs */}
      <Tabs.Screen name="home" options={{ title: 'Home', href: role === 'customer' ? '/home' : null, tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Search', href: role === 'customer' ? '/search' : null, tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} /> }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart', href: role === 'customer' ? '/cart' : null, tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', href: role === 'customer' ? '/orders' : null, tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', href: role === 'customer' ? '/profile' : null, tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />

      {/* Merchant Tabs */}
      <Tabs.Screen name="merchant-dashboard" options={{ title: 'Dashboard', href: role === 'merchant' ? '/merchant-dashboard' : null, tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }} />
      <Tabs.Screen name="merchant-orders" options={{ title: 'Orders', href: role === 'merchant' ? '/merchant-orders' : null, tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} /> }} />
      <Tabs.Screen name="merchant-settings" options={{ title: 'Store', href: role === 'merchant' ? '/merchant-settings' : null, tabBarIcon: ({ color, size }) => <Ionicons name="storefront" size={size} color={color} /> }} />
      <Tabs.Screen name="merchant-profile" options={{ title: 'Profile', href: role === 'merchant' ? '/merchant-profile' : null, tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />

      {/* Agent Tabs */}
      <Tabs.Screen name="agent-dashboard" options={{ title: 'Dashboard', href: role === 'agent' ? '/agent-dashboard' : null, tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" size={size} color={color} /> }} />
      <Tabs.Screen name="agent-deliveries" options={{ title: 'Deliveries', href: role === 'agent' ? '/agent-deliveries' : null, tabBarIcon: ({ color, size }) => <Ionicons name="bicycle" size={size} color={color} /> }} />
      <Tabs.Screen name="agent-profile" options={{ title: 'Profile', href: role === 'agent' ? '/agent-profile' : null, tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />

      {/* Admin Tabs */}
      <Tabs.Screen name="admin-dashboard" options={{ title: 'Dashboard', href: role === 'admin' ? '/admin-dashboard' : null, tabBarIcon: ({ color, size }) => <Ionicons name="analytics" size={size} color={color} /> }} />
      <Tabs.Screen name="admin-products" options={{ title: 'Products', href: role === 'admin' ? '/admin-products' : null, tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} /> }} />
      <Tabs.Screen name="admin-settlements" options={{ title: 'Settle', href: role === 'admin' ? '/admin-settlements' : null, tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} /> }} />
      <Tabs.Screen name="admin-profile" options={{ title: 'Profile', href: role === 'admin' ? '/admin-profile' : null, tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}

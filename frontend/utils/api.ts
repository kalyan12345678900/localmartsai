import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem('auth_token');
}

async function request(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const url = `${API_BASE}/api${endpoint}`;
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Auth
  register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  switchRole: (role: string) => request('/auth/switch-role', { method: 'PUT', body: JSON.stringify({ role }) }),
  updateProfile: (data: any) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  toggleOnline: () => request('/auth/toggle-online', { method: 'PUT' }),

  // Products
  getProducts: (params?: string) => request(`/products${params ? `?${params}` : ''}`),
  getProduct: (id: string) => request(`/products/${id}`),

  // Stores
  getStores: (search?: string) => request(`/stores${search ? `?search=${search}` : ''}`),
  getStore: (id: string) => request(`/stores/${id}`),
  updateStore: (id: string, data: any) => request(`/stores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Cart
  getCart: () => request('/cart'),
  addToCart: (data: any) => request('/cart/add', { method: 'POST', body: JSON.stringify(data) }),
  updateCartItem: (data: any) => request('/cart/update', { method: 'PUT', body: JSON.stringify(data) }),
  clearCart: () => request('/cart/clear', { method: 'DELETE' }),

  // Orders
  checkout: (data: any) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: (status?: string) => request(`/orders${status ? `?status=${status}` : ''}`),
  getAvailableOrders: () => request('/orders/available'),
  getOrder: (id: string) => request(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  acceptOrder: (id: string) => request(`/orders/${id}/accept`, { method: 'PUT' }),
  assignOrder: (id: string) => request(`/orders/${id}/assign`, { method: 'PUT' }),
  verifyOTP: (id: string, otp: string) =>
    request(`/orders/${id}/verify-otp`, { method: 'PUT', body: JSON.stringify({ otp }) }),

  // Banners
  getBanners: () => request('/banners'),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),

  // Settlements
  getSettlements: () => request('/settlements'),
  requestSettlement: (amount: number) =>
    request('/settlements/request', { method: 'POST', body: JSON.stringify({ amount }) }),
  settlePayment: (id: string) => request(`/settlements/${id}/settle`, { method: 'PUT' }),

  // Search
  search: (q: string) => request(`/search?q=${encodeURIComponent(q)}`),

  // CMS
  getCms: () => request('/cms'),

  // Promotions
  getPromotions: () => request('/promotions'),
};

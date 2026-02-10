import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  active_role: string;
  profile_photo: string;
  is_online: boolean;
  shop_name?: string;
  shop_address?: string;
  license_no?: string;
  vehicle_no?: string;
  working_hours?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  switchRole: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        const userData = await api.getMe();
        setUser(userData);
      }
    } catch (e) {
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const result = await api.login({ email, password });
    await AsyncStorage.setItem('auth_token', result.token);
    setToken(result.token);
    setUser(result.user);
  };

  const register = async (data: any) => {
    const result = await api.register(data);
    await AsyncStorage.setItem('auth_token', result.token);
    setToken(result.token);
    setUser(result.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const switchRole = async (role: string) => {
    const updatedUser = await api.switchRole(role);
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    const userData = await api.getMe();
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, switchRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

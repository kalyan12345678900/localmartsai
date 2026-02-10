import React from 'react';
import { useAuth } from '../../context/AuthContext';
import CustomerHome from './home-customer';
import MerchantDash from './merchant-dashboard';
import AgentDash from './agent-dashboard';
import AdminDash from './admin-dashboard';

export default function HomeScreen() {
  const { user } = useAuth();
  const role = user?.active_role || 'customer';

  switch (role) {
    case 'merchant': return <MerchantDash />;
    case 'agent': return <AgentDash />;
    case 'admin': return <AdminDash />;
    default: return <CustomerHome />;
  }
}

"""Test banners and dashboard stats"""
import pytest
import os

BASE_URL = os.environ['EXPO_PUBLIC_BACKEND_URL'].rstrip('/')

class TestBannersAndDashboard:
    """Test banners and dashboard APIs"""
    
    def test_get_banners(self, api_client):
        """Test fetching banners"""
        response = api_client.get(f"{BASE_URL}/api/banners")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # Seeded data has 2 banners
        if len(data) > 0:
            banner = data[0]
            assert "title" in banner
            assert "image_url" in banner
            assert "is_active" in banner
        print(f"✓ Fetched {len(data)} banners")
    
    def test_customer_dashboard_stats(self, api_client):
        """Test customer dashboard stats"""
        # Login as customer
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@delivery.com",
            "password": "customer123"
        })
        token = login_resp.json()["token"]
        
        response = api_client.get(f"{BASE_URL}/api/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert "total_orders" in data
        assert "active_orders" in data
        assert "total_spent" in data
        print(f"✓ Customer stats - Orders: {data['total_orders']}, Active: {data['active_orders']}, Spent: ₹{data['total_spent']}")
    
    def test_merchant_dashboard_stats(self, api_client):
        """Test merchant dashboard stats"""
        # Login as merchant
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "merchant@delivery.com",
            "password": "merchant123"
        })
        token = login_resp.json()["token"]
        
        response = api_client.get(f"{BASE_URL}/api/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert "total_orders" in data
        assert "delivered" in data
        assert "total_revenue" in data
        assert "pending_orders" in data
        print(f"✓ Merchant stats - Orders: {data['total_orders']}, Revenue: ₹{data['total_revenue']}")
    
    def test_agent_dashboard_stats(self, api_client):
        """Test agent dashboard stats"""
        # Login as agent
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "agent@delivery.com",
            "password": "agent123"
        })
        token = login_resp.json()["token"]
        
        response = api_client.get(f"{BASE_URL}/api/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert "total_deliveries" in data
        assert "total_earnings" in data
        assert "active_orders" in data
        print(f"✓ Agent stats - Deliveries: {data['total_deliveries']}, Earnings: ₹{data['total_earnings']}")
    
    def test_admin_dashboard_stats(self, api_client):
        """Test admin dashboard stats"""
        # Login as admin
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@delivery.com",
            "password": "admin123"
        })
        token = login_resp.json()["token"]
        
        response = api_client.get(f"{BASE_URL}/api/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert "total_orders" in data
        assert "delivered" in data
        assert "cancelled" in data
        assert "total_earnings" in data
        assert "total_merchants" in data
        assert "total_agents" in data
        assert "total_customers" in data
        assert "platform_fees" in data
        print(f"✓ Admin stats - Orders: {data['total_orders']}, Earnings: ₹{data['total_earnings']}, Platform Fees: ₹{data['platform_fees']}")
        print(f"  Users - Merchants: {data['total_merchants']}, Agents: {data['total_agents']}, Customers: {data['total_customers']}")

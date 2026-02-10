"""Test authentication and role management"""
import pytest
import requests
import os

BASE_URL = os.environ['EXPO_PUBLIC_BACKEND_URL'].rstrip('/')

class TestAuth:
    """Authentication tests"""
    
    def test_login_customer_success(self, api_client):
        """Test customer login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@delivery.com",
            "password": "customer123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "customer@delivery.com"
        assert "customer" in data["user"]["roles"]
        print(f"✓ Customer login successful: {data['user']['name']}")

    def test_login_merchant_success(self, api_client):
        """Test merchant login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "merchant@delivery.com",
            "password": "merchant123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "merchant" in data["user"]["roles"]
        print(f"✓ Merchant login successful: {data['user']['name']}")

    def test_login_agent_success(self, api_client):
        """Test agent login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "agent@delivery.com",
            "password": "agent123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "agent" in data["user"]["roles"]
        print(f"✓ Agent login successful: {data['user']['name']}")

    def test_login_admin_success(self, api_client):
        """Test admin login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@delivery.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "admin" in data["user"]["roles"]
        print(f"✓ Admin login successful: {data['user']['name']}")

    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@delivery.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected as expected")

    def test_get_me_authenticated(self, api_client):
        """Test /auth/me with valid token"""
        # First login
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@delivery.com",
            "password": "customer123"
        })
        token = login_resp.json()["token"]
        
        # Get user info
        response = api_client.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "customer@delivery.com"
        assert "password_hash" not in data
        print("✓ Get current user successful")

    def test_get_me_unauthenticated(self, api_client):
        """Test /auth/me without token"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ Unauthenticated request blocked")

    def test_switch_role(self, api_client):
        """Test role switching for multi-role user"""
        # Login as merchant (has merchant + customer roles)
        login_resp = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "merchant@delivery.com",
            "password": "merchant123"
        })
        token = login_resp.json()["token"]
        assert login_resp.json()["user"]["active_role"] == "merchant"
        
        # Switch to customer role
        response = api_client.put(
            f"{BASE_URL}/api/auth/switch-role",
            headers={"Authorization": f"Bearer {token}"},
            json={"role": "customer"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["active_role"] == "customer"
        print("✓ Role switching successful")

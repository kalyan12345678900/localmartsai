"""Test complete order flow: Place → Accept → Assign → Deliver with OTP"""
import pytest
import os

BASE_URL = os.environ['EXPO_PUBLIC_BACKEND_URL'].rstrip('/')

class TestOrderFlow:
    """Test order lifecycle"""
    
    @pytest.fixture
    def customer_token(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@delivery.com", "password": "customer123"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def merchant_token(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "merchant@delivery.com", "password": "merchant123"
        })
        return response.json()["token"]
    
    @pytest.fixture
    def agent_token(self, api_client):
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "agent@delivery.com", "password": "agent123"
        })
        return response.json()["token"]
    
    def test_place_order(self, api_client, customer_token):
        """Test placing an order (checkout)"""
        # Add items to cart
        products = api_client.get(f"{BASE_URL}/api/products").json()
        product = products[0]
        variant = product["variants"][0]
        
        api_client.delete(f"{BASE_URL}/api/cart/clear", headers={"Authorization": f"Bearer {customer_token}"})
        api_client.post(
            f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"product_id": product["id"], "variant_id": variant["id"], "size_id": "", "quantity": 2}
        )
        
        # Checkout
        response = api_client.post(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={
                "delivery_address": "TEST_123 Main St, Downtown",
                "lat": 12.9716,
                "lng": 77.5946,
                "distance_km": 2.0
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "order_number" in data
        assert data["status"] == "placed"
        assert "otp" in data
        assert len(data["otp"]) == 4
        assert data["user_name"] is not None
        assert data["total"] > 0
        print(f"✓ Order placed: {data['order_number']}, OTP: {data['otp']}, Total: ₹{data['total']}")
        return data
    
    def test_get_customer_orders(self, api_client, customer_token):
        """Test fetching customer orders"""
        response = api_client.get(f"{BASE_URL}/api/orders", headers={"Authorization": f"Bearer {customer_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Customer has {len(data)} orders")
    
    def test_merchant_accept_order(self, api_client, customer_token, merchant_token):
        """Test merchant accepting order"""
        # Place order first
        products = api_client.get(f"{BASE_URL}/api/products").json()
        product = products[0]
        variant = product["variants"][0]
        
        api_client.delete(f"{BASE_URL}/api/cart/clear", headers={"Authorization": f"Bearer {customer_token}"})
        api_client.post(
            f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"product_id": product["id"], "variant_id": variant["id"], "size_id": "", "quantity": 1}
        )
        order = api_client.post(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"delivery_address": "TEST_456 Park Ave", "lat": 12.9716, "lng": 77.5946, "distance_km": 2.0}
        ).json()
        order_id = order["id"]
        
        # Merchant accepts
        response = api_client.put(
            f"{BASE_URL}/api/orders/{order_id}/accept",
            headers={"Authorization": f"Bearer {merchant_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "accepted"
        print(f"✓ Merchant accepted order: {order['order_number']}")
    
    def test_get_available_orders_for_agent(self, api_client, customer_token, merchant_token, agent_token):
        """Test agent viewing available orders"""
        # Place and accept order
        products = api_client.get(f"{BASE_URL}/api/products").json()
        product = products[0]
        variant = product["variants"][0]
        
        api_client.delete(f"{BASE_URL}/api/cart/clear", headers={"Authorization": f"Bearer {customer_token}"})
        api_client.post(
            f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"product_id": product["id"], "variant_id": variant["id"], "size_id": "", "quantity": 1}
        )
        order = api_client.post(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"delivery_address": "TEST_789 Oak Blvd", "lat": 12.9716, "lng": 77.5946, "distance_km": 2.0}
        ).json()
        
        api_client.put(f"{BASE_URL}/api/orders/{order['id']}/accept", headers={"Authorization": f"Bearer {merchant_token}"})
        
        # Agent checks available orders
        response = api_client.get(f"{BASE_URL}/api/orders/available", headers={"Authorization": f"Bearer {agent_token}"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should find at least our order
        found = any(o["id"] == order["id"] for o in data)
        assert found
        print(f"✓ Agent sees {len(data)} available orders")
    
    def test_agent_assign_order(self, api_client, customer_token, merchant_token, agent_token):
        """Test agent assigning order to themselves"""
        # Place and accept order
        products = api_client.get(f"{BASE_URL}/api/products").json()
        product = products[0]
        variant = product["variants"][0]
        
        api_client.delete(f"{BASE_URL}/api/cart/clear", headers={"Authorization": f"Bearer {customer_token}"})
        api_client.post(
            f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"product_id": product["id"], "variant_id": variant["id"], "size_id": "", "quantity": 1}
        )
        order = api_client.post(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"delivery_address": "TEST_101 Maple St", "lat": 12.9716, "lng": 77.5946, "distance_km": 2.0}
        ).json()
        
        api_client.put(f"{BASE_URL}/api/orders/{order['id']}/accept", headers={"Authorization": f"Bearer {merchant_token}"})
        
        # Agent assigns to themselves
        response = api_client.put(
            f"{BASE_URL}/api/orders/{order['id']}/assign",
            headers={"Authorization": f"Bearer {agent_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "assigned"
        assert data["agent_name"] is not None
        print(f"✓ Agent assigned to order: {order['order_number']}")
    
    def test_order_status_transitions(self, api_client, customer_token, merchant_token, agent_token):
        """Test order status transitions: placed → accepted → preparing → ready_for_pickup"""
        # Place order
        products = api_client.get(f"{BASE_URL}/api/products").json()
        product = products[0]
        variant = product["variants"][0]
        
        api_client.delete(f"{BASE_URL}/api/cart/clear", headers={"Authorization": f"Bearer {customer_token}"})
        api_client.post(
            f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"product_id": product["id"], "variant_id": variant["id"], "size_id": "", "quantity": 1}
        )
        order = api_client.post(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"delivery_address": "TEST_202 Pine Ave", "lat": 12.9716, "lng": 77.5946, "distance_km": 2.0}
        ).json()
        order_id = order["id"]
        
        # Merchant accepts (placed → accepted)
        api_client.put(f"{BASE_URL}/api/orders/{order_id}/accept", headers={"Authorization": f"Bearer {merchant_token}"})
        
        # Merchant starts preparing (accepted → preparing)
        response = api_client.put(
            f"{BASE_URL}/api/orders/{order_id}/status",
            headers={"Authorization": f"Bearer {merchant_token}"},
            json={"status": "preparing"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "preparing"
        
        # Merchant marks ready (preparing → ready_for_pickup)
        response = api_client.put(
            f"{BASE_URL}/api/orders/{order_id}/status",
            headers={"Authorization": f"Bearer {merchant_token}"},
            json={"status": "ready_for_pickup"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ready_for_pickup"
        print(f"✓ Order status transitions working: {order['order_number']}")
    
    def test_otp_verification(self, api_client, customer_token, merchant_token, agent_token):
        """Test OTP verification for delivery completion"""
        # Complete flow up to pickup
        products = api_client.get(f"{BASE_URL}/api/products").json()
        product = products[0]
        variant = product["variants"][0]
        
        api_client.delete(f"{BASE_URL}/api/cart/clear", headers={"Authorization": f"Bearer {customer_token}"})
        api_client.post(
            f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"product_id": product["id"], "variant_id": variant["id"], "size_id": "", "quantity": 1}
        )
        order = api_client.post(
            f"{BASE_URL}/api/orders",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"delivery_address": "TEST_303 Cedar Ln", "lat": 12.9716, "lng": 77.5946, "distance_km": 2.0}
        ).json()
        order_id = order["id"]
        otp = order["otp"]
        
        # Accept and assign
        api_client.put(f"{BASE_URL}/api/orders/{order_id}/accept", headers={"Authorization": f"Bearer {merchant_token}"})
        api_client.put(f"{BASE_URL}/api/orders/{order_id}/assign", headers={"Authorization": f"Bearer {agent_token}"})
        
        # Update to preparing and ready
        api_client.put(
            f"{BASE_URL}/api/orders/{order_id}/status",
            headers={"Authorization": f"Bearer {merchant_token}"},
            json={"status": "preparing"}
        )
        api_client.put(
            f"{BASE_URL}/api/orders/{order_id}/status",
            headers={"Authorization": f"Bearer {merchant_token}"},
            json={"status": "ready_for_pickup"}
        )
        
        # Agent picks up
        api_client.put(
            f"{BASE_URL}/api/orders/{order_id}/status",
            headers={"Authorization": f"Bearer {agent_token}"},
            json={"status": "picked_up"}
        )
        
        # Test invalid OTP
        response = api_client.put(
            f"{BASE_URL}/api/orders/{order_id}/verify-otp",
            headers={"Authorization": f"Bearer {agent_token}"},
            json={"otp": "0000"}
        )
        assert response.status_code == 400
        print("✓ Invalid OTP rejected")
        
        # Test valid OTP
        response = api_client.put(
            f"{BASE_URL}/api/orders/{order_id}/verify-otp",
            headers={"Authorization": f"Bearer {agent_token}"},
            json={"otp": otp}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "delivered"
        print(f"✓ OTP verified, order delivered: {order['order_number']}")

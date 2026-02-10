"""Test cart functionality and promotion engine"""
import pytest
import os

BASE_URL = os.environ['EXPO_PUBLIC_BACKEND_URL'].rstrip('/')

class TestCartAndPromotions:
    """Test cart and promotion engine"""
    
    @pytest.fixture
    def customer_token(self, api_client):
        """Get customer auth token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "customer@delivery.com",
            "password": "customer123"
        })
        return response.json()["token"]
    
    def test_get_empty_cart(self, api_client, customer_token):
        """Test fetching empty cart"""
        # Clear cart first
        api_client.delete(f"{BASE_URL}/api/cart/clear", headers={"Authorization": f"Bearer {customer_token}"})
        
        response = api_client.get(f"{BASE_URL}/api/cart", headers={"Authorization": f"Bearer {customer_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 0
        assert data["subtotal"] == 0
        print("✓ Empty cart fetched successfully")
    
    def test_add_to_cart(self, api_client, customer_token):
        """Test adding item to cart"""
        # Clear cart first
        api_client.delete(f"{BASE_URL}/api/cart/clear", headers={"Authorization": f"Bearer {customer_token}"})
        
        # Get a product with variant
        products = api_client.get(f"{BASE_URL}/api/products").json()
        product = products[0]
        variant = product["variants"][0]
        size = variant["sizes"][0] if variant["sizes"] else None
        
        # Add to cart
        response = api_client.post(
            f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={
                "product_id": product["id"],
                "variant_id": variant["id"],
                "size_id": size["id"] if size else "",
                "quantity": 2
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["item_count"] > 0
        print(f"✓ Added item to cart: {product['name']}")
        
        # Verify cart has item
        cart = api_client.get(f"{BASE_URL}/api/cart", headers={"Authorization": f"Bearer {customer_token}"}).json()
        assert len(cart["items"]) > 0
        assert cart["subtotal"] > 0
        print(f"✓ Cart subtotal: ₹{cart['subtotal']}")
    
    def test_update_cart_quantity(self, api_client, customer_token):
        """Test updating cart item quantity"""
        # Add item first
        products = api_client.get(f"{BASE_URL}/api/products").json()
        product = products[0]
        variant = product["variants"][0]
        
        api_client.delete(f"{BASE_URL}/api/cart/clear", headers={"Authorization": f"Bearer {customer_token}"})
        api_client.post(
            f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"product_id": product["id"], "variant_id": variant["id"], "size_id": "", "quantity": 1}
        )
        
        # Get item ID
        cart = api_client.get(f"{BASE_URL}/api/cart", headers={"Authorization": f"Bearer {customer_token}"}).json()
        item_id = cart["items"][0]["item_id"]
        
        # Update quantity
        response = api_client.put(
            f"{BASE_URL}/api/cart/update",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"item_id": item_id, "quantity": 3}
        )
        assert response.status_code == 200
        print("✓ Cart quantity updated")
        
        # Verify update
        cart = api_client.get(f"{BASE_URL}/api/cart", headers={"Authorization": f"Bearer {customer_token}"}).json()
        assert cart["items"][0]["quantity"] == 3
    
    def test_promotion_upsell_message(self, api_client, customer_token):
        """Test upsell promotion (cart < 1000)"""
        # Add low value item
        products = api_client.get(f"{BASE_URL}/api/products").json()
        # Find cheapest product
        cheapest = min(products, key=lambda p: p["variants"][0]["price"] if p["variants"] else 9999)
        variant = cheapest["variants"][0]
        
        api_client.delete(f"{BASE_URL}/api/cart/clear", headers={"Authorization": f"Bearer {customer_token}"})
        api_client.post(
            f"{BASE_URL}/api/cart/add",
            headers={"Authorization": f"Bearer {customer_token}"},
            json={"product_id": cheapest["id"], "variant_id": variant["id"], "size_id": "", "quantity": 1}
        )
        
        cart = api_client.get(f"{BASE_URL}/api/cart", headers={"Authorization": f"Bearer {customer_token}"}).json()
        promotions = cart["promotions"]
        
        if cart["subtotal"] < 1000:
            assert promotions["upsell_message"] != ""
            assert "gift" in promotions["upsell_message"].lower()
            print(f"✓ Upsell promotion: {promotions['upsell_message']}")
    
    def test_promotion_gift_eligible(self, api_client, customer_token):
        """Test gift with purchase (cart > 1000)"""
        # Add high value items
        products = api_client.get(f"{BASE_URL}/api/products").json()
        
        api_client.delete(f"{BASE_URL}/api/cart/clear", headers={"Authorization": f"Bearer {customer_token}"})
        
        # Add multiple items to exceed 1000
        for product in products[:3]:
            variant = product["variants"][0]
            api_client.post(
                f"{BASE_URL}/api/cart/add",
                headers={"Authorization": f"Bearer {customer_token}"},
                json={"product_id": product["id"], "variant_id": variant["id"], "size_id": "", "quantity": 2}
            )
        
        cart = api_client.get(f"{BASE_URL}/api/cart", headers={"Authorization": f"Bearer {customer_token}"}).json()
        promotions = cart["promotions"]
        
        if cart["subtotal"] > 1000:
            assert promotions["gift_eligible"] == True
            assert promotions["gift_message"] != ""
            print(f"✓ Gift promotion applied! Subtotal: ₹{cart['subtotal']}")
    
    def test_promotion_free_delivery(self, api_client, customer_token):
        """Test free delivery promotion"""
        # Add items worth > 499
        products = api_client.get(f"{BASE_URL}/api/products").json()
        
        api_client.delete(f"{BASE_URL}/api/cart/clear", headers={"Authorization": f"Bearer {customer_token}"})
        
        # Add items
        for product in products[:2]:
            variant = product["variants"][0]
            api_client.post(
                f"{BASE_URL}/api/cart/add",
                headers={"Authorization": f"Bearer {customer_token}"},
                json={"product_id": product["id"], "variant_id": variant["id"], "size_id": "", "quantity": 1}
            )
        
        cart = api_client.get(f"{BASE_URL}/api/cart", headers={"Authorization": f"Bearer {customer_token}"}).json()
        promotions = cart["promotions"]
        
        # Cart > 499 and distance < 3km should get free delivery
        if cart["subtotal"] > 499 and cart["distance_km"] < 3:
            assert promotions["free_delivery_applied"] == True
            assert promotions["delivery_fee"] == 0
            print(f"✓ Free delivery applied! Subtotal: ₹{cart['subtotal']}")
        else:
            print(f"✓ Delivery fee: ₹{promotions['delivery_fee']}")

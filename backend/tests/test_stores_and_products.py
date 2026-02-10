"""Test stores and products with variants/sizes hierarchy"""
import pytest
import os

BASE_URL = os.environ['EXPO_PUBLIC_BACKEND_URL'].rstrip('/')

class TestStoresAndProducts:
    """Test store and product APIs"""
    
    def test_get_stores(self, api_client):
        """Test fetching all stores"""
        response = api_client.get(f"{BASE_URL}/api/stores")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # Seeded data has 3 stores
        # Check store structure
        store = data[0]
        assert "id" in store
        assert "name" in store
        assert "address" in store
        assert "is_open" in store
        assert "rating" in store
        print(f"✓ Fetched {len(data)} stores")

    def test_get_store_by_id(self, api_client):
        """Test fetching store by ID with products"""
        # First get a store ID
        stores = api_client.get(f"{BASE_URL}/api/stores").json()
        store_id = stores[0]["id"]
        
        response = api_client.get(f"{BASE_URL}/api/stores/{store_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == store_id
        assert "products" in data
        assert isinstance(data["products"], list)
        print(f"✓ Fetched store: {data['name']} with {len(data['products'])} products")

    def test_get_products(self, api_client):
        """Test fetching all products with variants and sizes"""
        response = api_client.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 6  # Seeded data has 6 products
        # Check product structure with hierarchy
        product = data[0]
        assert "id" in product
        assert "name" in product
        assert "variants" in product
        assert isinstance(product["variants"], list)
        if len(product["variants"]) > 0:
            variant = product["variants"][0]
            assert "id" in variant
            assert "price" in variant
            assert "sizes" in variant
            if len(variant["sizes"]) > 0:
                size = variant["sizes"][0]
                assert "id" in size
                assert "name" in size
                assert "price_modifier" in size
        print(f"✓ Fetched {len(data)} products with full hierarchy")

    def test_get_product_by_id(self, api_client):
        """Test fetching product by ID"""
        # First get a product ID
        products = api_client.get(f"{BASE_URL}/api/products").json()
        product_id = products[0]["id"]
        
        response = api_client.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == product_id
        assert "variants" in data
        print(f"✓ Fetched product: {data['name']}")

    def test_get_products_by_store(self, api_client):
        """Test filtering products by store"""
        # Get a store ID
        stores = api_client.get(f"{BASE_URL}/api/stores").json()
        store_id = stores[0]["id"]
        
        response = api_client.get(f"{BASE_URL}/api/products?store_id={store_id}")
        assert response.status_code == 200
        data = response.json()
        # Verify all products belong to the store
        for product in data:
            assert product["store_id"] == store_id
        print(f"✓ Filtered products by store: {len(data)} products")

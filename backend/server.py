from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os, logging, uuid, random, math
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'hyperlocal_delivery')]

app = FastAPI(title="Hyperlocal Delivery Platform")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

JWT_SECRET = os.environ.get('JWT_SECRET', 'hyperlocal-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72
BASE_DELIVERY_FEE = 30.0
PLATFORM_FEE_PERCENT = 5.0

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ======================== MODELS ========================

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    phone: str = ""
    roles: List[str] = ["customer"]
    license_no: str = ""
    vehicle_no: str = ""
    shop_name: str = ""
    shop_address: str = ""
    working_hours: str = ""
    join_whatsapp: bool = False

class UserLogin(BaseModel):
    email: str
    password: str

class SwitchRole(BaseModel):
    role: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    profile_photo: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    description: str = ""
    base_type: str = "food"
    store_id: str = ""
    image: str = ""

class VariantCreate(BaseModel):
    product_id: str
    name: str
    variant_type: str = "general"
    price: float = 0
    subscription_days: int = 0
    subscription_price: float = 0

class SizeCreate(BaseModel):
    variant_id: str
    name: str
    price_modifier: float = 0
    is_default: bool = False

class StoreCreate(BaseModel):
    name: str
    address: str = ""
    lat: float = 0
    lng: float = 0
    image: str = ""
    working_hours: str = "9:00 AM - 10:00 PM"

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    is_open: Optional[bool] = None
    working_hours: Optional[str] = None

class CartItemAdd(BaseModel):
    product_id: str
    variant_id: str
    size_id: str = ""
    quantity: int = 1

class CartItemUpdate(BaseModel):
    item_id: str
    quantity: int

class CheckoutRequest(BaseModel):
    delivery_address: str
    lat: float = 0
    lng: float = 0
    distance_km: float = 2.0

class OrderStatusUpdate(BaseModel):
    status: str

class OTPVerify(BaseModel):
    otp: str

class BannerCreate(BaseModel):
    title: str
    image_url: str
    link: str = ""
    position: int = 0

class PromotionCreate(BaseModel):
    name: str
    promo_type: str
    config: Dict[str, Any] = {}
    is_active: bool = True

class SettlementRequest(BaseModel):
    amount: float = 0

# ======================== AUTH HELPERS ========================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_role(user: dict, roles: List[str]):
    if user.get("active_role") not in roles and not any(r in user.get("roles", []) for r in roles):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

# ======================== AUTH ROUTES ========================

@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "phone": data.phone,
        "roles": data.roles,
        "active_role": data.roles[0] if data.roles else "customer",
        "profile_photo": "",
        "license_no": data.license_no,
        "vehicle_no": data.vehicle_no,
        "shop_name": data.shop_name,
        "shop_address": data.shop_address,
        "working_hours": data.working_hours,
        "join_whatsapp": data.join_whatsapp,
        "is_online": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    token = create_token(user_id)
    safe_user = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    return {"token": token, "user": safe_user}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"])
    safe_user = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    return {"token": token, "user": safe_user}

@api_router.get("/auth/me")
async def get_me(user=Depends(get_current_user)):
    safe_user = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    return safe_user

@api_router.put("/auth/switch-role")
async def switch_role(data: SwitchRole, user=Depends(get_current_user)):
    if data.role not in user.get("roles", []):
        raise HTTPException(status_code=400, detail="Role not available for this user")
    await db.users.update_one({"id": user["id"]}, {"$set": {"active_role": data.role}})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    safe_user = {k: v for k, v in updated.items() if k not in ("password_hash", "_id")}
    return safe_user

@api_router.put("/auth/profile")
async def update_profile(data: ProfileUpdate, user=Depends(get_current_user)):
    updates = {k: v for k, v in data.dict().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    safe_user = {k: v for k, v in updated.items() if k not in ("password_hash", "_id")}
    return safe_user

@api_router.put("/auth/toggle-online")
async def toggle_online(user=Depends(get_current_user)):
    new_status = not user.get("is_online", False)
    await db.users.update_one({"id": user["id"]}, {"$set": {"is_online": new_status}})
    return {"is_online": new_status}

# ======================== PRODUCT ROUTES ========================

@api_router.get("/products")
async def get_products(store_id: str = "", search: str = "", base_type: str = ""):
    query = {}
    if store_id:
        query["store_id"] = store_id
    if base_type:
        query["base_type"] = base_type
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    products = await db.products.find(query, {"_id": 0}).to_list(100)
    for p in products:
        p["variants"] = await db.variants.find({"product_id": p["id"]}, {"_id": 0}).to_list(50)
        for v in p["variants"]:
            v["sizes"] = await db.sizes.find({"variant_id": v["id"]}, {"_id": 0}).to_list(20)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product["variants"] = await db.variants.find({"product_id": product_id}, {"_id": 0}).to_list(50)
    for v in product["variants"]:
        v["sizes"] = await db.sizes.find({"variant_id": v["id"]}, {"_id": 0}).to_list(20)
    return product

@api_router.post("/products")
async def create_product(data: ProductCreate, user=Depends(get_current_user)):
    await require_role(user, ["merchant", "admin"])
    product = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "description": data.description,
        "base_type": data.base_type,
        "store_id": data.store_id,
        "merchant_id": user["id"],
        "image": data.image,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product)
    result = {k: v for k, v in product.items() if k != "_id"}
    return result

@api_router.post("/variants")
async def create_variant(data: VariantCreate, user=Depends(get_current_user)):
    await require_role(user, ["merchant", "admin"])
    variant = {
        "id": str(uuid.uuid4()),
        "product_id": data.product_id,
        "name": data.name,
        "variant_type": data.variant_type,
        "price": data.price,
        "subscription_days": data.subscription_days,
        "subscription_price": data.subscription_price,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.variants.insert_one(variant)
    result = {k: v for k, v in variant.items() if k != "_id"}
    return result

@api_router.post("/sizes")
async def create_size(data: SizeCreate, user=Depends(get_current_user)):
    await require_role(user, ["merchant", "admin"])
    size = {
        "id": str(uuid.uuid4()),
        "variant_id": data.variant_id,
        "name": data.name,
        "price_modifier": data.price_modifier,
        "is_default": data.is_default,
    }
    await db.sizes.insert_one(size)
    result = {k: v for k, v in size.items() if k != "_id"}
    return result

# ======================== STORE ROUTES ========================

@api_router.get("/stores")
async def get_stores(search: str = ""):
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    stores = await db.stores.find(query, {"_id": 0}).to_list(100)
    return stores

@api_router.get("/stores/{store_id}")
async def get_store(store_id: str):
    store = await db.stores.find_one({"id": store_id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    products = await db.products.find({"store_id": store_id}, {"_id": 0}).to_list(100)
    for p in products:
        p["variants"] = await db.variants.find({"product_id": p["id"]}, {"_id": 0}).to_list(50)
        for v in p["variants"]:
            v["sizes"] = await db.sizes.find({"variant_id": v["id"]}, {"_id": 0}).to_list(20)
    store["products"] = products
    return store

@api_router.post("/stores")
async def create_store(data: StoreCreate, user=Depends(get_current_user)):
    await require_role(user, ["merchant", "admin"])
    store = {
        "id": str(uuid.uuid4()),
        "merchant_id": user["id"],
        "name": data.name,
        "address": data.address,
        "lat": data.lat,
        "lng": data.lng,
        "image": data.image,
        "is_open": True,
        "working_hours": data.working_hours,
        "rating": 4.5,
        "total_orders": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.stores.insert_one(store)
    result = {k: v for k, v in store.items() if k != "_id"}
    return result

@api_router.put("/stores/{store_id}")
async def update_store(store_id: str, data: StoreUpdate, user=Depends(get_current_user)):
    await require_role(user, ["merchant", "admin"])
    updates = {k: v for k, v in data.dict().items() if v is not None}
    if updates:
        await db.stores.update_one({"id": store_id}, {"$set": updates})
    store = await db.stores.find_one({"id": store_id}, {"_id": 0})
    return store

# ======================== CART & PROMOTION ENGINE ========================

def calculate_promotions(subtotal: float, distance_km: float):
    """Core promotion engine logic"""
    promotions = {
        "gift_eligible": False,
        "gift_message": "",
        "upsell_message": "",
        "free_delivery_applied": False,
        "free_delivery_message": "",
        "delivery_fee": BASE_DELIVERY_FEE
    }
    # Gift with Purchase: IF Cart_Value > 1000 THEN auto add gift
    if subtotal > 1000:
        promotions["gift_eligible"] = True
        promotions["gift_message"] = "You've earned a FREE gift with your purchase!"
    # Upsell Nudge: IF Cart_Value < 1000 THEN show message
    elif subtotal > 0:
        remaining = 1000 - subtotal
        promotions["upsell_message"] = f"Add ₹{remaining:.0f} more to get a FREE gift!"
    # Dynamic Free Delivery Logic
    # Logic A: IF Cart > 499 AND Distance < 3km THEN Delivery_Fee = 0
    if subtotal > 499 and distance_km < 3:
        promotions["free_delivery_applied"] = True
        promotions["delivery_fee"] = 0
        promotions["free_delivery_message"] = "Free Delivery Applied!"
    # Logic B: IF Cart > 999 AND Distance < 5km THEN Delivery_Fee = 0
    elif subtotal > 999 and distance_km < 5:
        promotions["free_delivery_applied"] = True
        promotions["delivery_fee"] = 0
        promotions["free_delivery_message"] = "Free Delivery Applied!"
    else:
        # Calculate delivery fee based on distance
        promotions["delivery_fee"] = BASE_DELIVERY_FEE + max(0, (distance_km - 2) * 10)
        if subtotal > 499:
            remaining = 0
            if distance_km < 3:
                promotions["free_delivery_message"] = "Free Delivery Applied!"
                promotions["free_delivery_applied"] = True
                promotions["delivery_fee"] = 0
            else:
                needed = 1000 - subtotal if subtotal < 1000 else 0
                if needed > 0:
                    promotions["free_delivery_message"] = f"Add ₹{needed:.0f} for free delivery (within 5km)"
                elif distance_km >= 5:
                    promotions["free_delivery_message"] = "Free delivery not available for this distance"
        elif subtotal > 0:
            needed_499 = 499 - subtotal + 1
            promotions["free_delivery_message"] = f"Add ₹{needed_499:.0f} to get free delivery!"

    return promotions

@api_router.get("/cart")
async def get_cart(user=Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart:
        cart = {"user_id": user["id"], "items": [], "distance_km": 2.0}
    subtotal = 0
    enriched_items = []
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        variant = await db.variants.find_one({"id": item["variant_id"]}, {"_id": 0})
        size = None
        if item.get("size_id"):
            size = await db.sizes.find_one({"id": item["size_id"]}, {"_id": 0})
        price = (variant["price"] if variant else 0) + (size["price_modifier"] if size else 0)
        item_total = price * item["quantity"]
        subtotal += item_total
        enriched_items.append({
            "item_id": item["item_id"],
            "product_id": item["product_id"],
            "variant_id": item["variant_id"],
            "size_id": item.get("size_id", ""),
            "quantity": item["quantity"],
            "product_name": product["name"] if product else "Unknown",
            "product_image": product.get("image", "") if product else "",
            "variant_name": variant["name"] if variant else "Unknown",
            "size_name": size["name"] if size else "",
            "price": price,
            "item_total": item_total
        })
    distance_km = cart.get("distance_km", 2.0)
    promotions = calculate_promotions(subtotal, distance_km)
    return {
        "items": enriched_items,
        "subtotal": subtotal,
        "delivery_fee": promotions["delivery_fee"],
        "total": subtotal + promotions["delivery_fee"],
        "distance_km": distance_km,
        "promotions": promotions,
        "store_id": cart.get("store_id", "")
    }

@api_router.post("/cart/add")
async def add_to_cart(data: CartItemAdd, user=Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    product = await db.products.find_one({"id": data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not cart:
        cart = {"user_id": user["id"], "items": [], "store_id": product.get("store_id", ""), "distance_km": 2.0}
        await db.carts.insert_one(cart)
    # Check if adding from different store
    if cart.get("store_id") and cart["store_id"] != product.get("store_id", "") and len(cart.get("items", [])) > 0:
        # Clear cart for new store
        await db.carts.update_one(
            {"user_id": user["id"]},
            {"$set": {"items": [], "store_id": product.get("store_id", "")}}
        )
        cart["items"] = []
    new_item = {
        "item_id": str(uuid.uuid4()),
        "product_id": data.product_id,
        "variant_id": data.variant_id,
        "size_id": data.size_id,
        "quantity": data.quantity
    }
    # Check if same product/variant/size exists
    existing_idx = None
    for i, item in enumerate(cart.get("items", [])):
        if (item["product_id"] == data.product_id and
            item["variant_id"] == data.variant_id and
            item.get("size_id", "") == data.size_id):
            existing_idx = i
            break
    if existing_idx is not None:
        cart["items"][existing_idx]["quantity"] += data.quantity
    else:
        cart["items"].append(new_item)
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$set": {"items": cart["items"], "store_id": product.get("store_id", "")}},
        upsert=True
    )
    return {"message": "Added to cart", "item_count": len(cart["items"])}

@api_router.put("/cart/update")
async def update_cart_item(data: CartItemUpdate, user=Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    items = cart.get("items", [])
    for i, item in enumerate(items):
        if item["item_id"] == data.item_id:
            if data.quantity <= 0:
                items.pop(i)
            else:
                items[i]["quantity"] = data.quantity
            break
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": items}})
    return {"message": "Cart updated"}

@api_router.delete("/cart/clear")
async def clear_cart(user=Depends(get_current_user)):
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": []}})
    return {"message": "Cart cleared"}

# ======================== ORDER ROUTES ========================

@api_router.post("/orders")
async def create_order(data: CheckoutRequest, user=Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    # Calculate totals
    subtotal = 0
    order_items = []
    for item in cart["items"]:
        variant = await db.variants.find_one({"id": item["variant_id"]}, {"_id": 0})
        size = await db.sizes.find_one({"id": item.get("size_id")}, {"_id": 0}) if item.get("size_id") else None
        price = (variant["price"] if variant else 0) + (size["price_modifier"] if size else 0)
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        subtotal += price * item["quantity"]
        order_items.append({
            "product_id": item["product_id"],
            "variant_id": item["variant_id"],
            "size_id": item.get("size_id", ""),
            "quantity": item["quantity"],
            "price": price,
            "product_name": product["name"] if product else "Unknown",
            "variant_name": variant["name"] if variant else "Unknown",
            "size_name": size["name"] if size else ""
        })
    promotions = calculate_promotions(subtotal, data.distance_km)
    otp = str(random.randint(1000, 9999))
    store = await db.stores.find_one({"id": cart.get("store_id", "")}, {"_id": 0})
    order = {
        "id": str(uuid.uuid4()),
        "order_number": f"ORD-{random.randint(10000, 99999)}",
        "user_id": user["id"],
        "user_name": user["name"],
        "store_id": cart.get("store_id", ""),
        "store_name": store["name"] if store else "",
        "merchant_id": store["merchant_id"] if store else "",
        "agent_id": "",
        "agent_name": "",
        "items": order_items,
        "subtotal": subtotal,
        "delivery_fee": promotions["delivery_fee"],
        "platform_fee": round(subtotal * PLATFORM_FEE_PERCENT / 100, 2),
        "total": subtotal + promotions["delivery_fee"],
        "status": "placed",
        "otp": otp,
        "delivery_address": data.delivery_address,
        "lat": data.lat,
        "lng": data.lng,
        "distance_km": data.distance_km,
        "promotions_applied": promotions,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order)
    # Clear cart
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": []}})
    # Update store total orders
    if store:
        await db.stores.update_one({"id": store["id"]}, {"$inc": {"total_orders": 1}})
    result = {k: v for k, v in order.items() if k != "_id"}
    return result

@api_router.get("/orders")
async def get_orders(status: str = "", user=Depends(get_current_user)):
    role = user.get("active_role", "customer")
    query = {}
    if role == "customer":
        query["user_id"] = user["id"]
    elif role == "merchant":
        query["merchant_id"] = user["id"]
    elif role == "agent":
        query["agent_id"] = user["id"]
    if status:
        query["status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/available")
async def get_available_orders(user=Depends(get_current_user)):
    """Get orders available for agent pickup (accepted by merchant, no agent assigned)"""
    orders = await db.orders.find(
        {"status": "accepted", "agent_id": ""},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user=Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, user=Depends(get_current_user)):
    valid_transitions = {
        "placed": ["accepted", "cancelled"],
        "accepted": ["preparing", "cancelled"],
        "preparing": ["ready_for_pickup"],
        "ready_for_pickup": ["picked_up"],
        "picked_up": ["delivered"],
        "assigned": ["preparing", "cancelled"],
    }
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    current = order["status"]
    if data.status not in valid_transitions.get(current, []):
        raise HTTPException(status_code=400, detail=f"Cannot transition from {current} to {data.status}")
    updates = {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.orders.update_one({"id": order_id}, {"$set": updates})
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return updated

@api_router.put("/orders/{order_id}/accept")
async def merchant_accept_order(order_id: str, user=Depends(get_current_user)):
    await require_role(user, ["merchant", "admin"])
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] != "placed":
        raise HTTPException(status_code=400, detail="Order cannot be accepted")
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "accepted", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return await db.orders.find_one({"id": order_id}, {"_id": 0})

@api_router.put("/orders/{order_id}/assign")
async def agent_accept_order(order_id: str, user=Depends(get_current_user)):
    await require_role(user, ["agent", "admin"])
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["status"] != "accepted":
        raise HTTPException(status_code=400, detail="Order not available for assignment")
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "agent_id": user["id"],
            "agent_name": user["name"],
            "status": "assigned",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return await db.orders.find_one({"id": order_id}, {"_id": 0})

@api_router.put("/orders/{order_id}/verify-otp")
async def verify_delivery_otp(order_id: str, data: OTPVerify, user=Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "delivered", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Delivery confirmed", "status": "delivered"}

# ======================== BANNER ROUTES ========================

@api_router.get("/banners")
async def get_banners():
    banners = await db.banners.find({"is_active": True}, {"_id": 0}).sort("position", 1).to_list(20)
    return banners

@api_router.post("/banners")
async def create_banner(data: BannerCreate, user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    banner = {
        "id": str(uuid.uuid4()),
        "title": data.title,
        "image_url": data.image_url,
        "link": data.link,
        "position": data.position,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.banners.insert_one(banner)
    result = {k: v for k, v in banner.items() if k != "_id"}
    return result

# ======================== DASHBOARD & STATS ========================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user=Depends(get_current_user)):
    role = user.get("active_role", "customer")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()[:10]
    today = datetime.now(timezone.utc).isoformat()[:10]
    stats = {}

    if role == "admin":
        total_orders = await db.orders.count_documents({})
        delivered = await db.orders.count_documents({"status": "delivered"})
        cancelled = await db.orders.count_documents({"status": "cancelled"})
        all_delivered = await db.orders.find({"status": "delivered"}, {"_id": 0}).to_list(1000)
        total_earnings = sum(o.get("total", 0) for o in all_delivered)
        total_merchants = await db.users.count_documents({"roles": "merchant"})
        total_agents = await db.users.count_documents({"roles": "agent"})
        total_customers = await db.users.count_documents({"roles": "customer"})
        stats = {
            "total_orders": total_orders,
            "delivered": delivered,
            "cancelled": cancelled,
            "total_earnings": total_earnings,
            "total_merchants": total_merchants,
            "total_agents": total_agents,
            "total_customers": total_customers,
            "platform_fees": round(total_earnings * PLATFORM_FEE_PERCENT / 100, 2)
        }
    elif role == "merchant":
        my_orders = await db.orders.find({"merchant_id": user["id"]}, {"_id": 0}).to_list(1000)
        delivered = [o for o in my_orders if o["status"] == "delivered"]
        cancelled = [o for o in my_orders if o["status"] == "cancelled"]
        total_revenue = sum(o.get("subtotal", 0) for o in delivered)
        stats = {
            "total_orders": len(my_orders),
            "delivered": len(delivered),
            "cancelled": len(cancelled),
            "total_revenue": total_revenue,
            "pending_orders": len([o for o in my_orders if o["status"] in ("placed", "accepted", "preparing")])
        }
    elif role == "agent":
        my_orders = await db.orders.find({"agent_id": user["id"]}, {"_id": 0}).to_list(1000)
        delivered = [o for o in my_orders if o["status"] == "delivered"]
        total_earnings = sum(o.get("delivery_fee", 0) for o in delivered)
        stats = {
            "total_deliveries": len(delivered),
            "total_earnings": total_earnings,
            "active_orders": len([o for o in my_orders if o["status"] in ("assigned", "picked_up")]),
            "pending_settlement": total_earnings
        }
    else:
        my_orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
        stats = {
            "total_orders": len(my_orders),
            "active_orders": len([o for o in my_orders if o["status"] not in ("delivered", "cancelled")]),
            "total_spent": sum(o.get("total", 0) for o in my_orders if o["status"] == "delivered")
        }
    return stats

# ======================== SETTLEMENT ROUTES ========================

@api_router.get("/settlements")
async def get_settlements(user=Depends(get_current_user)):
    role = user.get("active_role", "customer")
    if role == "admin":
        settlements = await db.settlements.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    else:
        settlements = await db.settlements.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return settlements

@api_router.post("/settlements/request")
async def request_settlement(data: SettlementRequest, user=Depends(get_current_user)):
    settlement = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_name": user["name"],
        "role": user.get("active_role", ""),
        "amount": data.amount,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.settlements.insert_one(settlement)
    result = {k: v for k, v in settlement.items() if k != "_id"}
    return result

@api_router.put("/settlements/{settlement_id}/settle")
async def settle_payment(settlement_id: str, user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    await db.settlements.update_one(
        {"id": settlement_id},
        {"$set": {"status": "settled", "settled_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Settlement completed"}

# ======================== PROMOTIONS ========================

@api_router.get("/promotions")
async def get_promotions():
    promos = await db.promotions.find({"is_active": True}, {"_id": 0}).to_list(50)
    return promos

# ======================== SEARCH ========================

@api_router.get("/search")
async def search_all(q: str = ""):
    if not q:
        return {"stores": [], "products": []}
    stores = await db.stores.find(
        {"name": {"$regex": q, "$options": "i"}}, {"_id": 0}
    ).to_list(20)
    products = await db.products.find(
        {"$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]}, {"_id": 0}
    ).to_list(20)
    return {"stores": stores, "products": products}

# ======================== CMS ========================

@api_router.get("/cms")
async def get_cms():
    cms = await db.cms.find({}, {"_id": 0}).to_list(50)
    return {item["key"]: item["value"] for item in cms}

@api_router.put("/cms/{key}")
async def update_cms(key: str, value: Dict[str, Any], user=Depends(get_current_user)):
    await require_role(user, ["admin"])
    await db.cms.update_one({"key": key}, {"$set": {"value": value}}, upsert=True)
    return {"message": "Updated"}

# ======================== SEED DATA ========================

async def seed_data():
    user_count = await db.users.count_documents({})
    if user_count > 0:
        logger.info("Database already seeded")
        return

    logger.info("Seeding database...")

    # Create Admin
    admin_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": admin_id, "name": "Platform Admin", "email": "admin@delivery.com",
        "password_hash": hash_password("admin123"), "phone": "9999900000",
        "roles": ["admin", "customer"], "active_role": "admin",
        "profile_photo": "", "license_no": "", "vehicle_no": "",
        "shop_name": "", "shop_address": "", "working_hours": "",
        "join_whatsapp": False, "is_online": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # Create Merchant
    merchant_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": merchant_id, "name": "Fresh Foods Kitchen", "email": "merchant@delivery.com",
        "password_hash": hash_password("merchant123"), "phone": "9999900001",
        "roles": ["merchant", "customer"], "active_role": "merchant",
        "profile_photo": "", "license_no": "", "vehicle_no": "",
        "shop_name": "Fresh Foods Kitchen", "shop_address": "123 Main St, Downtown",
        "working_hours": "9:00 AM - 10:00 PM",
        "join_whatsapp": True, "is_online": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # Create Agent
    agent_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": agent_id, "name": "Raj Kumar", "email": "agent@delivery.com",
        "password_hash": hash_password("agent123"), "phone": "9999900002",
        "roles": ["agent", "customer"], "active_role": "agent",
        "profile_photo": "", "license_no": "DL-1234567", "vehicle_no": "KA-01-AB-1234",
        "shop_name": "", "shop_address": "", "working_hours": "",
        "join_whatsapp": True, "is_online": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # Create Customer
    customer_id = str(uuid.uuid4())
    await db.users.insert_one({
        "id": customer_id, "name": "Priya Sharma", "email": "customer@delivery.com",
        "password_hash": hash_password("customer123"), "phone": "9999900003",
        "roles": ["customer"], "active_role": "customer",
        "profile_photo": "", "license_no": "", "vehicle_no": "",
        "shop_name": "", "shop_address": "", "working_hours": "",
        "join_whatsapp": False, "is_online": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    # Create Stores
    store1_id = str(uuid.uuid4())
    store2_id = str(uuid.uuid4())
    store3_id = str(uuid.uuid4())
    stores = [
        {"id": store1_id, "merchant_id": merchant_id, "name": "Fresh Foods Kitchen",
         "address": "123 Main St, Downtown", "lat": 12.9716, "lng": 77.5946,
         "image": "https://images.unsplash.com/photo-1678213721629-265bba6c124b?w=400",
         "is_open": True, "working_hours": "9:00 AM - 10:00 PM", "rating": 4.5, "total_orders": 156,
         "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": store2_id, "merchant_id": merchant_id, "name": "Green Basket Grocery",
         "address": "456 Park Ave, Midtown", "lat": 12.9750, "lng": 77.5980,
         "image": "https://images.unsplash.com/photo-1634114042751-527be6421f41?w=400",
         "is_open": True, "working_hours": "8:00 AM - 9:00 PM", "rating": 4.2, "total_orders": 89,
         "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": store3_id, "merchant_id": merchant_id, "name": "Sushi Express",
         "address": "789 Oak Blvd, Uptown", "lat": 12.9800, "lng": 77.6000,
         "image": "https://images.unsplash.com/photo-1718283123704-493455f251aa?w=400",
         "is_open": True, "working_hours": "11:00 AM - 11:00 PM", "rating": 4.8, "total_orders": 234,
         "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.stores.insert_many(stores)

    # Create Products with Variants and Sizes
    products_data = [
        {"name": "Classic Burger", "desc": "Juicy beef patty with fresh lettuce, tomato & cheese", "type": "food",
         "store": store1_id, "img": "https://images.unsplash.com/photo-1530554764233-e79e16c91d08?w=400",
         "variants": [
             {"name": "Regular", "type": "general", "price": 249,
              "sizes": [{"name": "Single", "mod": 0}, {"name": "Double", "mod": 100}, {"name": "Triple", "mod": 180}]},
             {"name": "Weekly Meal Plan", "type": "subscription", "price": 199, "sub_days": 7, "sub_price": 1299,
              "sizes": [{"name": "Small", "mod": 0}, {"name": "Large", "mod": 80}]}
         ]},
        {"name": "Margherita Pizza", "desc": "Classic pizza with mozzarella, basil & tomato sauce", "type": "food",
         "store": store1_id, "img": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
         "variants": [
             {"name": "Classic", "type": "general", "price": 299,
              "sizes": [{"name": "Medium", "mod": 0}, {"name": "Large", "mod": 150}, {"name": "Family", "mod": 300}]},
         ]},
        {"name": "Caesar Salad", "desc": "Fresh romaine lettuce with parmesan & croutons", "type": "food",
         "store": store1_id, "img": "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400",
         "variants": [
             {"name": "Regular", "type": "general", "price": 199,
              "sizes": [{"name": "Small", "mod": 0}, {"name": "Large", "mod": 80}]},
         ]},
        {"name": "Fresh Organic Vegetables", "desc": "Seasonal organic vegetable box", "type": "grocery",
         "store": store2_id, "img": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400",
         "variants": [
             {"name": "Standard Box", "type": "general", "price": 399,
              "sizes": [{"name": "Small (2kg)", "mod": 0}, {"name": "Medium (4kg)", "mod": 200}, {"name": "Large (6kg)", "mod": 350}]},
             {"name": "Weekly Subscription", "type": "subscription", "price": 349, "sub_days": 7, "sub_price": 2199,
              "sizes": [{"name": "Family", "mod": 0}, {"name": "Bulk", "mod": 500}]}
         ]},
        {"name": "Salmon Sushi Platter", "desc": "Premium salmon sushi with wasabi & ginger", "type": "food",
         "store": store3_id, "img": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400",
         "variants": [
             {"name": "Chef Special", "type": "general", "price": 599,
              "sizes": [{"name": "8 Pieces", "mod": 0}, {"name": "12 Pieces", "mod": 250}, {"name": "16 Pieces", "mod": 450}]},
         ]},
        {"name": "Miso Ramen", "desc": "Rich miso broth with noodles, egg & pork belly", "type": "food",
         "store": store3_id, "img": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
         "variants": [
             {"name": "Regular", "type": "general", "price": 349,
              "sizes": [{"name": "Regular", "mod": 0}, {"name": "Large", "mod": 100}]},
         ]},
    ]

    for pd in products_data:
        product_id = str(uuid.uuid4())
        await db.products.insert_one({
            "id": product_id, "name": pd["name"], "description": pd["desc"],
            "base_type": pd["type"], "store_id": pd["store"], "merchant_id": merchant_id,
            "image": pd["img"], "created_at": datetime.now(timezone.utc).isoformat()
        })
        for vd in pd["variants"]:
            variant_id = str(uuid.uuid4())
            await db.variants.insert_one({
                "id": variant_id, "product_id": product_id, "name": vd["name"],
                "variant_type": vd["type"], "price": vd["price"],
                "subscription_days": vd.get("sub_days", 0),
                "subscription_price": vd.get("sub_price", 0),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            for sd in vd["sizes"]:
                await db.sizes.insert_one({
                    "id": str(uuid.uuid4()), "variant_id": variant_id,
                    "name": sd["name"], "price_modifier": sd["mod"],
                    "is_default": sd["mod"] == 0
                })

    # Create Banners
    banners = [
        {"id": str(uuid.uuid4()), "title": "Fresh Deals Today!", "image_url": "https://images.unsplash.com/photo-1530554764233-e79e16c91d08?w=800",
         "link": "", "position": 0, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Organic & Fresh", "image_url": "https://images.unsplash.com/photo-1634114042751-527be6421f41?w=800",
         "link": "", "position": 1, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.banners.insert_many(banners)

    # Create CMS entries
    cms_entries = [
        {"key": "whatsapp_link", "value": "https://chat.whatsapp.com/example"},
        {"key": "social_links", "value": {"facebook": "https://facebook.com", "youtube": "https://youtube.com", "instagram": "https://instagram.com"}},
        {"key": "platform_name", "value": "QuickDrop"},
    ]
    for entry in cms_entries:
        await db.cms.insert_one(entry)

    # Create default promotions
    promos = [
        {"id": str(uuid.uuid4()), "name": "Gift with Purchase", "promo_type": "gift",
         "config": {"min_cart_value": 1000, "gift_message": "Free gift with orders over ₹1000!"},
         "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Free Delivery - Near", "promo_type": "free_delivery",
         "config": {"min_cart_value": 499, "max_distance_km": 3},
         "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Free Delivery - Far", "promo_type": "free_delivery",
         "config": {"min_cart_value": 999, "max_distance_km": 5},
         "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    await db.promotions.insert_many(promos)

    logger.info("Database seeded successfully!")

# ======================== APP SETUP ========================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await seed_data()

@app.on_event("shutdown")
async def shutdown():
    client.close()

# QuickDrop - Hyperlocal Delivery Platform

## Overview
QuickDrop is a comprehensive hyper-local delivery platform serving four user roles: **Customer**, **Merchant**, **Delivery Agent**, and **Admin**. The platform enables customers to browse stores, order products with a sophisticated promotion engine, and track deliveries with OTP verification.

## Tech Stack
- **Backend**: FastAPI (Python) + MongoDB
- **Frontend**: Expo React Native (iOS/Android/Web)
- **Auth**: JWT-based custom authentication
- **Database**: MongoDB with seeded demo data

## Core Features

### Product Architecture
- **Product** → **Variant** (General / Subscription) → **Size** hierarchy
- 6 seeded products across 3 stores with multiple variants and sizes
- Support for both general and subscription-based variants

### Promotion Engine (Cart Logic)
- **Gift with Purchase**: Auto-gift when Cart > ₹1000
- **Upsell Nudge**: "Add ₹X to get a free gift!" when Cart < ₹1000
- **Dynamic Free Delivery**:
  - Cart > ₹499 & Distance < 3km → Free Delivery
  - Cart > ₹999 & Distance < 5km → Free Delivery

### User Roles & Registration
- Single user table with role flags
- Role-based registration with conditional fields:
  - Agent: License #, Vehicle #
  - Merchant: Shop Name, Address, Working Hours
- WhatsApp community checkbox
- Role switching without logout

### Order Flow
1. Customer places order → **Placed**
2. Merchant accepts → **Accepted**
3. Merchant prepares → **Preparing**
4. Ready for pickup → **Ready for Pickup**
5. Agent picks up → **Picked Up**
6. OTP verification → **Delivered**

### Customer Features
- Home with banners, store listings, popular items
- Store detail with full menu
- Product detail with variant/size selection
- Cart with real-time promotion calculations
- Order tracking with OTP display
- Search (stores & items)

### Merchant Features
- Revenue dashboard with order stats
- Order management (Accept/Cancel, status updates)
- Store control (Open/Closed toggle)
- Settlement requests

### Agent Features
- Dark theme dashboard with earnings
- Online/Offline toggle
- Available order alerts
- Order assignment
- OTP-based delivery verification
- Settlement requests

### Admin Features
- Platform overview dashboard
- Product management
- Settlement management (Settle/Pay)
- User & order statistics

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Customer | customer@delivery.com | customer123 |
| Merchant | merchant@delivery.com | merchant123 |
| Agent | agent@delivery.com | agent123 |
| Admin | admin@delivery.com | admin123 |

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- PUT /api/auth/switch-role
- PUT /api/auth/profile
- PUT /api/auth/toggle-online

### Products & Stores
- GET /api/products, GET /api/products/{id}
- POST /api/products, POST /api/variants, POST /api/sizes
- GET /api/stores, GET /api/stores/{id}
- POST /api/stores, PUT /api/stores/{id}

### Cart & Orders
- GET /api/cart, POST /api/cart/add, PUT /api/cart/update
- POST /api/orders (checkout), GET /api/orders
- PUT /api/orders/{id}/accept, PUT /api/orders/{id}/assign
- PUT /api/orders/{id}/status, PUT /api/orders/{id}/verify-otp

### Dashboard & Admin
- GET /api/dashboard/stats
- GET /api/settlements, POST /api/settlements/request
- GET /api/banners, GET /api/search, GET /api/cms

## Mocked Features
- **Distance Calculation**: Defaults to 2km (no Google Maps integration)
- **Push Notifications**: Not implemented (mock only)
- **Live Tracking**: Status-based tracking (no real-time GPS)

## Future Enhancements
- Google Maps API integration for real routing/distance
- Firebase push notifications
- Real-time order tracking with WebSockets
- CSV bulk product import
- Payment gateway integration (Stripe/Razorpay)
- Subscription management with recurring billing
- Route optimization (Traveling Salesman) for multi-order delivery

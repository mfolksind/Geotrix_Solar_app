# Geotrix Backend API Documentation

This file now documents the APIs one by one with a request body example and a sample response example for each endpoint.

## Base URL
- Local development: http://localhost:5000
- Most APIs are exposed under /api/*
- Auth routes are also available under /auth
- Admin routes are exposed under /admin/*

## Common Auth Rule
- Protected routes require a Bearer token in the Authorization header.
- Example: Authorization: Bearer <access_token>

## 1. Authentication APIs

### 1) POST /api/auth/register
- Auth: No
- Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "phone": "+880123456789"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5f6",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "isVerified": false
  },
  "errors": []
}
```
- DB: User

### 2) POST /api/auth/register_admin
- Auth: No
- Request body:
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "secret123",
  "phone": "+880123456789",
  "adminKey": "super-secret"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5f7",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  "errors": []
}
```
- DB: User

### 3) POST /api/auth/login
- Auth: No
- Request body:
```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64f2d9b6f8c2a1b2c3d4e5f6",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  },
  "errors": []
}
```
- DB: User

### 4) POST /api/auth/google
- Auth: No
- Request body:
```json
{
  "idToken": "google-id-token"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Google login successful",
  "data": {
    "user": {
      "id": "64f2d9b6f8c2a1b2c3d4e5f8",
      "email": "googleuser@example.com",
      "provider": "google"
    },
    "accessToken": "eyJhbGciOi..."
  },
  "errors": []
}
```
- DB: User

### 5) POST /api/auth/refresh
- Auth: No
- Request body:
```json
{
  "refreshToken": "refresh-token-here"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "new-access-token"
  },
  "errors": []
}
```
- DB: RefreshToken

### 6) POST /api/auth/logout
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null,
  "errors": []
}
```
- DB: RefreshToken

### 7) POST /api/auth/forgot-password
- Auth: No
- Request body:
```json
{
  "email": "john@example.com"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Password reset link sent",
  "data": null,
  "errors": []
}
```
- DB: PasswordResetToken

### 8) POST /api/auth/reset-password
- Auth: No
- Request body:
```json
{
  "token": "reset-token",
  "password": "newpassword123"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Password reset successful",
  "data": null,
  "errors": []
}
```
- DB: PasswordResetToken

### 9) POST /api/auth/verify-email
- Auth: No
- Request body:
```json
{
  "token": "verification-token"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": null,
  "errors": []
}
```
- DB: EmailVerificationToken

### 10) POST /api/auth/resend-verification
- Auth: No
- Request body:
```json
{
  "email": "john@example.com"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Verification email resent",
  "data": null,
  "errors": []
}
```
- DB: EmailVerificationToken

## 2. User APIs

### 11) GET /api/users/me
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5f6",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "status": "active"
  },
  "errors": []
}
```
- DB: User

### 12) PUT /api/users/me
- Auth: Yes
- Request body:
```json
{
  "name": "John Updated",
  "phone": "+880111111111",
  "profilePicture": "https://example.com/avatar.jpg"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5f6",
    "name": "John Updated",
    "phone": "+880111111111"
  },
  "errors": []
}
```
- DB: User

### 13) GET /api/users/customers
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e5f6",
      "name": "John Doe",
      "role": "customer"
    }
  ],
  "errors": []
}
```
- DB: User

### 14) GET /api/users/admins
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e5f7",
      "name": "Admin User",
      "role": "admin"
    }
  ],
  "errors": []
}
```
- DB: User

### 15) GET /api/users/:id
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5f6",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "errors": []
}
```
- DB: User

### 16) PATCH /api/users/:id/status
- Auth: No
- Request body:
```json
{
  "status": "blocked"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "User status updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5f6",
    "status": "blocked"
  },
  "errors": []
}
```
- DB: User

### 17) DELETE /api/users/:id
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": null,
  "errors": []
}
```
- DB: User

## 3. Category APIs

### 18) POST /api/categories
- Auth: Admin only
- Request body:
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic products",
  "image": "https://example.com/category.jpg",
  "sortOrder": 1
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Category created",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5f9",
    "name": "Electronics",
    "slug": "electronics"
  },
  "errors": []
}
```
- DB: Category

### 19) GET /api/categories
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e5f9",
      "name": "Electronics"
    }
  ],
  "errors": []
}
```
- DB: Category

### 20) GET /api/categories/:id
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5f9",
    "name": "Electronics"
  },
  "errors": []
}
```
- DB: Category

### 21) PATCH /api/categories/:id
- Auth: Admin only
- Request body:
```json
{
  "name": "Home Appliances"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Category updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5f9",
    "name": "Home Appliances"
  },
  "errors": []
}
```
- DB: Category

### 22) PATCH /api/categories/:id/status
- Auth: Admin only
- Request body:
```json
{
  "status": "ACTIVE"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Category status updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5f9",
    "status": "ACTIVE"
  },
  "errors": []
}
```
- DB: Category

### 23) DELETE /api/categories/:id
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": null,
  "errors": []
}
```
- DB: Category

## 4. Product APIs

### 24) POST /api/products
- Auth: Admin only
- Request body:
```json
{
  "name": "Smartphone",
  "slug": "smartphone",
  "price": 699,
  "description": "Latest smartphone",
  "category": "electronics",
  "brand": "BrandX",
  "thumbnail": "https://example.com/product.jpg",
  "status": "ACTIVE"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Product created",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fa",
    "name": "Smartphone",
    "price": 699
  },
  "errors": []
}
```
- DB: Product

### 25) GET /api/products
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": "64f2d9b6f8c2a1b2c3d4e5fa",
        "name": "Smartphone"
      }
    ],
    "page": 1,
    "limit": 10,
    "total": 1
  },
  "errors": []
}
```
- DB: Product

### 26) GET /api/products/:id
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fa",
    "name": "Smartphone",
    "price": 699
  },
  "errors": []
}
```
- DB: Product

### 27) PATCH /api/products/:id
- Auth: Admin only
- Request body:
```json
{
  "price": 649
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Product updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fa",
    "price": 649
  },
  "errors": []
}
```
- DB: Product

### 28) DELETE /api/products/:id
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": null,
  "errors": []
}
```
- DB: Product

### 29) POST /api/products/:productId/variants
- Auth: Admin only
- Request body:
```json
{
  "variantName": "128GB",
  "price": 699,
  "stock": 20,
  "status": "ACTIVE"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Variant created",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fb",
    "variantName": "128GB",
    "price": 699
  },
  "errors": []
}
```
- DB: ProductVariant

### 30) PATCH /api/products/variants/:id
- Auth: Admin only
- Request body:
```json
{
  "stock": 15
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Variant updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fb",
    "stock": 15
  },
  "errors": []
}
```
- DB: ProductVariant

### 31) DELETE /api/products/variants/:id
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Variant deleted",
  "data": null,
  "errors": []
}
```
- DB: ProductVariant

### 32) POST /api/products/variants/:id/images
- Auth: Admin only
- Request body:
```json
{
  "url": "https://example.com/image.jpg",
  "publicId": "img-001",
  "isPrimary": true,
  "sortOrder": 1
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Image uploaded",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fc",
    "url": "https://example.com/image.jpg"
  },
  "errors": []
}
```
- DB: ProductImage

### 33) DELETE /api/products/images/:id
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Image deleted",
  "data": null,
  "errors": []
}
```
- DB: ProductImage

## 5. Address APIs

### 34) POST /api/addresses
- Auth: Yes
- Request body:
```json
{
  "fullName": "John Doe",
  "phone": "+880123456789",
  "addressLine1": "House 12, Road 3",
  "city": "Dhaka",
  "state": "Dhaka",
  "country": "Bangladesh",
  "postalCode": "1207",
  "isDefault": true
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Address created",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fd",
    "fullName": "John Doe",
    "city": "Dhaka"
  },
  "errors": []
}
```
- DB: Address

### 35) GET /api/addresses
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e5fd",
      "fullName": "John Doe"
    }
  ],
  "errors": []
}
```
- DB: Address

### 36) GET /api/addresses/:id
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fd",
    "fullName": "John Doe"
  },
  "errors": []
}
```
- DB: Address

### 37) PATCH /api/addresses/:id
- Auth: Yes
- Request body:
```json
{
  "addressLine1": "House 20, Road 7"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Address updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fd",
    "addressLine1": "House 20, Road 7"
  },
  "errors": []
}
```
- DB: Address

### 38) PATCH /api/addresses/:id/default
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Default address updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fd",
    "isDefault": true
  },
  "errors": []
}
```
- DB: Address

### 39) DELETE /api/addresses/:id
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Address deleted successfully",
  "data": null,
  "errors": []
}
```
- DB: Address

## 6. Cart APIs

### 40) POST /api/carts/items
- Auth: Yes
- Request body:
```json
{
  "productId": "64f2d9b6f8c2a1b2c3d4e5fa",
  "variantId": "64f2d9b6f8c2a1b2c3d4e5fb",
  "quantity": 2
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Item added to cart",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fe",
    "productId": "64f2d9b6f8c2a1b2c3d4e5fa",
    "quantity": 2
  },
  "errors": []
}
```
- DB: Cart, CartItem

### 41) GET /api/carts
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5ff",
    "items": []
  },
  "errors": []
}
```
- DB: Cart

### 42) PATCH /api/carts/items/:itemId
- Auth: Yes
- Request body:
```json
{
  "quantity": 3
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Cart item updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fe",
    "quantity": 3
  },
  "errors": []
}
```
- DB: CartItem

### 43) DELETE /api/carts/items/:itemId
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Cart item removed",
  "data": null,
  "errors": []
}
```
- DB: CartItem

### 44) DELETE /api/carts
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Cart cleared",
  "data": null,
  "errors": []
}
```
- DB: Cart

## 7. Order APIs

### 45) POST /api/orders
- Auth: Yes
- Request body:
```json
{
  "addressId": "64f2d9b6f8c2a1b2c3d4e5fd",
  "notes": "Please deliver before evening"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Order created",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e600",
    "status": "PENDING",
    "addressId": "64f2d9b6f8c2a1b2c3d4e5fd"
  },
  "errors": []
}
```
- DB: Order, OrderItem

### 46) GET /api/orders
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e600",
      "status": "PENDING"
    }
  ],
  "errors": []
}
```
- DB: Order

### 47) GET /api/orders/:id
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e600",
    "status": "PENDING"
  },
  "errors": []
}
```
- DB: Order

### 48) PATCH /api/orders/:id/status
- Auth: Yes
- Request body:
```json
{
  "status": "CONFIRMED"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e600",
    "status": "CONFIRMED"
  },
  "errors": []
}
```
- DB: Order

### 49) PATCH /api/orders/:id/cancel
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Order cancelled",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e600",
    "status": "CANCELLED"
  },
  "errors": []
}
```
- DB: Order

## 8. Payment APIs

### 50) POST /api/payments/create
- Auth: No
- Request body:
```json
{
  "orderId": "64f2d9b6f8c2a1b2c3d4e600",
  "paymentMethod": "RAZORPAY",
  "amount": 699,
  "currency": "INR"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Payment initiated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e601",
    "status": "PENDING"
  },
  "errors": []
}
```
- DB: Payment

### 51) POST /api/payments/verify
- Auth: No
- Request body:
```json
{
  "transactionId": "txn_123",
  "status": "SUCCESS"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Payment verified",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e601",
    "status": "SUCCESS"
  },
  "errors": []
}
```
- DB: Payment

### 52) POST /api/payments/:id/retry
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Payment retry initiated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e601",
    "status": "PENDING"
  },
  "errors": []
}
```
- DB: Payment

### 53) POST /api/payments/:id/refund
- Auth: No
- Request body:
```json
{
  "amount": 100,
  "reason": "Customer request"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Refund processed",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e601",
    "status": "REFUNDED"
  },
  "errors": []
}
```
- DB: Payment

### 54) GET /api/payments/:id
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e601",
    "status": "SUCCESS"
  },
  "errors": []
}
```
- DB: Payment

### 55) GET /api/payments/user
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e601",
      "status": "SUCCESS"
    }
  ],
  "errors": []
}
```
- DB: Payment

## 9. Review APIs

### 56) POST /api/reviews
- Auth: No
- Request body:
```json
{
  "productId": "64f2d9b6f8c2a1b2c3d4e5fa",
  "rating": 5,
  "title": "Excellent product",
  "comment": "Very good quality"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Review created",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e602",
    "rating": 5,
    "productId": "64f2d9b6f8c2a1b2c3d4e5fa"
  },
  "errors": []
}
```
- DB: Review

### 57) GET /api/reviews/product/:productId
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e602",
      "rating": 5
    }
  ],
  "errors": []
}
```
- DB: Review

### 58) GET /api/reviews/:id
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e602",
    "rating": 5
  },
  "errors": []
}
```
- DB: Review

### 59) PATCH /api/reviews/:id
- Auth: No
- Request body:
```json
{
  "comment": "Updated comment"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Review updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e602",
    "comment": "Updated comment"
  },
  "errors": []
}
```
- DB: Review

### 60) PATCH /api/reviews/:id/approve
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Review approved",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e602",
    "approved": true
  },
  "errors": []
}
```
- DB: Review

### 61) DELETE /api/reviews/:id
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Review deleted",
  "data": null,
  "errors": []
}
```
- DB: Review

## 10. Support / Ticket APIs

### 62) POST /api/support/tickets
- Auth: Yes
- Request body:
```json
{
  "subject": "Issue with delivery",
  "category": "delivery",
  "priority": "HIGH",
  "message": "My order arrived late"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Ticket created",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e603",
    "subject": "Issue with delivery",
    "status": "OPEN"
  },
  "errors": []
}
```
- DB: Ticket, TicketMessage

### 63) GET /api/support/tickets
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e603",
      "subject": "Issue with delivery"
    }
  ],
  "errors": []
}
```
- DB: Ticket

### 64) GET /api/support/tickets/:id
- Auth: Yes
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e603",
    "subject": "Issue with delivery"
  },
  "errors": []
}
```
- DB: Ticket

### 65) POST /api/support/tickets/:id/reply
- Auth: Yes
- Request body:
```json
{
  "message": "We are reviewing your issue",
  "isInternalNote": false
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Reply added",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e604",
    "message": "We are reviewing your issue"
  },
  "errors": []
}
```
- DB: TicketMessage

### 66) PATCH /api/support/tickets/:id/status
- Auth: Yes
- Request body:
```json
{
  "status": "IN_PROGRESS"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Ticket status updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e603",
    "status": "IN_PROGRESS"
  },
  "errors": []
}
```
- DB: Ticket

### 67) PATCH /api/support/tickets/:id/assign
- Auth: Yes
- Request body:
```json
{
  "agentId": "64f2d9b6f8c2a1b2c3d4e605"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Ticket assigned",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e603",
    "agentId": "64f2d9b6f8c2a1b2c3d4e605"
  },
  "errors": []
}
```
- DB: Ticket

## 11. Geotrix Bill APIs

### 68) POST /api/geotrixbills
- Auth: No
- Request body:
```json
{
  "title": "Project Invoice",
  "description": "Monthly invoice",
  "amount": 1500,
  "customerName": "ABC Ltd",
  "projectName": "Website Build",
  "priority": "HIGH"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Bill created",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e606",
    "title": "Project Invoice",
    "amount": 1500
  },
  "errors": []
}
```
- DB: GeotrixBill

### 69) GET /api/geotrixbills
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e606",
      "title": "Project Invoice"
    }
  ],
  "errors": []
}
```
- DB: GeotrixBill

### 70) GET /api/geotrixbills/:id
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e606",
    "title": "Project Invoice"
  },
  "errors": []
}
```
- DB: GeotrixBill

### 71) PATCH /api/geotrixbills/:id
- Auth: No
- Request body:
```json
{
  "amount": 1800
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Bill updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e606",
    "amount": 1800
  },
  "errors": []
}
```
- DB: GeotrixBill

### 72) PATCH /api/geotrixbills/:id/status
- Auth: No
- Request body:
```json
{
  "status": "APPROVED",
  "remarks": "Looks good"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Bill status updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e606",
    "status": "APPROVED"
  },
  "errors": []
}
```
- DB: GeotrixBill

### 73) DELETE /api/geotrixbills/:id
- Auth: No
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Bill deleted",
  "data": null,
  "errors": []
}
```
- DB: GeotrixBill

## 12. Admin APIs

### 74) GET /admin/dashboard
- Auth: Admin / Manager
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "totalUsers": 10,
    "totalOrders": 5,
    "totalRevenue": 5000
  },
  "errors": []
}
```
- DB: User, Order, Product

### 75) GET /admin/analytics/sales
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "sales": 1200
  },
  "errors": []
}
```
- DB: Order, Payment

### 76) GET /admin/analytics/orders
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "orders": 25
  },
  "errors": []
}
```
- DB: Order

### 77) GET /admin/analytics/products
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "products": 50
  },
  "errors": []
}
```
- DB: Product

### 78) GET /admin/analytics/users
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "users": 100
  },
  "errors": []
}
```
- DB: User

### 79) GET /admin/analytics/revenue
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "revenue": 15000
  },
  "errors": []
}
```
- DB: Payment, Order

### 80) POST /admin/users
- Auth: Super admin only
- Request body:
```json
{
  "name": "New Admin",
  "email": "newadmin@example.com",
  "password": "secret123",
  "role": "admin"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "User created",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e607",
    "role": "admin"
  },
  "errors": []
}
```
- DB: User

### 81) PATCH /admin/users/:id/role
- Auth: Super admin only
- Request body:
```json
{
  "role": "admin"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Role updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e607",
    "role": "admin"
  },
  "errors": []
}
```
- DB: User

### 82) DELETE /admin/users/:id
- Auth: Super admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "User deleted",
  "data": null,
  "errors": []
}
```
- DB: User

### 83) GET /admin/users
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e607",
      "name": "New Admin"
    }
  ],
  "errors": []
}
```
- DB: User

### 84) GET /admin/users/:id
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e607",
    "name": "New Admin"
  },
  "errors": []
}
```
- DB: User

### 85) PATCH /admin/users/:id/status
- Auth: Admin only
- Request body:
```json
{
  "status": "active"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "User status updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e607",
    "status": "active"
  },
  "errors": []
}
```
- DB: User

### 86) GET /admin/categories
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e5f9",
      "name": "Electronics"
    }
  ],
  "errors": []
}
```
- DB: Category

### 87) POST /admin/categories
- Auth: Admin only
- Request body:
```json
{
  "name": "Electronics"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Category created",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5f9",
    "name": "Electronics"
  },
  "errors": []
}
```
- DB: Category

### 88) PATCH /admin/categories/:id
- Auth: Admin only
- Request body:
```json
{
  "name": "Home Appliances"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Category updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5f9",
    "name": "Home Appliances"
  },
  "errors": []
}
```
- DB: Category

### 89) DELETE /admin/categories/:id
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Category deleted",
  "data": null,
  "errors": []
}
```
- DB: Category

### 90) GET /admin/products
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e5fa",
      "name": "Smartphone"
    }
  ],
  "errors": []
}
```
- DB: Product

### 91) POST /admin/products
- Auth: Admin only
- Request body:
```json
{
  "name": "Smartphone",
  "price": 699
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Product created",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fa",
    "name": "Smartphone"
  },
  "errors": []
}
```
- DB: Product

### 92) PATCH /admin/products/:id
- Auth: Admin only
- Request body:
```json
{
  "price": 649
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Product updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fa",
    "price": 649
  },
  "errors": []
}
```
- DB: Product

### 93) DELETE /admin/products/:id
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Product deleted",
  "data": null,
  "errors": []
}
```
- DB: Product

### 94) PATCH /admin/products/:id/status
- Auth: Admin only
- Request body:
```json
{
  "status": "ACTIVE"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Product status updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fa",
    "status": "ACTIVE"
  },
  "errors": []
}
```
- DB: Product

### 95) POST /admin/products/:id/images
- Auth: Admin only
- Request body:
```json
{
  "url": "https://example.com/product.jpg"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Image uploaded",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fc"
  },
  "errors": []
}
```
- DB: ProductImage

### 96) DELETE /admin/products/images/:id
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Image deleted",
  "data": null,
  "errors": []
}
```
- DB: ProductImage

### 97) POST /admin/products/:id/variants
- Auth: Admin only
- Request body:
```json
{
  "variantName": "128GB",
  "price": 699
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Variant created",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fb"
  },
  "errors": []
}
```
- DB: ProductVariant

### 98) PATCH /admin/products/variants/:id
- Auth: Admin only
- Request body:
```json
{
  "stock": 10
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Variant updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e5fb",
    "stock": 10
  },
  "errors": []
}
```
- DB: ProductVariant

### 99) DELETE /admin/products/variants/:id
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Variant deleted",
  "data": null,
  "errors": []
}
```
- DB: ProductVariant

### 100) GET /admin/orders
- Auth: Admin / Manager
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e600",
      "status": "PENDING"
    }
  ],
  "errors": []
}
```
- DB: Order

### 101) GET /admin/orders/:id
- Auth: Admin / Manager
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e600",
    "status": "PENDING"
  },
  "errors": []
}
```
- DB: Order

### 102) PATCH /admin/orders/:id/status
- Auth: Admin / Manager
- Request body:
```json
{
  "status": "CONFIRMED"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Order status updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e600",
    "status": "CONFIRMED"
  },
  "errors": []
}
```
- DB: Order

### 103) PATCH /admin/orders/:id/payment-status
- Auth: Admin only
- Request body:
```json
{
  "status": "PAID"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Payment status updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e600",
    "paymentStatus": "PAID"
  },
  "errors": []
}
```
- DB: Order

### 104) PATCH /admin/orders/:id/shipping
- Auth: Admin only
- Request body:
```json
{
  "trackingNumber": "TRK123",
  "carrier": "FedEx"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Shipping updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e600",
    "trackingNumber": "TRK123"
  },
  "errors": []
}
```
- DB: Order

### 105) PATCH /admin/orders/:id/cancel
- Auth: Admin / Manager
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Order cancelled",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e600",
    "status": "CANCELLED"
  },
  "errors": []
}
```
- DB: Order

### 106) GET /admin/reviews
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e602",
      "rating": 5
    }
  ],
  "errors": []
}
```
- DB: Review

### 107) PATCH /admin/reviews/:id/approve
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Review approved",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e602",
    "approved": true
  },
  "errors": []
}
```
- DB: Review

### 108) PATCH /admin/reviews/:id/reject
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Review rejected",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e602",
    "approved": false
  },
  "errors": []
}
```
- DB: Review

### 109) DELETE /admin/reviews/:id
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Review deleted",
  "data": null,
  "errors": []
}
```
- DB: Review

### 110) GET /admin/support
- Auth: Admin / Manager
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e603",
      "subject": "Issue with delivery"
    }
  ],
  "errors": []
}
```
- DB: Ticket

### 111) GET /admin/support/:id
- Auth: Admin / Manager
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e603",
    "subject": "Issue with delivery"
  },
  "errors": []
}
```
- DB: Ticket

### 112) PATCH /admin/support/:id/status
- Auth: Admin only
- Request body:
```json
{
  "status": "RESOLVED"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Ticket status updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e603",
    "status": "RESOLVED"
  },
  "errors": []
}
```
- DB: Ticket

### 113) POST /admin/support/:id/reply
- Auth: Admin / Manager
- Request body:
```json
{
  "message": "We have resolved the issue"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Reply saved",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e604",
    "message": "We have resolved the issue"
  },
  "errors": []
}
```
- DB: TicketMessage

### 114) PATCH /admin/support/:id/assign
- Auth: Admin only
- Request body:
```json
{
  "agentId": "64f2d9b6f8c2a1b2c3d4e605"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Ticket assigned",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e603",
    "agentId": "64f2d9b6f8c2a1b2c3d4e605"
  },
  "errors": []
}
```
- DB: Ticket

### 115) GET /admin/geotrix-bills
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": "64f2d9b6f8c2a1b2c3d4e606",
      "title": "Project Invoice"
    }
  ],
  "errors": []
}
```
- DB: GeotrixBill

### 116) GET /admin/geotrix-bills/:id
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e606",
    "title": "Project Invoice"
  },
  "errors": []
}
```
- DB: GeotrixBill

### 117) PATCH /admin/geotrix-bills/:id/status
- Auth: Admin only
- Request body:
```json
{
  "status": "APPROVED",
  "remarks": "Approved by admin"
}
```
- Sample response:
```json
{
  "success": true,
  "message": "Bill status updated",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e606",
    "status": "APPROVED"
  },
  "errors": []
}
```
- DB: GeotrixBill

### 118) PATCH /admin/geotrix-bills/:id/approve
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Bill approved",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e606",
    "status": "APPROVED"
  },
  "errors": []
}
```
- DB: GeotrixBill

### 119) PATCH /admin/geotrix-bills/:id/reject
- Auth: Admin only
- Request body: none
- Sample response:
```json
{
  "success": true,
  "message": "Bill rejected",
  "data": {
    "id": "64f2d9b6f8c2a1b2c3d4e606",
    "status": "REJECTED"
  },
  "errors": []
}
```
- DB: GeotrixBill

## Notes
- The examples above are representative samples based on the current route definitions and response style used in the project.
- If you want, I can next convert this into a Swagger/OpenAPI style file as well.

Ran command: `git status -s`

# 📋 Frontend Developer Handover & API Changes Summary

This document summarizes all recent backend changes across **Multi-Unit Products**, **Cart & Order Flow**, **Payments (Razorpay vs Bank Transfer)**, **Socket.io Events**, and **Support/Chat**.

---

## 1. 📦 Multi-Unit Support for Products & Variants

Variants now support selectable units (e.g. `kg`, `meter`, `piece`) with optional unit-specific pricing matrices.

### Standard Units

- `kg` (_Kilogram_)
- `meter` (_Meter_)
- `piece` (_Piece_)

### Variant Object Structure (API Response)

```typescript
interface ProductVariant {
    _id: string;
    variantName: string;
    sku: string;
    price: number; // Base regular price (per default unit)
    discountPrice?: number; // Base discounted price
    unit: string; // Default/Primary unit (e.g. "piece", "kg", "meter")
    availableUnits?: string[]; // e.g. ["piece", "kg", "meter"]
    unitPrices?: Array<{
        unit: string; // e.g. "kg", "meter"
        price: number; // Regular price for this specific unit
        discountPrice?: number; // Discounted price for this specific unit
        isDefault?: boolean;
    }>;
}
```

### Frontend Implementation Guide (Product Detail Page):

1. Check `variant.availableUnits`:
    - If `availableUnits` has > 1 items, display a unit selection pill/dropdown (`kg`, `meter`, `piece`).
    - If `availableUnits` has 1 item or is empty, use `variant.unit || 'piece'`.
2. When the customer switches unit:
    - Check `variant.unitPrices?.find(p => p.unit === selectedUnit)`.
    - If found, display that unit's `discountPrice ?? price`.
    - If not found, fall back to `variant.discountPrice ?? variant.price`.

---

## 2. 🛒 Cart API Changes

Cart items are now keyed by `(cartId, variantId, unit)` so customers can add different units of the same item (e.g., 2 kg **and** 10 meters of wire).

### Endpoint: `POST /api/cart/items`

```json
{
    "productId": "65f...",
    "variantId": "65f...",
    "quantity": 2,
    "unit": "kg" // Send selected unit ("kg", "meter", or "piece")
}
```

_(Note: `selectedUnit` is also accepted for backwards compatibility)._

### Cart Item Object in `GET /api/cart`

```typescript
{
  "_id": "65f...",
  "product": { ... },
  "variant": { ... },
  "quantity": 2,
  "unit": "kg",       // Stored unit
  "price": 550,       // Unit price evaluated by backend
  "subtotal": 1100    // quantity * price
}
```

---

## 3. 📦 Order API & Flow Changes

### Endpoint: `POST /api/orders`

```json
{
    "shippingAddressId": "65f...",
    "paymentMethod": "RAZORPAY", // or "BANK_TRANSFER"
    "notes": "Optional delivery instructions",
    "items": [
        {
            "variantId": "65f...",
            "quantity": 2,
            "unit": "kg"
        },
        {
            "variantId": "65f...",
            "quantity": 10,
            "unit": "meter"
        }
    ]
}
```

### Key Order Lifecycle Behavior:

1. **Initial Status**: All newly placed orders always start with `status: "PENDING"`.
    - Orders are **NOT** automatically confirmed.
    - Admins manually review and verify every order before changing status to `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`.
2. **Order Items**:
    - Each order item stored in DB contains `unit: string` (e.g. `"kg"`, `"meter"`, `"piece"`).

---

## 4. 💳 Payment Flows (Razorpay vs Bank Transfer)

### Flow A: Razorpay (`paymentMethod: "RAZORPAY"`)

1. App calls `POST /api/payments/razorpay/create-order` with `{ "orderId": "..." }`.
2. App opens Razorpay Checkout.
3. App calls `POST /api/payments/razorpay/verify` with payment signature.
4. Backend updates payment to `paymentStatus: "PAID"`.
5. Order status remains `PENDING` until Admin confirms shipment.

### Flow B: Bank Transfer (`paymentMethod: "BANK_TRANSFER"`)

1. Order is created with `paymentStatus: "PENDING"`.
2. App displays Bank Account Details & Transfer Instructions to the user.
3. User completes wire transfer.
4. Admin verifies the receipt in the Admin Dashboard and marks payment as `PAID`.
5. Customer receives real-time notification: _"Payment Verified!"_.

---

## 5. ⚡ Real-Time Socket Events

Socket connection endpoint: `ws://<SERVER_HOST>/` with auth token: `{ auth: { token: "<JWT_TOKEN>" } }`.

| Event Name                     | Sent To          | Description                                                                                         |
| :----------------------------- | :--------------- | :-------------------------------------------------------------------------------------------------- |
| `cart:updated`                 | Customer         | Triggered when items are added, updated, or removed from cart.                                      |
| `order:created`                | Customer         | Emitted when order placement succeeds. Cart is automatically cleared.                               |
| `order:status_updated`         | Customer         | Emitted when Admin updates status (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`). |
| `order:payment_status_updated` | Customer         | Emitted when Payment status changes (`PAID`, `REFUNDED`, `FAILED`).                                 |
| `ticket:message`               | Customer / Admin | New chat/support message in real time.                                                              |
| `ticket:typing`                | Customer / Admin | Typing indicator `{ ticketId, isTyping, user }`.                                                    |
| `notification:new`             | Customer         | Real-time in-app notification payload.                                                              |

---

## 6. 💬 Support & Chat Updates

- **Active Room Joining**: When user opens a ticket, emit `socket.emit("ticket:join", { ticketId })`.
- **Typing Indicators**: Emit `socket.emit("ticket:typing", { ticketId, isTyping: true })`.
- **FCM Push Notifications**: If the recipient is not currently inside the active chat room, backend automatically dispatches background push notifications via Firebase FCM.

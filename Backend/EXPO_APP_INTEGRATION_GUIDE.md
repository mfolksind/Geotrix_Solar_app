# 📱 Mfolks Geotrix - Expo Mobile App Integration Guide

This guide provides complete, step-by-step instructions and production-ready code examples for integrating the new **Real-time Live Chat**, **Firebase Cloud Messaging (FCM) Push Notifications**, **18% GST Billing Breakup**, and **Storefront Catalog** into your Expo (React Native) mobile application.

---

## 📑 Table of Contents
1. [Prerequisites & Dependencies](#1-prerequisites--dependencies)
2. [Firebase Cloud Messaging (FCM) & Push Notifications](#2-firebase-cloud-messaging-fcm--push-notifications)
3. [Real-time Live Chat & WebSocket Engine (Socket.IO)](#3-real-time-live-chat--websocket-engine-socketio)
4. [Support Ticket Chat Room & Smart Presence Flow](#4-support-ticket-chat-room--smart-presence-flow)
5. [In-App Notification Center & Badges](#5-in-app-notification-center--badges)
6. [Cart & 18% GST Billing System Integration](#6-cart--18-gst-billing-system-integration)
7. [Product Catalog & Default Variant Grouping](#7-product-catalog--default-variant-grouping)
8. [Complete Copy-Paste Service Helpers & Hooks](#8-complete-copy-paste-service-helpers--hooks)

---

## 1. Prerequisites & Dependencies

Install the required packages in your Expo project:

```bash
# In your Expo Mobile App directory:
npx expo install expo-notifications expo-device expo-constants
npm install socket.io-client
```

### Expo Configuration (`app.json` / `app.config.js`)
Ensure your `app.json` has notification plugins and Google Services configuration for Android:

```json
{
  "expo": {
    "name": "Mfolks Geotrix",
    "slug": "mfolks-geotrix",
    "version": "1.0.0",
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#57c5cc",
      "androidMode": "default",
      "androidCollapsedTitle": "{unread_count} new notifications"
    },
    "android": {
      "package": "com.mfolks.geotrix",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#57c5cc"
        }
      ]
    ]
  }
}
```

---

## 2. Firebase Cloud Messaging (FCM) & Push Notifications

The backend sends native FCM push notifications for:
- 🎫 **Ticket Replies** (when the user is offline or not actively inside the chat room)
- 🛍️ **Order Status Updates** (Confirmed, Shipped, Delivered, Cancelled)
- 📢 **Broadcast Announcements** from the Admin Console

### Backend API Endpoints for FCM Tokens

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/notifications/fcm-token` | Register device FCM token | Yes (`Bearer <token>`) |
| `DELETE` | `/api/notifications/fcm-token` | Unregister FCM token on logout | Yes (`Bearer <token>`) |

#### Register Token Payload:
```json
{
  "token": "eabc123...fcm_device_token..."
}
```

---

## 3. Real-time Live Chat & WebSocket Engine (Socket.IO)

The backend runs a Socket.IO server on port `4000` with JWT handshake authentication.

### Socket.IO Client Configuration
Connect to the server with the user's `accessToken`:

```typescript
// src/services/socket.ts
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = 'http://YOUR_SERVER_IP:4000'; // e.g. https://api.mfolksgeo.com or local IP

let socket: Socket | null = null;

export const initSocket = (token: string): Socket => {
  if (socket && socket.connected) return socket;

  socket = io(API_BASE_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Mobile Socket] Connected:', socket?.id);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Mobile Socket] Connection Error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Mobile Socket] Disconnected:', reason);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

---

## 4. Support Ticket Chat Room & Smart Presence Flow

### How Smart Presence Works:
1. When a user opens the chat screen for a specific ticket, emit `ticket:join` with `{ ticketId }`.
2. While the user is in the room:
   - Admin replies stream **instantly** via the `ticket:message` socket event.
   - Duplicate push notifications are automatically suppressed.
3. When the user exits the chat screen (or minimizes the app), emit `ticket:leave` with `{ ticketId }`.
4. If an admin replies while the user is outside the room, the backend immediately triggers:
   - Live In-App Notification (`notification:new`)
   - Native Firebase Cloud Messaging Push Notification

### Ticket Chat Socket Events Reference

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `ticket:join` | Client -> Server | `{ ticketId: string }` | Joins ticket chat room |
| `ticket:leave` | Client -> Server | `{ ticketId: string }` | Leaves ticket chat room |
| `ticket:message` | Server -> Client | `TicketMessage` object | Receives new message in real time |
| `ticket:status_changed` | Server -> Client | `{ ticketId, status }` | Ticket status updated |

### Sending Messages:
Send messages via the standard REST endpoint. The backend automatically saves it to MongoDB and broadcasts it to the room:

```typescript
// POST /api/support/tickets/:ticketId/messages
const response = await fetch(`${API_BASE_URL}/api/support/tickets/${ticketId}/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    message: 'Hello, I have a question about my earthing rod installation.',
    attachments: [],
  }),
});
```

---

## 5. In-App Notification Center & Badges

### Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/notifications?page=1&limit=20` | Get paginated notification list & unread count |
| `PATCH` | `/api/notifications/:id/read` | Mark a specific notification as read |
| `PATCH` | `/api/notifications/read-all` | Mark all user notifications as read |
| `DELETE` | `/api/notifications/:id` | Delete a notification item |

### Sample Response (`GET /api/notifications`):
```json
{
  "success": true,
  "data": [
    {
      "_id": "6701...12",
      "title": "New Reply on Ticket #TKT-20260923-424193",
      "message": "Support Agent: We have dispatched the technician.",
      "type": "TICKET_REPLY",
      "isRead": false,
      "data": {
        "ticketId": "6ab374f47e3768ef41596881",
        "ticketNumber": "TKT-20260923-424193"
      },
      "createdAt": "2026-09-23T06:43:00.000Z"
    }
  ],
  "unreadCount": 1,
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

---

## 6. Cart & 18% GST Billing System Integration

The backend computes the 18% GST automatically across carts and orders.

### Response Data Structure (`GET /api/cart` & `POST /api/orders`):
```json
{
  "subtotal": 7998,
  "taxRate": 18,
  "taxAmount": 1439.64,
  "taxBreakup": {
    "cgst": { "rate": 9, "amount": 719.82 },
    "sgst": { "rate": 9, "amount": 719.82 },
    "igst": { "rate": 18, "amount": 0 }
  },
  "shippingFee": 0,
  "totalAmount": 9437.64,
  "items": [
    {
      "productId": "...",
      "variantId": "...",
      "name": "Chemical Earthing Electrode",
      "variantName": "2 Metre - 50mm Dia",
      "price": 3999,
      "quantity": 2,
      "lineTotal": 7998
    }
  ]
}
```

### Mobile UI Checklist for Cart & Checkout:
- Display **Subtotal** (Base items price before tax).
- Display **GST (18%)** with breakdown tooltip or expandable accordion:
  - CGST (9%): `₹(taxAmount / 2)`
  - SGST (9%): `₹(taxAmount / 2)`
- Display **Total Payable**: `₹totalAmount` (Inclusive of all taxes).

---

## 7. Product Catalog & Default Variant Grouping

When querying products via `GET /api/products`, each product card contains a grouped structure with its default variant pre-selected:

```json
{
  "_id": "prod_123",
  "name": "Geotrix Pure Copper Earthing Electrode",
  "brand": "Geotrix",
  "category": { "name": "Earthing Electrodes" },
  "defaultVariant": {
    "_id": "var_001",
    "name": "2 Metre - 50mm Dia",
    "sku": "GEO-CU-2M",
    "price": 3999,
    "stock": 45,
    "isDefault": true
  },
  "variants": [
    { "_id": "var_001", "name": "2 Metre - 50mm Dia", "price": 3999 },
    { "_id": "var_002", "name": "3 Metre - 50mm Dia", "price": 5799 }
  ],
  "minPrice": 3999,
  "maxPrice": 5799,
  "hasVariants": true
}
```

---

## 8. Complete Copy-Paste Service Helpers & Hooks

### A. Push Notification Manager (`src/services/notificationService.ts`)

```typescript
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Set notification presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotificationsAsync = async (apiBaseUrl: string, accessToken: string) => {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission denied');
    return null;
  }

  // Get Native FCM / APNs Token
  let pushToken = '';
  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    pushToken = deviceToken.data;
  } catch (err) {
    // Fallback to Expo Push Token if native token fails
    const expoToken = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    pushToken = expoToken.data;
  }

  // Set Android Notification Channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default Channel',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#57c5cc',
    });
  }

  // Register token with backend
  if (pushToken && accessToken) {
    try {
      await fetch(`${apiBaseUrl}/api/notifications/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token: pushToken }),
      });
      console.log('✅ FCM Push Token registered with backend');
    } catch (e) {
      console.error('Failed to send FCM token to backend', e);
    }
  }

  return pushToken;
};

export const unregisterPushToken = async (apiBaseUrl: string, accessToken: string, token: string) => {
  try {
    await fetch(`${apiBaseUrl}/api/notifications/fcm-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    console.error('Failed to unregister push token', err);
  }
};
```

---

### B. Live Ticket Chat Hook (`src/hooks/useTicketChat.ts`)

```typescript
import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '../services/socket';

export interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  message: string;
  isInternal?: boolean;
  createdAt: string;
}

export const useTicketChat = (ticketId: string, apiBaseUrl: string, accessToken: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch initial message history
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/support/tickets/${ticketId}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching ticket messages:', err);
    } finally {
      setLoading(false);
    }
  }, [ticketId, apiBaseUrl, accessToken]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 2. Join Ticket Room on Mount & Leave on Unmount
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !ticketId) return;

    // Join room for smart presence
    socket.emit('ticket:join', { ticketId });

    const handleNewMessage = (newMsg: ChatMessage) => {
      // Filter out internal admin notes for customers
      if (newMsg.isInternal) return;
      setMessages((prev) => [...prev, newMsg]);
    };

    socket.on('ticket:message', handleNewMessage);

    return () => {
      // Leave room so push notifications resume when user is away
      socket.emit('ticket:leave', { ticketId });
      socket.off('ticket:message', handleNewMessage);
    };
  }, [ticketId]);

  // 3. Send Message Function
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message: text.trim() }),
      });
      return await res.json();
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return { messages, loading, sendMessage, refetch: fetchMessages };
};
```

---

### C. Live In-App Notifications Hook (`src/hooks/useNotifications.ts`)

```typescript
import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '../services/socket';

export interface AppNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

export const useNotifications = (apiBaseUrl: string, accessToken: string) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await fetch(`${apiBaseUrl}/api/notifications?limit=30`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const result = await res.json();
      if (result.success) {
        setNotifications(result.data || []);
        setUnreadCount(result.unreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, accessToken]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time socket listener for incoming notifications
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotif = (notif: AppNotification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notification:new', handleNewNotif);
    return () => {
      socket.off('notification:new', handleNewNotif);
    };
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${apiBaseUrl}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${apiBaseUrl}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Failed to mark all read', e);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    refetch: fetchNotifications,
    markAsRead,
    markAllRead,
  };
};
```

---

### D. Deep Linking on Notification Click (`App.tsx` or Root Navigation)

```typescript
import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

export const useNotificationDeepLink = () => {
  const navigation = useNavigation<any>();
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Listener when user taps on push notification banner
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;

      if (data?.ticketId) {
        navigation.navigate('TicketChatScreen', {
          ticketId: data.ticketId,
          ticketNumber: data.ticketNumber,
        });
      } else if (data?.orderId) {
        navigation.navigate('OrderDetailScreen', {
          orderId: data.orderId,
          orderNumber: data.orderNumber,
        });
      } else {
        navigation.navigate('NotificationCenterScreen');
      }
    });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [navigation]);
};
```

---

## 🎯 Summary Checklist for Expo App Developers

| Step | Action | Status |
| :---: | :--- | :---: |
| 1 | Install `expo-notifications`, `expo-device`, and `socket.io-client` | 🔲 |
| 2 | Initialize Socket.IO connection upon user login using `initSocket(token)` | 🔲 |
| 3 | Call `registerForPushNotificationsAsync()` after login to sync FCM device token | 🔲 |
| 4 | Join ticket room via `socket.emit('ticket:join', { ticketId })` on chat open | 🔲 |
| 5 | Leave ticket room via `socket.emit('ticket:leave', { ticketId })` on chat exit | 🔲 |
| 6 | Render 18% GST (CGST 9% + SGST 9%) breakdown on Cart and Checkout screens | 🔲 |
| 7 | Display live unread count badge in app header/bottom navigation tab | 🔲 |
| 8 | Configure deep link handler to open Chat Screen on ticket notification tap | 🔲 |

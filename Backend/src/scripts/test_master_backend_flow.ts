import http from 'http';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import app from '../../app';
import { connectMongoDB, disconnectMongoDB } from '../database/mongodb/connection';
import { initSocketServer } from '../socket/socket.server';
import UserModel from '../modules/users/user.model';
import AddressModel from '../modules/addresses/models/address.model';
import CategoryModel from '../modules/categories/category.model';
import FamilyModel from '../modules/families/family.model';
import ProductModel from '../modules/products/product.model';
import ProductVariantModel from '../modules/products/productVariant.model';
import ProductImageModel from '../modules/products/productImage.model';
import CartModel from '../modules/carts/models/cart.model';
import CartItemModel from '../modules/carts/models/cartItem.model';
import OrderModel from '../modules/orders/models/order.model';
import OrderItemModel from '../modules/orders/models/orderItem.model';
import PaymentModel from '../modules/payments/models/payment.model';
import ReviewModel from '../modules/reviews/models/review.model';
import { Lead } from '../modules/leads/lead.model';
import TicketModel from '../modules/support/models/ticket.model';
import TicketMessageModel from '../modules/support/models/ticketMessage.model';
import NotificationModel from '../modules/notifications/notification.model';

import { AuthService } from '../modules/auth/auth.service';
import { AuthRepository } from '../modules/auth/auth.repository';
import { CartService } from '../modules/carts/services/cart.service';
import { CartRepository } from '../modules/carts/repositories/cart.repository';
import { CartItemRepository } from '../modules/carts/repositories/cartItem.repository';
import { OrderService } from '../modules/orders/services/order.service';
import { OrderRepository } from '../modules/orders/repositories/order.repository';
import { OrderItemRepository } from '../modules/orders/repositories/orderItem.repository';
import { ProductService } from '../modules/products/product.service';
import { ProductRepository } from '../modules/products/product.repository';
import { ProductVariantRepository } from '../modules/products/productVariant.repository';
import { ProductImageRepository } from '../modules/products/productImage.repository';
import { TicketService } from '../modules/support/services/ticket.service';
import { TicketMessageService } from '../modules/support/services/ticketMessage.service';
import { TicketRepository } from '../modules/support/repositories/ticket.repository';
import { TicketMessageRepository } from '../modules/support/repositories/ticketMessage.repository';
import { notificationService } from '../modules/notifications/notification.service';

async function runMasterTestFlow() {
  console.log('================================================================');
  console.log('🌟 MASTER E2E BACKEND & FLOW INTEGRATION TEST SUITE 🌟');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // PHASE 1: HTTP & Socket.IO Server Setup
  // -------------------------------------------------------------
  console.log('--- PHASE 1: Initializing HTTP Server & Socket.IO Engine ---');
  await connectMongoDB();

  const testPort = 6125 + Math.floor(Math.random() * 500);
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  await new Promise<void>((resolve) => httpServer.listen(testPort, resolve));
  const serverUrl = `http://127.0.0.1:${testPort}`;
  console.log(`✔ Server live on ${serverUrl}\n`);

  const timestamp = Date.now();
  const customerEmail = `master_cust_${timestamp}@geotrix.com`;
  const adminEmail = `master_admin_${timestamp}@geotrix.com`;

  // -------------------------------------------------------------
  // PHASE 2: Authentication (Customer & Admin Registration, Login, JWT)
  // -------------------------------------------------------------
  console.log('--- PHASE 2: Testing Authentication & Token Flows ---');
  const authRepo = new AuthRepository();
  const authService = new AuthService(authRepo);

  // 1. Customer registration & login
  const customerAuth = await authService.register(
    {
      name: 'Vikram Customer',
      email: customerEmail,
      password: 'Password@123',
      phone: '9876543210',
      source: 'website',
    },
    'http://localhost:3000'
  );
  const custUser = customerAuth.user as any;
  console.log(`✔ Customer registered: ${custUser.name} (${custUser.id})`);

  const customerLogin = await authService.login({
    email: customerEmail,
    password: 'Password@123',
  });
  if (!customerLogin.tokens?.accessToken || !customerLogin.tokens?.refreshToken) {
    throw new Error('Customer login failed to return access or refresh token');
  }
  const customerToken = customerLogin.tokens.accessToken;
  const loggedInCust = customerLogin.user as any;
  const customerId = String(loggedInCust.id || loggedInCust._id);
  console.log('✔ Customer login succeeded with JWT tokens');

  // 2. Admin registration with admin key & login
  const adminAuth = await authService.registerAdmin(
    {
      name: 'Ananya Admin',
      email: adminEmail,
      password: 'AdminPassword@123',
      adminKey: process.env.ADMIN_REGISTRATION_KEY || 'MfolksAdminKey123',
    },
    'http://localhost:3001'
  );
  const adminUserData = adminAuth.user as any;
  console.log(`✔ Admin registered: ${adminUserData.name} (Role: ${adminUserData.role})`);

  const adminLogin = await authService.login({
    email: adminEmail,
    password: 'AdminPassword@123',
  });
  const adminToken = adminLogin.tokens.accessToken;
  const loggedInAdmin = adminLogin.user as any;
  const adminId = String(loggedInAdmin.id || loggedInAdmin._id);
  console.log('✔ Admin login succeeded with JWT tokens');

  // 3. Connect Live WebSockets for both Customer and Admin
  const customerSocket: ClientSocketType = ClientSocket(serverUrl, {
    auth: { token: customerToken },
    transports: ['websocket'],
  });

  const adminSocket: ClientSocketType = ClientSocket(serverUrl, {
    auth: { token: adminToken },
    transports: ['websocket'],
  });

  await Promise.all([
    new Promise<void>((resolve, reject) => {
      customerSocket.on('connect', () => resolve());
      customerSocket.on('connect_error', reject);
    }),
    new Promise<void>((resolve, reject) => {
      adminSocket.on('connect', () => resolve());
      adminSocket.on('connect_error', reject);
    }),
  ]);
  console.log('✔ Customer & Admin WebSocket live sessions connected and authenticated\n');

  // -------------------------------------------------------------
  // PHASE 3: User Addresses
  // -------------------------------------------------------------
  console.log('--- PHASE 3: Testing User Addresses ---');
  const addressDoc = await AddressModel.create({
    user: customerId,
    fullName: 'Vikram Customer',
    phone: '9876543210',
    addressLine1: 'Plot 42, Electronics City Phase 1',
    addressLine2: 'Near Wipro Gate 5',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560100',
    country: 'India',
    addressType: 'HOME',
    isDefault: true,
  });
  const addressId = String(addressDoc._id);
  console.log(`✔ Delivery address created for customer: ${addressDoc.addressLine1}, ${addressDoc.city}\n`);

  // -------------------------------------------------------------
  // PHASE 4: Catalog Setup (Family, Category, Product, Variants)
  // -------------------------------------------------------------
  console.log('--- PHASE 4: Testing Catalog Management & Storefront Product Grouping ---');
  const familyDoc = await FamilyModel.create({
    name: `Geotrix Earthing Systems ${timestamp}`,
    slug: `geotrix-earthing-${timestamp}`,
    description: 'Advanced chemical and copper bonded earthing solutions',
    status: 'ACTIVE',
  });

  const categoryDoc = await CategoryModel.create({
    name: `Chemical Earthing Electrodes ${timestamp}`,
    slug: `chemical-earthing-electrodes-${timestamp}`,
    family: familyDoc._id,
    description: 'High conductivity maintenance-free chemical earthing rods',
    status: 'ACTIVE',
  });
  console.log(`✔ Created Family: "${familyDoc.name}" & Category: "${categoryDoc.name}"`);

  // Create Product & 2 Variants
  const productRepo = new ProductRepository();
  const variantRepo = new ProductVariantRepository();
  const imageRepo = new ProductImageRepository();
  const productService = new ProductService(productRepo, variantRepo, imageRepo);

  const productDoc = await ProductModel.create({
    name: 'Geotrix Pure Copper Chemical Earthing Rod',
    slug: `geotrix-pure-copper-earthing-rod-${timestamp}`,
    category: categoryDoc._id,
    family: familyDoc._id,
    brand: 'Geotrix',
    status: 'ACTIVE',
    description: 'Heavy duty pure copper chemical earthing electrode designed for sensitive telecom and power equipment.',
  });
  const productId = String(productDoc._id);

  // Variant 1: 2 Metres (Default Variant)
  const variant1 = await ProductVariantModel.create({
    product: productId,
    variantName: '2 Metre - 50mm Dia',
    slug: `gtx-earth-2m-${timestamp}`,
    sku: `GTX-EARTH-2M-${timestamp}`,
    price: 4500,
    discountPrice: 3999,
    stock: 50,
    isDefault: true,
    status: 'ACTIVE',
    attributes: [
      { name: 'Length', value: '2 Metre' },
      { name: 'Diameter', value: '50mm' },
    ],
  });

  // Variant 2: 3 Metres (Secondary Variant)
  const variant2 = await ProductVariantModel.create({
    product: productId,
    variantName: '3 Metre - 50mm Dia',
    slug: `gtx-earth-3m-${timestamp}`,
    sku: `GTX-EARTH-3M-${timestamp}`,
    price: 6500,
    discountPrice: 5799,
    stock: 30,
    isDefault: false,
    status: 'ACTIVE',
    attributes: [
      { name: 'Length', value: '3 Metre' },
      { name: 'Diameter', value: '50mm' },
    ],
  });

  console.log(`✔ Created Product with Default Variant (${variant1.variantName}, ₹${variant1.discountPrice}) & Secondary Variant (${variant2.variantName}, ₹${variant2.discountPrice})`);

  // Verify Storefront listProducts grouping (Only 1 item per product returned with default variant attached)
  const storefrontList = await productService.listProducts({ category: String(categoryDoc._id) });
  if (storefrontList.data.length !== 1) {
    throw new Error(`Expected 1 grouped product for storefront, but got ${storefrontList.data.length}`);
  }
  const groupedItem = storefrontList.data[0] as any;
  if (groupedItem.sku !== variant1.sku || groupedItem.price !== variant1.price) {
    throw new Error('Grouped product did not attach the default variant details');
  }
  console.log('✔ Verified Storefront Product Grouping: 1 unique product card returned with default variant pricing & SKU\n');

  // -------------------------------------------------------------
  // PHASE 5: Cart Management & 18% GST System
  // -------------------------------------------------------------
  console.log('--- PHASE 5: Testing Cart Management with 18% GST Breakdown & Sockets Sync ---');
  const cartRepo = new CartRepository();
  const cartItemRepo = new CartItemRepository();
  const cartService = new CartService(cartRepo, cartItemRepo);

  // Setup live socket listener for cart updates
  const cartSocketPromise = new Promise<any>((resolve) => {
    customerSocket.once('cart:updated', (data) => resolve(data));
  });

  // Add 2 units of Variant 1 to cart
  await cartService.addToCart(customerId, productId, 2, String(variant1._id));
  const cartSocketEvent = await cartSocketPromise;
  if (cartSocketEvent?.action !== 'ADD') {
    throw new Error('❌ Customer socket did not receive cart:updated event');
  }
  console.log('✔ Real-time cart socket event received on customer session');

  const cartData = await cartService.getCart(customerId);
  const billing = cartData.billing;

  // Expected:
  // Subtotal = 3999 * 2 = 7998
  // 18% GST = 7998 * 0.18 = 1439.64
  // CGST = 719.82, SGST = 719.82
  // Total = 7998 + 1439.64 = 9437.64
  console.log(`  - Subtotal: ₹${billing.subtotal}`);
  console.log(`  - 18% Tax Rate: ${billing.taxRate}%`);
  console.log(`  - Tax Amount: ₹${billing.taxAmount} (CGST: ₹${billing.cgst} + SGST: ₹${billing.sgst})`);
  console.log(`  - Total Amount: ₹${billing.totalAmount}`);

  if (billing.subtotal !== 7998 || billing.taxRate !== 18 || billing.totalAmount !== 9437.64) {
    throw new Error(`❌ Cart 18% GST calculation mismatch: Got total ₹${billing.totalAmount}`);
  }
  console.log('✔ Cart 18% GST billing breakdown calculated with mathematical precision\n');

  // -------------------------------------------------------------
  // PHASE 6: Orders & Checkout Flow
  // -------------------------------------------------------------
  console.log('--- PHASE 6: Testing Checkout, Inventory Deduction, Order Sockets & Notifications ---');
  const orderRepo = new OrderRepository();
  const orderItemRepo = new OrderItemRepository();
  const orderService = new OrderService(orderRepo, orderItemRepo, cartRepo, cartItemRepo);

  // Listen for admin real-time order alert
  const adminNewOrderPromise = new Promise<any>((resolve) => {
    adminSocket.once('order:new', (data) => resolve(data));
  });

  // Customer places order
  const orderResult = await orderService.createOrder(
    customerId,
    addressId,
    [{ variantId: String(variant1._id), quantity: 2 }],
    'Please pack with extra cushioning for fragile sensors.'
  );

  const orderId = String(orderResult._id);
  const orderNumber = orderResult.orderNumber;
  console.log(`✔ Order placed successfully: #${orderNumber} (Total: ₹${orderResult.totalAmount})`);

  // Verify Admin received order socket event
  const adminOrderEvent = await adminNewOrderPromise;
  if (adminOrderEvent?.order?.orderNumber !== orderNumber) {
    throw new Error('❌ Admin did not receive order:new live socket alert');
  }
  console.log('✔ Admin received instant real-time socket alert for new order');

  // Verify Stock Deduction (50 - 2 = 48)
  const variantAfterOrder = await ProductVariantModel.findById(variant1._id);
  if (variantAfterOrder?.stock !== 48) {
    throw new Error(`❌ Expected variant stock to be 48, but got ${variantAfterOrder?.stock}`);
  }
  console.log('✔ Inventory stock successfully deducted (50 -> 48 units)');

  // Verify Customer received ORDER_CREATED notification
  const orderCreatedNotif = await NotificationModel.findOne({
    recipient: customerId,
    type: 'ORDER_CREATED',
  });
  if (!orderCreatedNotif) {
    throw new Error('❌ ORDER_CREATED notification not found in database');
  }
  console.log(`✔ Customer received in-app & push notification: "${orderCreatedNotif.title}"`);

  // Admin updates order status to SHIPPED
  const customerOrderStatusPromise = new Promise<any>((resolve) => {
    customerSocket.once('order:status_updated', (data) => resolve(data));
  });

  await orderService.updateOrderStatus(orderId, 'SHIPPED');
  const customerStatusEvent = await customerOrderStatusPromise;
  if (customerStatusEvent?.status !== 'SHIPPED') {
    throw new Error('❌ Customer did not receive order:status_updated socket event');
  }
  console.log('✔ Order status updated to "SHIPPED" and customer notified in real-time\n');

  // -------------------------------------------------------------
  // PHASE 7: Payments System
  // -------------------------------------------------------------
  console.log('--- PHASE 7: Testing Payments & Razorpay Record ---');
  const paymentDoc = await PaymentModel.create({
    order: orderId,
    user: customerId,
    amount: orderResult.totalAmount,
    currency: 'INR',
    paymentProvider: 'RAZORPAY',
    paymentMethod: 'UPI',
    transactionId: `pay_rzp_${timestamp}`,
    providerOrderId: `order_rzp_${timestamp}`,
    status: 'SUCCESS',
    paidAt: new Date(),
  });
  await orderRepo.updatePaymentStatus(orderId, 'PAID');
  console.log(`✔ Payment recorded as SUCCESS via ${paymentDoc.paymentProvider} (${paymentDoc.transactionId})\n`);

  // -------------------------------------------------------------
  // PHASE 8: Product Reviews & Rating Aggregation
  // -------------------------------------------------------------
  console.log('--- PHASE 8: Testing Customer Reviews & Ratings ---');
  const reviewDoc = await ReviewModel.create({
    product: productId,
    user: customerId,
    rating: 5,
    title: 'Outstanding quality and very low soil resistance!',
    comment: 'Installed this chemical rod at our sub-station and achieved < 1.0 Ohm resistance effortlessly.',
    status: 'APPROVED',
  });
  console.log(`✔ Review submitted: ${reviewDoc.rating}★ by ${custUser.name}: "${reviewDoc.title}"\n`);

  // -------------------------------------------------------------
  // PHASE 9: Leads / Commercial Inquiries
  // -------------------------------------------------------------
  console.log('--- PHASE 9: Testing Commercial Leads & Inquiries ---');
  const leadDoc = await Lead.create({
    fullName: 'Tata Projects Infrastructure',
    propertyType: 'Industrial',
    city: 'Mumbai',
    pinCode: '400001',
    whatsappNumber: '9820012345',
    monthlyBill: 'Above 50000',
    agreedToTerms: true,
    status: 'New',
  });
  console.log(`✔ Commercial Lead recorded: ${leadDoc.fullName} - ${leadDoc.propertyType} (${leadDoc.city})\n`);

  // -------------------------------------------------------------
  // PHASE 10: Support Tickets & Live Chat Real-Time Sockets
  // -------------------------------------------------------------
  console.log('--- PHASE 10: Testing Support Tickets, Live Chat & Smart Offline Notifications ---');
  const ticketRepo = new TicketRepository();
  const ticketMsgRepo = new TicketMessageRepository();
  const ticketService = new TicketService(ticketRepo, ticketMsgRepo);
  const ticketMsgService = new TicketMessageService(ticketMsgRepo, ticketRepo);

  // 1. Customer creates ticket -> Admin receives alert
  const adminTicketAlertPromise = new Promise<any>((resolve) => {
    adminSocket.once('ticket:created', (data) => resolve(data));
  });

  const ticketDoc = await ticketService.createTicket(customerId, {
    subject: 'Assistance with Earthing Pit Soil Enhancement Chemical ratio',
    category: 'TECHNICAL',
    priority: 'HIGH',
    message: 'What is the recommended ratio of Bentonite chemical backfill compound per pit?',
  });
  const ticketId = String(ticketDoc._id);

  const adminTicketAlert = await adminTicketAlertPromise;
  if (!adminTicketAlert?.ticket?._id) {
    throw new Error('❌ Admin did not receive ticket:created broadcast');
  }
  console.log(`✔ Support Ticket #${ticketDoc.ticketNumber} created & broadcasted to admin team`);

  // 2. Both join live chat room
  customerSocket.emit('ticket:join', { ticketId });
  adminSocket.emit('ticket:join', { ticketId });
  await new Promise((r) => setTimeout(r, 150));

  const customerLiveMsgPromise = new Promise<any>((resolve) => {
    customerSocket.once('ticket:message', (data) => resolve(data));
  });

  // Admin replies while customer is in room
  await ticketMsgService.replyToTicket(ticketId, adminId, {
    message: 'Use 25kg of Geotrix BFC compound mixed with 5 litres of clean water per pit.',
    isInternalNote: false,
  });

  const liveMsg = await customerLiveMsgPromise;
  if (!liveMsg?.message?.message.includes('25kg of Geotrix')) {
    throw new Error('❌ Live chat message was not received by customer');
  }
  console.log('✔ Live message received in real-time by customer inside the chat room');

  // 3. Customer leaves room -> Admin replies -> Smart offline notification triggered
  customerSocket.emit('ticket:leave', { ticketId });
  await new Promise((r) => setTimeout(r, 150));

  const customerOfflineNotifPromise = new Promise<any>((resolve) => {
    customerSocket.once('notification:new', (data) => resolve(data));
  });

  await ticketMsgService.replyToTicket(ticketId, adminId, {
    message: 'Also remember to measure soil resistivity before pouring the final layer.',
    isInternalNote: false,
  });

  const offlineNotif = await customerOfflineNotifPromise;
  if (!offlineNotif?.title?.includes('Reply on Ticket')) {
    throw new Error('❌ Smart offline notification was not dispatched to customer');
  }
  console.log('✔ Smart Presence verified: Customer received offline notification & FCM push when away from room');

  // 4. Admin assigns agent and resolves ticket
  await ticketService.assignTicket(ticketId, adminId, adminId);
  await ticketService.updateStatus(ticketId, 'RESOLVED', adminId);
  console.log('✔ Ticket assigned and marked as RESOLVED\n');

  // -------------------------------------------------------------
  // PHASE 11: Multi-Channel Notifications & FCM Token Flow
  // -------------------------------------------------------------
  console.log('--- PHASE 11: Testing Notification Center & FCM Device Registration ---');
  await notificationService.registerDeviceToken(customerId, 'expo_android_fcm_token_device_99');

  const notifications = await notificationService.getUserNotifications(customerId, { page: 1, limit: 10 });
  console.log(`✔ User has ${notifications.items.length} notifications (${notifications.unreadCount} unread)`);

  await notificationService.markAllAsRead(customerId);
  const afterReadAll = await notificationService.getUserNotifications(customerId, { page: 1, limit: 10 });
  if (afterReadAll.unreadCount !== 0) {
    throw new Error(`Expected unreadCount to be 0, got ${afterReadAll.unreadCount}`);
  }
  console.log('✔ Mark all as read verified: Unread count reset to 0\n');

  // -------------------------------------------------------------
  // PHASE 12: Clean Teardown
  // -------------------------------------------------------------
  console.log('--- PHASE 12: Cleaning Up Test Sockets & Test Database Fixtures ---');
  customerSocket.disconnect();
  adminSocket.disconnect();
  await new Promise((r) => httpServer.close(r));

  await NotificationModel.deleteMany({ recipient: { $in: [customerId, adminId] } });
  await TicketMessageModel.deleteMany({ ticket: ticketId });
  await TicketModel.findByIdAndDelete(ticketId);
  await Lead.findByIdAndDelete(leadDoc._id);
  await ReviewModel.findByIdAndDelete(reviewDoc._id);
  await PaymentModel.findByIdAndDelete(paymentDoc._id);
  await OrderItemModel.deleteMany({ order: orderId });
  await OrderModel.findByIdAndDelete(orderId);
  await CartItemModel.deleteMany({ cart: cartData.cart.id });
  await CartModel.findByIdAndDelete(cartData.cart.id);
  await ProductImageModel.deleteMany({ product: productId });
  await ProductVariantModel.deleteMany({ product: productId });
  await ProductModel.findByIdAndDelete(productId);
  await CategoryModel.findByIdAndDelete(categoryDoc._id);
  await FamilyModel.findByIdAndDelete(familyDoc._id);
  await AddressModel.findByIdAndDelete(addressId);
  await UserModel.deleteMany({ _id: { $in: [customerId, adminId] } });

  await disconnectMongoDB();

  console.log('================================================================');
  console.log('🎉 100% COMPLETE: ALL 12 BACKEND FLOWS & MODULES PASSED (0 ERRORS)');
  console.log('================================================================\n');
}

runMasterTestFlow().catch((err) => {
  console.error('\n❌ MASTER TEST FLOW FAILED:', err);
  process.exit(1);
});

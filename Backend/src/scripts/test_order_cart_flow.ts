import http from 'http';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import app from '../../app';
import { connectMongoDB, disconnectMongoDB } from '../database/mongodb/connection';
import { initSocketServer } from '../socket/socket.server';
import UserModel from '../modules/users/user.model';
import AddressModel from '../modules/addresses/models/address.model';
import CategoryModel from '../modules/categories/category.model';
import ProductModel from '../modules/products/product.model';
import ProductVariantModel from '../modules/products/productVariant.model';
import CartModel from '../modules/carts/models/cart.model';
import CartItemModel from '../modules/carts/models/cartItem.model';
import OrderModel from '../modules/orders/models/order.model';
import OrderItemModel from '../modules/orders/models/orderItem.model';
import NotificationModel from '../modules/notifications/notification.model';
import { CartService } from '../modules/carts/services/cart.service';
import { CartRepository } from '../modules/carts/repositories/cart.repository';
import { CartItemRepository } from '../modules/carts/repositories/cartItem.repository';
import { OrderService } from '../modules/orders/services/order.service';
import { OrderRepository } from '../modules/orders/repositories/order.repository';
import { OrderItemRepository } from '../modules/orders/repositories/orderItem.repository';
import { AdminOrderService } from '../admin/orders/adminOrder.service';
import { PaymentService } from '../modules/payments/services/payment.service';
import { PaymentRepository } from '../modules/payments/repositories/payment.repository';
import { env } from '../config/env';

async function runOrderCartTests() {
  console.log('================================================================');
  console.log('🛒 STARTING CART, ORDER & ADMIN STATUS FLOW TEST SUITE');
  console.log('================================================================\n');

  await connectMongoDB();

  // 1. Initialize Server & Sockets
  const testPort = 6188;
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  await new Promise<void>((resolve) => httpServer.listen(testPort, resolve));
  const serverUrl = `http://127.0.0.1:${testPort}`;
  console.log(`✅ Test server running on ${serverUrl}`);

  // 2. Setup Test Users
  const customerUser = await UserModel.create({
    name: 'Cart Test Customer',
    email: `cart_cust_${Date.now()}@example.com`,
    role: 'customer',
    isVerified: true,
    status: 'active',
  });

  const adminUser = await UserModel.create({
    name: 'Cart Test Admin',
    email: `cart_admin_${Date.now()}@example.com`,
    role: 'admin',
    isVerified: true,
    status: 'active',
  });

  const customerToken = jwt.sign(
    { id: customerUser._id.toString(), email: customerUser.email, role: 'customer', name: customerUser.name },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    { id: adminUser._id.toString(), email: adminUser.email, role: 'admin', name: adminUser.name },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );

  const customerSocket: ClientSocketType = ClientSocket(serverUrl, {
    auth: { token: customerToken },
    transports: ['websocket'],
  });

  const adminSocket: ClientSocketType = ClientSocket(serverUrl, {
    auth: { token: adminToken },
    transports: ['websocket'],
  });

  await Promise.all([
    new Promise<void>((resolve) => customerSocket.on('connect', resolve)),
    new Promise<void>((resolve) => adminSocket.on('connect', resolve)),
  ]);
  console.log('✅ Customer & Admin sockets connected');

  // 3. Setup Catalog & Address
  const category = await CategoryModel.create({
    name: 'Test Earthing',
    slug: `test-earthing-${Date.now()}`,
    status: 'ACTIVE',
  });

  const product = await ProductModel.create({
    name: 'Geotrix Copper Bonded Rod 3m',
    slug: `geotrix-rod-${Date.now()}`,
    category: category._id,
    status: 'ACTIVE',
  });

  const variant = await ProductVariantModel.create({
    product: product._id,
    variantName: '3m 17mm Copper Rod',
    slug: `geotrix-rod-3m-${Date.now()}`,
    price: 1500,
    discountPrice: 1200,
    stock: 50,
    sku: `SKU-${Date.now()}`,
    status: 'ACTIVE',
  });

  const address = await AddressModel.create({
    user: customerUser._id,
    fullName: 'Test Customer',
    phone: '9876543210',
    addressLine1: 'Plot 42, Industrial Area',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '380001',
    country: 'India',
  });

  // Services
  const cartRepo = new CartRepository();
  const cartItemRepo = new CartItemRepository();
  const cartService = new CartService(cartRepo, cartItemRepo);

  const orderRepo = new OrderRepository();
  const orderItemRepo = new OrderItemRepository();
  const orderService = new OrderService(orderRepo, orderItemRepo, cartRepo, cartItemRepo);
  const adminOrderService = new AdminOrderService();
  const paymentRepo = new PaymentRepository();
  const paymentService = new PaymentService(paymentRepo, orderRepo);

  // -------------------------------------------------------------
  // Test 1: Add to Cart & Real-Time Socket Event
  // -------------------------------------------------------------
  console.log('\n--- Test 1: Add Item to Cart ---');
  const cartSocketPromise = new Promise<any>((resolve) => {
    customerSocket.once('cart:updated', (data) => resolve(data));
  });

  const cartItem = await cartService.addToCart(String(customerUser._id), String(product._id), 2, String(variant._id));
  const cartSocketData = await cartSocketPromise;

  if (cartSocketData?.action !== 'ADD') {
    throw new Error('❌ Customer did not receive cart:updated socket event');
  }
  console.log(`✅ Item added to cart (Quantity: ${cartItem?.quantity}, Subtotal: ₹${cartItem?.subtotal})`);

  // Verify Cart Billing
  const cartData = await cartService.getCart(String(customerUser._id));
  if (cartData.billing.subtotal !== 2400) {
    throw new Error(`❌ Expected subtotal 2400, got ${cartData.billing.subtotal}`);
  }
  console.log(`✅ Cart total calculated with 18% GST: Total Amount = ₹${cartData.billing.totalAmount}`);

  // -------------------------------------------------------------
  // Test 2: Place Order & Initial Status Validation (Must be PENDING)
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Place Order & Ensure Initial Status is PENDING ---');
  const orderCreatedPromise = new Promise<any>((resolve) => {
    customerSocket.once('order:created', (data) => resolve(data));
  });
  const adminNewOrderPromise = new Promise<any>((resolve) => {
    adminSocket.once('order:new', (data) => resolve(data));
  });

  const order = await orderService.createOrder(
    String(customerUser._id),
    String(address._id),
    [{ variantId: String(variant._id), quantity: 2 }],
    'Please pack with fragile protection'
  );

  const customerOrderEvent = await orderCreatedPromise;
  const adminOrderEvent = await adminNewOrderPromise;

  if (!customerOrderEvent?.order || !adminOrderEvent?.order) {
    throw new Error('❌ Real-time order creation socket events missing');
  }

  // CRITICAL REQUIREMENT: Status must start as PENDING, NOT auto-confirmed
  const dbOrder = await OrderModel.findById(order._id);
  if (dbOrder?.status !== 'PENDING') {
    throw new Error(`❌ Order status must be PENDING on creation, got "${dbOrder?.status}"`);
  }
  if (dbOrder?.paymentStatus !== 'PENDING') {
    throw new Error(`❌ Payment status must be PENDING on creation, got "${dbOrder?.paymentStatus}"`);
  }
  console.log(`✅ Order #${order.orderNumber} created with status: PENDING and paymentStatus: PENDING`);

  // Verify User Cart was Auto-Cleared
  const postOrderCart = await cartService.getCart(String(customerUser._id));
  if (postOrderCart.items.length !== 0) {
    throw new Error('❌ User cart was not automatically cleared after order placement');
  }
  console.log('✅ Cart automatically cleared upon successful order placement');

  // Verify Customer Notification
  const initialNotif = await NotificationModel.findOne({
    recipient: customerUser._id,
    type: 'ORDER_CREATED',
  }).sort({ createdAt: -1 });

  if (!initialNotif || !initialNotif.message.includes('awaiting admin confirmation')) {
    throw new Error('❌ Initial order notification does not state awaiting admin confirmation');
  }
  console.log(`✅ Customer received initial notification: "${initialNotif.title}" - "${initialNotif.message}"`);

  // -------------------------------------------------------------
  // Test 3: Payment Success (Payment becomes PAID, Order stays PENDING)
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Razorpay Payment Success Handling ---');
  const paymentSocketPromise = new Promise<any>((resolve) => {
    customerSocket.once('order:payment_status_updated', (data) => resolve(data));
  });

  await paymentService.markRazorpaySuccess(
    String(order._id),
    `pay_tx_${Date.now()}`,
    `order_rzp_${Date.now()}`,
    String(customerUser._id)
  );

  const paymentEvent = await paymentSocketPromise;
  if (paymentEvent?.paymentStatus !== 'PAID') {
    throw new Error('❌ Customer did not receive order:payment_status_updated socket event');
  }

  const orderAfterPayment = await OrderModel.findById(order._id);
  if (orderAfterPayment?.paymentStatus !== 'PAID') {
    throw new Error('❌ Order payment status was not updated to PAID');
  }
  // Order status must STILL be PENDING so admin confirms it explicitly
  if (orderAfterPayment?.status !== 'PENDING') {
    throw new Error(`❌ Order was automatically confirmed upon payment! Expected PENDING, got ${orderAfterPayment?.status}`);
  }
  console.log('✅ Payment marked as PAID; Order status remains PENDING for admin confirmation');

  // -------------------------------------------------------------
  // Test 4: Admin Confirms Order (Status -> CONFIRMED)
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Admin Confirms Order (Status -> CONFIRMED) ---');
  const confirmedSocketPromise = new Promise<any>((resolve) => {
    customerSocket.once('order:status_updated', (data) => resolve(data));
  });

  await adminOrderService.updateStatus(String(order._id), 'CONFIRMED');
  const confirmedEvent = await confirmedSocketPromise;

  if (confirmedEvent?.status !== 'CONFIRMED') {
    throw new Error('❌ Customer did not receive CONFIRMED socket status update');
  }

  const confirmedNotif = await NotificationModel.findOne({
    recipient: customerUser._id,
    type: 'ORDER_STATUS',
  }).sort({ createdAt: -1 });

  if (!confirmedNotif || !confirmedNotif.title.includes('Order Confirmed')) {
    throw new Error('❌ Customer did not receive Order Confirmed notification');
  }
  console.log(`✅ Admin confirmed order -> Customer received: "${confirmedNotif.title}" - "${confirmedNotif.message}"`);

  // -------------------------------------------------------------
  // Test 5: Admin Processing Order (Status -> PROCESSING)
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Admin Moves Order to PROCESSING ---');
  const processingSocketPromise = new Promise<any>((resolve) => {
    customerSocket.once('order:status_updated', (data) => resolve(data));
  });

  await adminOrderService.updateStatus(String(order._id), 'PROCESSING');
  const processingEvent = await processingSocketPromise;

  if (processingEvent?.status !== 'PROCESSING') {
    throw new Error('❌ Customer did not receive PROCESSING socket status update');
  }

  const processingNotif = await NotificationModel.findOne({
    recipient: customerUser._id,
    type: 'ORDER_STATUS',
  }).sort({ createdAt: -1 });

  if (!processingNotif || !processingNotif.title.includes('Processing')) {
    throw new Error('❌ Customer did not receive Order in Processing notification');
  }
  console.log(`✅ Admin processing order -> Customer received: "${processingNotif.title}"`);

  // -------------------------------------------------------------
  // Test 6: Admin Ships Order (Status -> SHIPPED)
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Admin Ships Order (Status -> SHIPPED) ---');
  const shippedSocketPromise = new Promise<any>((resolve) => {
    customerSocket.once('order:status_updated', (data) => resolve(data));
  });

  await adminOrderService.updateStatus(String(order._id), 'SHIPPED');
  const shippedEvent = await shippedSocketPromise;

  if (shippedEvent?.status !== 'SHIPPED') {
    throw new Error('❌ Customer did not receive SHIPPED socket status update');
  }

  const shippedNotif = await NotificationModel.findOne({
    recipient: customerUser._id,
    type: 'ORDER_STATUS',
  }).sort({ createdAt: -1 });

  if (!shippedNotif || !shippedNotif.title.includes('Order Shipped')) {
    throw new Error('❌ Customer did not receive Order Shipped notification');
  }
  console.log(`✅ Admin shipped order -> Customer received: "${shippedNotif.title}"`);

  // -------------------------------------------------------------
  // Test 7: Admin Delivers Order (Status -> DELIVERED)
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Admin Delivers Order (Status -> DELIVERED) ---');
  const deliveredSocketPromise = new Promise<any>((resolve) => {
    customerSocket.once('order:status_updated', (data) => resolve(data));
  });

  await adminOrderService.updateStatus(String(order._id), 'DELIVERED');
  const deliveredEvent = await deliveredSocketPromise;

  if (deliveredEvent?.status !== 'DELIVERED') {
    throw new Error('❌ Customer did not receive DELIVERED socket status update');
  }

  const deliveredNotif = await NotificationModel.findOne({
    recipient: customerUser._id,
    type: 'ORDER_STATUS',
  }).sort({ createdAt: -1 });

  if (!deliveredNotif || !deliveredNotif.title.includes('Order Delivered')) {
    throw new Error('❌ Customer did not receive Order Delivered notification');
  }
  console.log(`✅ Admin delivered order -> Customer received: "${deliveredNotif.title}"`);

  // -------------------------------------------------------------
  // Test 8: Admin Payment Status Updates (e.g. REFUNDED)
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Admin Updates Payment Status to REFUNDED ---');
  const refundedSocketPromise = new Promise<any>((resolve) => {
    customerSocket.once('order:payment_status_updated', (data) => resolve(data));
  });

  await adminOrderService.updatePaymentStatus(String(order._id), 'REFUNDED');
  const refundedEvent = await refundedSocketPromise;

  if (refundedEvent?.paymentStatus !== 'REFUNDED') {
    throw new Error('❌ Customer did not receive REFUNDED socket payment status update');
  }

  const refundedNotif = await NotificationModel.findOne({
    recipient: customerUser._id,
    type: 'ORDER_PAYMENT',
  }).sort({ createdAt: -1 });

  if (!refundedNotif || !refundedNotif.title.includes('Refunded')) {
    throw new Error('❌ Customer did not receive Payment Refunded notification');
  }
  console.log(`✅ Admin refunded payment -> Customer received: "${refundedNotif.title}" - "${refundedNotif.message}"`);

  // -------------------------------------------------------------
  // Test 9: BANK TRANSFER Flow: Order Creation -> Admin Manual Verification -> Order Confirmation
  // -------------------------------------------------------------
  console.log('\n--- Test 9: BANK TRANSFER Flow (Manual Admin Verification) ---');
  const bankOrderCreatedPromise = new Promise<any>((resolve) => {
    customerSocket.once('order:created', (data) => resolve(data));
  });

  const bankOrder = await orderService.createOrder(
    String(customerUser._id),
    String(address._id),
    [{ variantId: String(variant._id), quantity: 1 }],
    'Bank transfer order test',
    'BANK_TRANSFER'
  );

  const bankOrderEvent = await bankOrderCreatedPromise;
  if (!bankOrderEvent?.order || bankOrderEvent.order.paymentMethod !== 'BANK_TRANSFER') {
    throw new Error('❌ Bank transfer order creation event missing or incorrect');
  }

  // Verify Bank Transfer Order Status
  const dbBankOrder = await OrderModel.findById(bankOrder._id);
  if (dbBankOrder?.status !== 'PENDING' || dbBankOrder?.paymentStatus !== 'PENDING') {
    throw new Error(`❌ Bank order should be PENDING/PENDING, got ${dbBankOrder?.status}/${dbBankOrder?.paymentStatus}`);
  }

  // Check Customer Bank Transfer Notification
  const bankCustNotif = await NotificationModel.findOne({
    recipient: customerUser._id,
    type: 'ORDER_CREATED',
  }).sort({ createdAt: -1 });

  if (!bankCustNotif || !bankCustNotif.title.includes('Bank Transfer')) {
    throw new Error('❌ Customer did not receive Bank Transfer notification');
  }
  console.log(`✅ Bank transfer order placed -> Customer received: "${bankCustNotif.title}" - "${bankCustNotif.message}"`);

  // Admin verifies the Bank Transfer Payment
  const { AdminPaymentService } = await import('../admin/payments/adminPayment.service');
  const adminPaymentService = new AdminPaymentService();

  const bankPayments = await paymentRepo.findByOrder(String(bankOrder._id));
  const bankPayment = bankPayments[0];
  if (!bankPayment) {
    throw new Error('❌ Payment record not created for bank transfer order');
  }

  const bankPaymentVerifiedPromise = new Promise<any>((resolve) => {
    customerSocket.once('order:payment_status_updated', (data) => resolve(data));
  });

  await adminPaymentService.updateStatus(String(bankPayment._id), 'SUCCESS');
  const bankPaymentEvent = await bankPaymentVerifiedPromise;

  if (bankPaymentEvent?.paymentStatus !== 'PAID') {
    throw new Error('❌ Customer did not receive PAID socket update for bank payment verification');
  }

  const updatedBankOrder = await OrderModel.findById(bankOrder._id);
  if (updatedBankOrder?.paymentStatus !== 'PAID') {
    throw new Error('❌ Bank order paymentStatus was not updated to PAID');
  }
  if (updatedBankOrder?.status !== 'PENDING') {
    throw new Error(`❌ Bank order was auto-confirmed before admin action! Status: ${updatedBankOrder?.status}`);
  }

  // Check Customer Bank Verification Notification
  const bankVerifiedNotif = await NotificationModel.findOne({
    recipient: customerUser._id,
    type: 'ORDER_PAYMENT',
  }).sort({ createdAt: -1 });

  if (!bankVerifiedNotif || !bankVerifiedNotif.title.includes('Payment Verified')) {
    throw new Error('❌ Customer did not receive Payment Verified notification');
  }
  console.log(`✅ Admin verified bank transfer -> Customer received: "${bankVerifiedNotif.title}" - "${bankVerifiedNotif.message}"`);

  // Admin now confirms the Bank Transfer Order
  await adminOrderService.updateStatus(String(bankOrder._id), 'CONFIRMED');
  const finalBankOrder = await OrderModel.findById(bankOrder._id);
  if (finalBankOrder?.status !== 'CONFIRMED') {
    throw new Error('❌ Bank order was not confirmed by admin');
  }
  console.log('✅ Bank transfer order confirmed by admin successfully');

  // -------------------------------------------------------------
  // Clean Up
  // -------------------------------------------------------------
  console.log('\n--- Cleaning Up Test Data ---');
  customerSocket.disconnect();
  adminSocket.disconnect();
  await new Promise((r) => httpServer.close(r));

  await OrderItemModel.deleteMany({ order: { $in: [order._id, bankOrder._id] } });
  await OrderModel.deleteMany({ _id: { $in: [order._id, bankOrder._id] } });
  await CartItemModel.deleteMany({ cart: cartData.cart._id });
  await CartModel.findByIdAndDelete(cartData.cart._id);
  await AddressModel.findByIdAndDelete(address._id);
  await ProductVariantModel.findByIdAndDelete(variant._id);
  await ProductModel.findByIdAndDelete(product._id);
  await CategoryModel.findByIdAndDelete(category._id);
  await NotificationModel.deleteMany({ recipient: { $in: [customerUser._id, adminUser._id] } });
  await UserModel.deleteMany({ _id: { $in: [customerUser._id, adminUser._id] } });

  await disconnectMongoDB();

  console.log('\n================================================================');
  console.log('🎉 ALL CART, ORDER, RAZORPAY & BANK TRANSFER FLOW TESTS PASSED (100%)');
  console.log('================================================================\n');
}

runOrderCartTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});


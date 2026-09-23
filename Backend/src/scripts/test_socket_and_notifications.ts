import http from 'http';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import app from '../../app';
import { connectMongoDB, disconnectMongoDB } from '../database/mongodb/connection';
import { initSocketServer } from '../socket/socket.server';
import UserModel from '../modules/users/user.model';
import TicketModel from '../modules/support/models/ticket.model';
import TicketMessageModel from '../modules/support/models/ticketMessage.model';
import NotificationModel from '../modules/notifications/notification.model';
import { TicketService } from '../modules/support/services/ticket.service';
import { TicketMessageService } from '../modules/support/services/ticketMessage.service';
import { TicketRepository } from '../modules/support/repositories/ticket.repository';
import { TicketMessageRepository } from '../modules/support/repositories/ticketMessage.repository';
import { notificationService } from '../modules/notifications/notification.service';
import { env } from '../config/env';

async function runTests() {
  console.log('================================================================');
  console.log('🚀 STARTING REAL-TIME SOCKETS & NOTIFICATION TEST SUITE');
  console.log('================================================================\n');

  await connectMongoDB();

  // 1. Spin up test HTTP + Socket.io Server on random available port
  const testPort = 6099;
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  await new Promise<void>((resolve) => httpServer.listen(testPort, resolve));
  console.log(`✅ Test server running on http://127.0.0.1:${testPort}`);

  const serverUrl = `http://127.0.0.1:${testPort}`;

  // 2. Setup Test Users (Customer & Admin)
  const testEmailCustomer = `test_cust_${Date.now()}@example.com`;
  const testEmailAdmin = `test_admin_${Date.now()}@example.com`;

  const customerUser = await UserModel.create({
    name: 'Socket Test Customer',
    email: testEmailCustomer,
    role: 'customer',
    isVerified: true,
    status: 'active',
  });

  const adminUser = await UserModel.create({
    name: 'Socket Test Admin',
    email: testEmailAdmin,
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

  console.log(`✅ Test users created: Customer (${customerUser._id}) & Admin (${adminUser._id})`);

  // 3. Connect Sockets via Socket.io-client
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
      customerSocket.on('connect', () => {
        console.log(`✅ Customer socket connected (${customerSocket.id})`);
        resolve();
      });
      customerSocket.on('connect_error', reject);
    }),
    new Promise<void>((resolve, reject) => {
      adminSocket.on('connect', () => {
        console.log(`✅ Admin socket connected (${adminSocket.id})`);
        resolve();
      });
      adminSocket.on('connect_error', reject);
    }),
  ]);

  // 4. Test FCM Token Registration
  console.log('\n--- Test Step 1: Register FCM Device Token ---');
  await notificationService.registerDeviceToken(String(customerUser._id), 'mock_fcm_token_customer_device_1');
  const userWithFcm = await UserModel.findById(customerUser._id);
  if (!userWithFcm?.fcmTokens?.includes('mock_fcm_token_customer_device_1')) {
    throw new Error('❌ FCM token was not properly registered on customer profile');
  }
  console.log('✅ FCM device token successfully registered');

  // 5. Test Support Ticket Creation & Admin Real-Time Alert
  console.log('\n--- Test Step 2: Support Ticket Creation & Real-Time Broadcast ---');
  const ticketRepo = new TicketRepository();
  const msgRepo = new TicketMessageRepository();
  const ticketService = new TicketService(ticketRepo, msgRepo);
  const msgService = new TicketMessageService(msgRepo, ticketRepo);

  const adminTicketCreatedPromise = new Promise<any>((resolve) => {
    adminSocket.once('ticket:created', (data) => resolve(data));
  });

  const createdTicket = await ticketService.createTicket(String(customerUser._id), {
    subject: 'Urgent: Issue with Earthing Rod connection',
    category: 'TECHNICAL',
    priority: 'HIGH',
    message: 'Hello, need quick help with wiring specifications.',
  });

  const adminReceivedTicket = await adminTicketCreatedPromise;
  if (!adminReceivedTicket?.ticket?._id) {
    throw new Error('❌ Admin did not receive ticket:created live socket broadcast');
  }
  console.log(`✅ Admin received real-time socket alert for Ticket #${createdTicket.ticketNumber}`);

  // 6. Test Live Chat Messaging (Both inside ticket room)
  console.log('\n--- Test Step 3: Live Chat Message Stream (Both Users In Room) ---');
  const ticketId = String(createdTicket._id);

  // Join room
  customerSocket.emit('ticket:join', { ticketId });
  adminSocket.emit('ticket:join', { ticketId });
  await new Promise((r) => setTimeout(r, 200)); // wait for room join

  const customerMsgPromise = new Promise<any>((resolve) => {
    customerSocket.once('ticket:message', (data) => resolve(data));
  });

  // Admin replies to ticket
  const initialUnreadCount = await NotificationModel.countDocuments({ recipient: customerUser._id });

  await msgService.replyToTicket(ticketId, String(adminUser._id), {
    message: 'Hello! I am looking into your wiring diagrams right now.',
    isInternalNote: false,
  });

  const liveMessageReceived = await customerMsgPromise;
  if (!liveMessageReceived?.message?.message.includes('wiring diagrams')) {
    throw new Error('❌ Customer did not receive real-time message in ticket room');
  }
  console.log('✅ Customer received live message in chat room instantly');

  // Verify that since customer was in the room, no duplicate offline notification was created
  const unreadCountAfterLive = await NotificationModel.countDocuments({ recipient: customerUser._id });
  if (unreadCountAfterLive !== initialUnreadCount) {
    throw new Error('❌ Offline notification was created even though user was active in live chat room');
  }
  console.log('✅ Smart presence check verified: No unnecessary notification spammed while user was live');

  // 7. Test Offline / Out-of-Room Smart Notification
  console.log('\n--- Test Step 4: Smart Offline Notification (User Left Room) ---');
  customerSocket.emit('ticket:leave', { ticketId });
  await new Promise((r) => setTimeout(r, 200)); // wait for room leave

  const customerSocketNotifPromise = new Promise<any>((resolve) => {
    customerSocket.once('notification:new', (data) => resolve(data));
  });

  await msgService.replyToTicket(ticketId, String(adminUser._id), {
    message: 'Here is the specification sheet link. Please let us know if this solves it.',
    isInternalNote: false,
  });

  const socketNotification = await customerSocketNotifPromise;
  if (!socketNotification?.title?.includes('Reply on Ticket')) {
    throw new Error('❌ Customer did not receive notification:new event on personal socket channel');
  }

  const dbNotification = await NotificationModel.findOne({
    recipient: customerUser._id,
    type: 'TICKET_REPLY',
  }).sort({ createdAt: -1 });

  if (!dbNotification || !dbNotification.message.includes('specification sheet')) {
    throw new Error('❌ Database notification was not generated for offline customer');
  }
  console.log(`✅ Smart offline notification generated: "${dbNotification.title}" - "${dbNotification.message}"`);

  // 8. Test Status Change Socket Broadcast & Notification
  console.log('\n--- Test Step 5: Ticket Status Change & Customer Alert ---');
  const customerStatusPromise = new Promise<any>((resolve) => {
    customerSocket.once('ticket:updated', (data) => resolve(data));
  });

  await ticketService.updateStatus(ticketId, 'RESOLVED', String(adminUser._id));
  const statusUpdate = await customerStatusPromise;
  if (statusUpdate?.status !== 'RESOLVED') {
    throw new Error('❌ Customer did not receive ticket:updated socket event');
  }
  console.log('✅ Customer received real-time ticket status update');

  // 9. Test Notification Reading & Pagination
  console.log('\n--- Test Step 6: Notification Retrieval, Read Status & Unread Count ---');
  const notifListBefore = await notificationService.getUserNotifications(String(customerUser._id), { page: 1, limit: 10 });
  if (notifListBefore.unreadCount < 1) {
    throw new Error('❌ Unread count should be >= 1');
  }
  console.log(`✅ Retrieved ${notifListBefore.items.length} notifications, unread count = ${notifListBefore.unreadCount}`);

  // Mark single as read
  const notifToMark = notifListBefore.items[0];
  await notificationService.markAsRead(String(notifToMark._id), String(customerUser._id));
  const markedDoc = await NotificationModel.findById(notifToMark._id);
  if (!markedDoc?.isRead) {
    throw new Error('❌ Notification was not marked as read');
  }
  console.log('✅ Notification successfully marked as read');

  // Mark all as read
  await notificationService.markAllAsRead(String(customerUser._id));
  const notifListAfter = await notificationService.getUserNotifications(String(customerUser._id), { page: 1, limit: 10 });
  if (notifListAfter.unreadCount !== 0) {
    throw new Error(`❌ Expected unreadCount = 0, got ${notifListAfter.unreadCount}`);
  }
  console.log('✅ Mark all as read verified: unread count is now 0');

  // 10. Clean Up
  console.log('\n--- Cleaning Up Test Sockets and Test Data ---');
  customerSocket.disconnect();
  adminSocket.disconnect();
  await new Promise((r) => httpServer.close(r));

  await TicketMessageModel.deleteMany({ ticket: ticketId });
  await TicketModel.findByIdAndDelete(ticketId);
  await NotificationModel.deleteMany({ recipient: { $in: [customerUser._id, adminUser._id] } });
  await UserModel.deleteMany({ _id: { $in: [customerUser._id, adminUser._id] } });

  await disconnectMongoDB();

  console.log('\n================================================================');
  console.log('🎉 ALL SOCKET & NOTIFICATION TESTS PASSED SUCCESSFULLY (100%)');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});

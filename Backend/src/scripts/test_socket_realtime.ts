import mongoose from 'mongoose';
import { io as Client } from 'socket.io-client';
import { createServer } from 'http';
import { initSocketServer, getIO, isUserInTicketRoom } from '../socket/socket.server';
import express from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

async function run() {
  console.log('Starting socket test...');
  
  const app = express();
  const httpServer = createServer(app);
  
  initSocketServer(httpServer);
  
  await new Promise<void>((resolve) => httpServer.listen(4005, () => resolve()));
  console.log('Test server listening on port 4005');

  // Create a mock token for User 1
  const token1 = jwt.sign({ id: new mongoose.Types.ObjectId().toString(), role: 'admin' }, env.JWT_ACCESS_SECRET);
  // Create a mock token for User 2
  const userId2 = new mongoose.Types.ObjectId().toString();
  const token2 = jwt.sign({ id: userId2, role: 'customer' }, env.JWT_ACCESS_SECRET);

  const client1 = Client('http://localhost:4005', { auth: { token: token1 } });
  const client2 = Client('http://localhost:4005', { auth: { token: token2 } });

  client1.on('connect', () => console.log('Client 1 (Admin) connected:', client1.id));
  client2.on('connect', () => console.log('Client 2 (Customer) connected:', client2.id));

  const ticketId = new mongoose.Types.ObjectId().toString();

  await new Promise(r => setTimeout(r, 500));

  console.log('Client 1 joining ticket room...');
  client1.emit('ticket:join', { ticketId });
  
  console.log('Client 2 joining ticket room...');
  client2.emit('ticket:join', { ticketId });

  await new Promise(r => setTimeout(r, 500));

  client1.on('ticket:message', (data) => {
    console.log('[Client 1] Received ticket message:', data);
  });

  client2.on('ticket:message', (data) => {
    console.log('[Client 2] Received ticket message:', data);
  });

  client2.on('ticket:typing', (data) => {
    console.log('[Client 2] Received typing indicator:', data.isTyping);
  });

  console.log(`Is Client 2 in room? ${isUserInTicketRoom(ticketId, userId2)}`);

  console.log('Emitting typing event from Client 1...');
  client1.emit('ticket:typing', { ticketId, isTyping: true });

  await new Promise(r => setTimeout(r, 500));

  console.log('Backend emitting ticket message...');
  const io = getIO();
  if (io) {
    io.to(`ticket:${ticketId}`).emit('ticket:message', { ticketId, message: 'Hello from backend' });
  }

  await new Promise(r => setTimeout(r, 1000));

  client1.disconnect();
  client2.disconnect();
  httpServer.close();
  console.log('Test complete.');
  process.exit(0);
}

run().catch(console.error);

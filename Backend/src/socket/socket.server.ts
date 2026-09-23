import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../common/logger/logger';
import UserModel from '../modules/users/user.model';

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      userId: string;
      email?: string;
      role?: string;
      name?: string;
    };
  };
}

let io: Server | null = null;

/**
 * Map of userId -> Set of socketIds for fast presence checks
 */
const userSocketsMap = new Map<string, Set<string>>();

/**
 * Initialize Socket.io Server
 */
export function initSocketServer(httpServer: HttpServer): Server {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
          ...env.CLIENT_URLS,
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
        ];
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in dev/staging
      },
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Authentication Middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      let token: string | undefined =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';').reduce((acc, c) => {
          const [key, val] = c.trim().split('=');
          if (key && val) acc[key] = decodeURIComponent(val);
          return acc;
        }, {} as Record<string, string>);
        token = cookies['accessToken'] || cookies['jwt'] || cookies['token'];
      }

      if (!token) {
        logger.warn(`[Socket.io] Unauthenticated connection attempt from socket: ${socket.id}`);
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
      const userId = decoded.id || decoded.userId || decoded._id || decoded.sub;

      if (!userId) {
        return next(new Error('Invalid token payload'));
      }

      let role = decoded.role ? String(decoded.role).toLowerCase() : undefined;
      let name = decoded.name;
      let email = decoded.email;

      if (!role) {
        const userDoc = await UserModel.findById(userId).select('name email role').lean();
        if (userDoc) {
          role = (userDoc.role || 'customer').toLowerCase();
          name = name || userDoc.name;
          email = email || userDoc.email;
        } else {
          role = 'customer';
        }
      }

      socket.data.user = {
        userId: String(userId),
        email,
        role,
        name,
      };

      return next();
    } catch (err: any) {
      logger.warn(`[Socket.io] Auth verification failed: ${err.message}`);
      return next(new Error('Authentication failed'));
    }
  });

  // Connection Handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    const userId = user.userId;
    logger.info(`[Socket.io] User connected: ${userId} (${user.role}) - Socket ID: ${socket.id}`);

    // Track active socket
    if (!userSocketsMap.has(userId)) {
      userSocketsMap.set(userId, new Set());
    }
    userSocketsMap.get(userId)!.add(socket.id);

    // Auto-join personal room
    const userRoom = `user:${userId}`;
    socket.join(userRoom);

    // Auto-join role channels (admin, staff)
    if (['admin', 'super_admin', 'manager', 'seller'].includes(user.role || '')) {
      socket.join('role:admin');
      socket.join('role:staff');
    }

    // -------------------------------------------------------------
    // Ticket Live Chat Events
    // -------------------------------------------------------------
    socket.on('ticket:join', (data: { ticketId: string }) => {
      if (!data?.ticketId) return;
      const room = `ticket:${data.ticketId}`;
      socket.join(room);
      logger.debug(`[Socket.io] Socket ${socket.id} (user ${userId}) joined ${room}`);

      socket.to(room).emit('ticket:user_joined', {
        ticketId: data.ticketId,
        userId: userId,
        name: user.name,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('ticket:leave', (data: { ticketId: string }) => {
      if (!data?.ticketId) return;
      const room = `ticket:${data.ticketId}`;
      socket.leave(room);
      logger.debug(`[Socket.io] Socket ${socket.id} (user ${userId}) left ${room}`);

      socket.to(room).emit('ticket:user_left', {
        ticketId: data.ticketId,
        userId: userId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('ticket:typing', (data: { ticketId: string; isTyping: boolean }) => {
      if (!data?.ticketId) return;
      const room = `ticket:${data.ticketId}`;
      socket.to(room).emit('ticket:typing', {
        ticketId: data.ticketId,
        userId: userId,
        userName: user.name,
        isTyping: !!data.isTyping,
      });
    });

    // -------------------------------------------------------------
    // Disconnect Handler
    // -------------------------------------------------------------
    socket.on('disconnect', (reason) => {
      logger.info(`[Socket.io] User disconnected: ${userId} - Reason: ${reason}`);
      const sockets = userSocketsMap.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSocketsMap.delete(userId);
        }
      }
    });
  });

  logger.info('[Socket.io] Real-time engine initialized');
  return io;
}

/**
 * Get Socket.io Server instance
 */
export function getIO(): Server | null {
  return io;
}

/**
 * Check if a user is currently connected online
 */
export function isUserOnline(userId: string): boolean {
  const sockets = userSocketsMap.get(String(userId));
  return !!(sockets && sockets.size > 0);
}

/**
 * Check if a user is currently in a specific ticket chat room
 */
export function isUserInTicketRoom(ticketId: string, userId: string): boolean {
  if (!io) return false;
  const roomName = `ticket:${ticketId}`;
  const room = io.sockets.adapter.rooms.get(roomName);
  if (!room || room.size === 0) return false;

  const userSockets = userSocketsMap.get(String(userId));
  if (!userSockets || userSockets.size === 0) return false;

  // Check if any socket belonging to userId is in the room
  for (const socketId of userSockets) {
    if (room.has(socketId)) {
      return true;
    }
  }

  return false;
}

/**
 * Emit event to a specific ticket live chat room
 */
export function emitToTicket(ticketId: string, event: string, data: any): void {
  if (!io) return;
  io.to(`ticket:${ticketId}`).emit(event, data);
}

/**
 * Emit event directly to a user's personal channel
 */
export function emitToUser(userId: string, event: string, data: any): void {
  if (!io) return;
  io.to(`user:${String(userId)}`).emit(event, data);
}

/**
 * Emit event to all administrators/staff
 */
export function emitToAdmins(event: string, data: any): void {
  if (!io) return;
  io.to('role:admin').emit(event, data);
}

/**
 * Emit event to a specific role channel
 */
export function emitToRole(role: string, event: string, data: any): void {
  if (!io) return;
  io.to(role.startsWith('role:') ? role : `role:${role}`).emit(event, data);
}

/**
 * Emit event to any named room
 */
export function emitToRoom(room: string, event: string, data: any): void {
  if (!io) return;
  io.to(room).emit(event, data);
}

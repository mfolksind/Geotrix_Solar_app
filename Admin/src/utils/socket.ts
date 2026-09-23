import { io, Socket } from 'socket.io-client';
import { API_URL, getAuthToken } from './api';

let adminSocket: Socket | null = null;

export const getAdminSocket = (): Socket | null => {
  if (typeof window === 'undefined') return null;

  const token = getAuthToken();
  if (!token) {
    if (adminSocket) {
      adminSocket.disconnect();
      adminSocket = null;
    }
    return null;
  }

  if (!adminSocket || !adminSocket.connected) {
    adminSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    adminSocket.on('connect', () => {
      console.log('[Admin Socket] Connected successfully:', adminSocket?.id);
    });

    adminSocket.on('connect_error', (err) => {
      console.warn('[Admin Socket] Connection error:', err.message);
    });

    adminSocket.on('disconnect', (reason) => {
      console.log('[Admin Socket] Disconnected:', reason);
    });
  }

  return adminSocket;
};

export const disconnectAdminSocket = () => {
  if (adminSocket) {
    adminSocket.disconnect();
    adminSocket = null;
  }
};

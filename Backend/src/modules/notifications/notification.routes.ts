import { Router } from 'express';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  registerFcmToken,
  removeFcmToken,
  broadcastNotification,
} from './notification.controller';
import { authenticate, authorize } from '../auth/auth.middleware';

const router = Router();

// User notification routes
router.get('/', authenticate, getMyNotifications);
router.patch('/read-all', authenticate, markAllNotificationsRead);
router.patch('/:id/read', authenticate, markNotificationRead);
router.delete('/:id', authenticate, deleteNotification);

// FCM device token registration
router.post('/fcm-token', authenticate, registerFcmToken);
router.delete('/fcm-token', authenticate, removeFcmToken);

// Admin Broadcast route
router.post('/broadcast', authenticate, authorize('admin', 'super_admin', 'manager'), broadcastNotification);

export default router;

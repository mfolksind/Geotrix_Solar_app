import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { notificationService } from './notification.service';
import ApiError from '../../common/errors/ApiError';

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || (req as any).user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
  const type = req.query.type ? String(req.query.type) : undefined;

  const result = await notificationService.getUserNotifications(userId, {
    page,
    limit,
    isRead,
    type,
  });

  return res.status(200).json({
    success: true,
    data: result.items,
    unreadCount: result.unreadCount,
    meta: result.meta,
  });
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || (req as any).user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { id } = req.params;
  const updated = await notificationService.markAsRead(id, userId);

  return res.status(200).json({
    success: true,
    data: updated,
    message: 'Notification marked as read',
  });
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || (req as any).user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const result = await notificationService.markAllAsRead(userId);

  return res.status(200).json({
    success: true,
    data: result,
    message: 'All notifications marked as read',
  });
});

export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || (req as any).user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { id } = req.params;
  const result = await notificationService.deleteNotification(id, userId);

  return res.status(200).json({
    success: true,
    data: result,
    message: 'Notification deleted successfully',
  });
});

export const registerFcmToken = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || (req as any).user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { token } = req.body;
  const result = await notificationService.registerDeviceToken(userId, token);

  return res.status(200).json({
    success: true,
    data: result,
    message: 'FCM token registered successfully',
  });
});

export const removeFcmToken = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id || (req as any).user?._id;
  if (!userId) throw new ApiError(401, 'Unauthorized');

  const { token } = req.body;
  const result = await notificationService.removeDeviceToken(userId, token);

  return res.status(200).json({
    success: true,
    data: result,
    message: 'FCM token removed successfully',
  });
});

export const broadcastNotification = asyncHandler(async (req: Request, res: Response) => {
  const { role, title, message, type, data, imageUrl } = req.body;
  if (!title || !message) throw new ApiError(400, 'Title and message are required');

  await notificationService.sendToRole(role || 'admin', {
    title,
    message,
    type: type || 'SYSTEM_ALERT',
    data,
    imageUrl,
  });

  return res.status(200).json({
    success: true,
    message: 'Notification broadcasted successfully',
  });
});

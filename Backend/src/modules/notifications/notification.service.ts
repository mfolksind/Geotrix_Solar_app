import NotificationModel from './notification.model';
import { INotificationDocument, SendNotificationDTO } from './notification.interface';
import UserModel from '../users/user.model';
import { emitToUser, emitToAdmins, emitToRole } from '../../socket/socket.server';
import { sendPushNotification } from '../../config/firebase';
import logger from '../../common/logger/logger';
import ApiError from '../../common/errors/ApiError';

export class NotificationService {
  /**
   * Send a single notification across In-App, Socket, and Firebase Push channels
   */
  public async sendNotification(dto: SendNotificationDTO): Promise<INotificationDocument> {
    try {
      const recipientId =
        dto.recipient && typeof dto.recipient === 'object' && (dto.recipient as any)._id
          ? String((dto.recipient as any)._id)
          : String(dto.recipient);

      const senderId =
        dto.sender && typeof dto.sender === 'object' && (dto.sender as any)._id
          ? String((dto.sender as any)._id)
          : dto.sender || null;

      // 1. Create In-App Notification in DB
      const notification = await NotificationModel.create({
        recipient: recipientId,
        sender: senderId,
        title: dto.title,
        message: dto.message,
        type: dto.type,
        data: dto.data || {},
        imageUrl: dto.imageUrl,
        channels: dto.channels || ['IN_APP', 'PUSH', 'SOCKET'],
        isRead: false,
      });

      // 2. Real-time Socket Dispatch
      if (!dto.skipSocket) {
        emitToUser(recipientId, 'notification:new', {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data,
          imageUrl: notification.imageUrl,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        });
      }

      // 3. Firebase Cloud Messaging (FCM) Push Dispatch
      if (!dto.skipPush) {
        try {
          const user = await UserModel.findById(dto.recipient).select('fcmTokens').lean();
          if (user && user.fcmTokens && user.fcmTokens.length > 0) {
            const pushResult = await sendPushNotification(user.fcmTokens, {
              title: dto.title,
              body: dto.message,
              imageUrl: dto.imageUrl,
              data: {
                notificationId: String(notification._id),
                type: dto.type,
                ...(dto.data || {}),
              },
            });

            // Cleanup invalid / expired device tokens
            if (pushResult.invalidTokens.length > 0) {
              await UserModel.findByIdAndUpdate(dto.recipient, {
                $pull: { fcmTokens: { $in: pushResult.invalidTokens } },
              });
              logger.info(`[Notifications] Cleaned up ${pushResult.invalidTokens.length} expired FCM token(s) for user ${dto.recipient}`);
            }
          }
        } catch (pushErr) {
          logger.warn('[Notifications] Failed to send push notification', pushErr);
        }
      }

      return notification;
    } catch (error: any) {
      if (error?.errors) {
        console.error('[NotificationService] Mongoose Validation Errors:', JSON.stringify(error.errors, null, 2));
      }
      logger.error('[Notifications] Error sending notification', error);
      throw error;
    }
  }

  /**
   * Send notification to all users of a specific role (e.g., admin, staff)
   */
  public async sendToRole(
    role: 'admin' | 'staff' | 'seller',
    dto: Omit<SendNotificationDTO, 'recipient'>
  ): Promise<void> {
    try {
      const roleFilter =
        role === 'admin' || role === 'staff'
          ? { role: { $in: ['admin', 'super_admin', 'manager'] } }
          : { role };

      const recipients = await UserModel.find(roleFilter).select('_id fcmTokens').lean();
      if (!recipients || recipients.length === 0) return;

      // Real-time broadcast to socket role room
      if (!dto.skipSocket) {
        const payload = {
          title: dto.title,
          message: dto.message,
          type: dto.type,
          data: dto.data || {},
          imageUrl: dto.imageUrl,
          createdAt: new Date(),
        };
        if (role === 'admin' || role === 'staff') {
          emitToAdmins('notification:new', payload);
        } else {
          emitToRole(`role:${role}`, 'notification:new', payload);
        }
      }

      // Persist individual notifications and send push
      for (const user of recipients) {
        await this.sendNotification({
          ...dto,
          recipient: String(user._id),
          skipSocket: true, // already broadcasted to role room
        });
      }
    } catch (error) {
      logger.error(`[Notifications] Error sending notification to role ${role}`, error);
    }
  }

  /**
   * Get paginated notifications for a user with unread count
   */
  public async getUserNotifications(
    userId: string,
    query: { page?: number; limit?: number; isRead?: boolean; type?: string }
  ) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 20;
    const skip = (page - 1) * limit;

    const filter: any = { recipient: userId };
    if (typeof query.isRead === 'boolean') {
      filter.isRead = query.isRead;
    }
    if (query.type) {
      filter.type = query.type;
    }

    const [items, total, unreadCount] = await Promise.all([
      NotificationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return {
      items,
      unreadCount,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Mark a single notification as read
   */
  public async markAsRead(notificationId: string, userId: string) {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    emitToUser(userId, 'notification:read', { id: notificationId });
    return notification;
  }

  /**
   * Mark all notifications for a user as read
   */
  public async markAllAsRead(userId: string) {
    const result = await NotificationModel.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    emitToUser(userId, 'notification:read_all', {});
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a notification
   */
  public async deleteNotification(notificationId: string, userId: string) {
    const deleted = await NotificationModel.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    if (!deleted) {
      throw new ApiError(404, 'Notification not found');
    }

    return deleted;
  }

  /**
   * Register or update user device FCM token
   */
  public async registerDeviceToken(userId: string, token: string) {
    if (!token || typeof token !== 'string') {
      throw new ApiError(400, 'Device token is required');
    }

    const cleanToken = token.trim();
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { fcmTokens: cleanToken } },
      { new: true }
    ).select('fcmTokens');

    return { success: true, count: updated?.fcmTokens?.length || 0 };
  }

  /**
   * Remove a device FCM token (e.g. on logout)
   */
  public async removeDeviceToken(userId: string, token: string) {
    if (!token || typeof token !== 'string') return;

    await UserModel.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: token.trim() },
    });

    return { success: true };
  }
}

export const notificationService = new NotificationService();

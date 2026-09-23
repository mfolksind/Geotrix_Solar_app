import { Schema, model } from 'mongoose';
import { INotificationDocument } from './notification.interface';

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'TICKET_REPLY',
        'TICKET_CREATED',
        'TICKET_STATUS',
        'ORDER_CREATED',
        'ORDER_STATUS',
        'ORDER_PAYMENT',
        'CART_REMINDER',
        'SYSTEM_ALERT',
        'PROMOTION',
      ],
      default: 'SYSTEM_ALERT',
      index: true,
    },
    data: { type: Schema.Types.Mixed, default: {} },
    channels: {
      type: [String],
      default: ['IN_APP', 'PUSH', 'SOCKET'],
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    imageUrl: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const NotificationModel = model<INotificationDocument>('Notification', notificationSchema);

export default NotificationModel;

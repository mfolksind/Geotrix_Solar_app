import { Document, Types } from 'mongoose';

export type NotificationType =
  | 'TICKET_REPLY'
  | 'TICKET_CREATED'
  | 'TICKET_STATUS'
  | 'ORDER_CREATED'
  | 'ORDER_STATUS'
  | 'ORDER_PAYMENT'
  | 'CART_REMINDER'
  | 'SYSTEM_ALERT'
  | 'PROMOTION';

export type NotificationChannel = 'IN_APP' | 'PUSH' | 'SOCKET' | 'EMAIL';

export interface INotification {
  recipient: Types.ObjectId | string;
  sender?: Types.ObjectId | string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  isRead: boolean;
  readAt?: Date | null;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationDocument extends INotification, Document {}

export interface SendNotificationDTO {
  recipient: string;
  sender?: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
  imageUrl?: string;
  channels?: NotificationChannel[];
  skipPush?: boolean;
  skipSocket?: boolean;
}

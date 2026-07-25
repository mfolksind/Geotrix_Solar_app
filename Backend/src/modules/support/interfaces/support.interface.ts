import { Document, Types } from 'mongoose';
import { TicketPriority, TicketStatus, Attachment } from '../types/support.types';

export interface ITicketDocument extends Document {
  ticketNumber: string;
  user: Types.ObjectId | string;
  subject: string;
  category?: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo?: Types.ObjectId | string | null;
  lastMessageAt?: Date;
  createdBy?: Types.ObjectId | string;
  updatedBy?: Types.ObjectId | string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicketMessageDocument extends Document {
  ticket: Types.ObjectId | string;
  sender: Types.ObjectId | string;
  message: string;
  attachments?: Attachment[];
  isInternalNote?: boolean;
  createdAt: Date;
}

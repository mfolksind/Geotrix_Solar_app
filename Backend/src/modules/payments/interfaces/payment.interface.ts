import { Document, Types } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../types/payment.types';

export interface IPaymentDocument extends Document {
  order: Types.ObjectId | string;
  user: Types.ObjectId | string;
  paymentMethod: PaymentMethod;
  paymentProvider?: string;
  transactionId?: string;
  providerOrderId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: Date;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

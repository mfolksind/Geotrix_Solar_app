import { Document, Types } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../types/payment.types';

export interface IPaymentDocument extends Document {
  order: Types.ObjectId | string;
  user: Types.ObjectId | string;
  paymentMethod: PaymentMethod | string;
  paymentProvider?: string;
  transactionId?: string;
  providerOrderId?: string;
  subtotal?: number;
  taxAmount?: number;
  cgst?: number;
  sgst?: number;
  discount?: number;
  shippingFee?: number;
  amount: number;
  currency: string;
  status: PaymentStatus | string;
  paidAt?: Date;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

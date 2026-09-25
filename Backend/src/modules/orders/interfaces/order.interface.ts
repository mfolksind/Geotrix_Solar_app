import { Document, Types } from 'mongoose';
import { OrderStatus, PaymentStatus } from '../types/order.types';

export interface IOrderBillingBreakup {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  shippingCharge: number;
  totalAmount: number;
}

export interface IOrderDocument extends Document {
  orderNumber: string;
  user: Types.ObjectId | string;
  address: Types.ObjectId | string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'RAZORPAY' | 'BANK_TRANSFER' | string;
  subtotal: number;
  shippingCharge: number;
  discount: number;
  taxRate: number;
  tax: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItemDocument extends Document {
  order: Types.ObjectId | string;
  product: Types.ObjectId | string;
  variant: Types.ObjectId | string;
  productName: string;
  variantName: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

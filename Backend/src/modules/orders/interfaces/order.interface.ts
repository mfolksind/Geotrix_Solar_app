import { Document, Types } from 'mongoose';
import { OrderStatus, PaymentStatus } from '../types/order.types';

export interface IOrderDocument extends Document {
  orderNumber: string;
  user: Types.ObjectId | string;
  address: Types.ObjectId | string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shippingCharge: number;
  discount: number;
  tax: number;
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
  unitPrice: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

import { Document, Types } from 'mongoose';

export interface ICartBillingBreakup {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  shippingFee: number;
  totalAmount: number;
}

export interface ICartDocument extends Document {
  user: Types.ObjectId | string;
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  shippingFee: number;
  couponCode?: string;
  discountAmount: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItemDocument extends Document {
  cart: Types.ObjectId | string;
  product: Types.ObjectId | string;
  variant: Types.ObjectId | string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

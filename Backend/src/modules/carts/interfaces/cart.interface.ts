import { Document, Types } from 'mongoose';

export interface ICartDocument extends Document {
  user: Types.ObjectId | string;
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
  couponCode?: string;
  discountAmount: number;
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

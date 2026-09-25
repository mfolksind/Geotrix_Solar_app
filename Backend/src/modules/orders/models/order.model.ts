import { Schema, model } from 'mongoose';
import { IOrderDocument } from '../interfaces/order.interface';

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    address: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['RAZORPAY', 'BANK_TRANSFER'],
      default: 'RAZORPAY',
      index: true,
    },
    subtotal: { type: Number, required: true },
    shippingCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 18 },
    tax: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default model<IOrderDocument>('Order', orderSchema);

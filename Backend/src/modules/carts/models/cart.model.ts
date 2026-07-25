import { Schema, model } from 'mongoose';
import { ICartDocument } from '../interfaces/cart.interface';

const cartSchema = new Schema<ICartDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    totalItems: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    couponCode: { type: String, trim: true },
    discountAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cartSchema.index({ user: 1 });

export default model<ICartDocument>('Cart', cartSchema);

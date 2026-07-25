import { Schema, model } from 'mongoose';
import { ICartItemDocument } from '../interfaces/cart.interface';

const cartItemSchema = new Schema<ICartItemDocument>(
  {
    cart: { type: Schema.Types.ObjectId, ref: 'Cart', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { timestamps: true }
);

cartItemSchema.index({ cart: 1 });
cartItemSchema.index({ variant: 1 });

export default model<ICartItemDocument>('CartItem', cartItemSchema);

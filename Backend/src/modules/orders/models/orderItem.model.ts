import { Schema, model } from 'mongoose';
import { IOrderItemDocument } from '../interfaces/order.interface';

const orderItemSchema = new Schema<IOrderItemDocument>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    productName: { type: String, required: true },
    variantName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { timestamps: true }
);

orderItemSchema.index({ order: 1 });

export default model<IOrderItemDocument>('OrderItem', orderItemSchema);

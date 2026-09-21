import { Schema, model } from 'mongoose';
import { IProductDocument } from './product.interface';

const productSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    family: { type: Schema.Types.ObjectId, ref: 'Family', index: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productSchema.index({ name: 1 });
productSchema.index({ isDeleted: 1, status: 1 });
productSchema.index({ family: 1, category: 1 });

export default model<IProductDocument>('Product', productSchema);

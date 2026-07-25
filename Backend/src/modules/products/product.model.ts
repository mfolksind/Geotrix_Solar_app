import { Schema, model } from 'mongoose';
import { IProductDocument } from './product.interface';

const productSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    brand: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

productSchema.index({ name: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ status: 1 });

export default model<IProductDocument>('Product', productSchema);

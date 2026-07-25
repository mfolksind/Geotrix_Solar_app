import { Schema, model } from 'mongoose';
import { IProductImageDocument } from './product.interface';

const imageSchema = new Schema<IProductImageDocument>(
  {
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true, index: true },
    url: { type: String, required: true },
    publicId: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

imageSchema.index({ variant: 1 });
imageSchema.index({ isPrimary: 1 });

export default model<IProductImageDocument>('ProductImage', imageSchema);

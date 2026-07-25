import { Schema, model } from 'mongoose';
import { IProductVariantDocument } from './product.interface';

const variantSchema = new Schema<IProductVariantDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variantName: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, index: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    stock: { type: Number, default: 0 },
    unit: { type: String, trim: true },
    weight: { type: Number },
    dimensions: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

variantSchema.index({ product: 1 });
variantSchema.index({ sku: 1 });

export default model<IProductVariantDocument>('ProductVariant', variantSchema);

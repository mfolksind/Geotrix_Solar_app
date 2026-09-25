import { Schema, model } from 'mongoose';
import { IProductVariantDocument } from './product.interface';

const variantSchema = new Schema<IProductVariantDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    shortDescription: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
    sku: { type: String, trim: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    stock: { type: Number, default: 0 },
    unit: { type: String, trim: true, default: 'pcs' },
    availableUnits: [{ type: String, trim: true }],
    unitPrices: [
      {
        unit: { type: String, required: true, trim: true },
        price: { type: Number, required: true },
        discountPrice: { type: Number },
        isDefault: { type: Boolean, default: false },
      },
    ],
    weight: { type: Number },
    dimensions: { type: String },
    relatedSystems: [{ type: Schema.Types.ObjectId, ref: 'ProductVariant' }],
    compatibleProducts: [{ type: Schema.Types.ObjectId, ref: 'ProductVariant' }],
    recommendedProducts: [{ type: Schema.Types.ObjectId, ref: 'ProductVariant' }],
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

variantSchema.index({ product: 1, isDeleted: 1, isDefault: 1 });
variantSchema.index({ sku: 1 });
variantSchema.index({ status: 1 });
variantSchema.index({ price: 1 });
variantSchema.index({ stock: 1 });

// Ensure only one variant per product is the default
variantSchema.pre('save', async function (next) {
  if (this.isModified('isDefault') && this.isDefault) {
    await this.model('ProductVariant').updateMany(
      { product: this.product, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  } else if (this.isNew && !this.isDefault) {
    // If it's the first variant, make it default
    const count = await this.model('ProductVariant').countDocuments({ product: this.product });
    if (count === 0) {
      this.isDefault = true;
    }
  }
  next();
});

export default model<IProductVariantDocument>('ProductVariant', variantSchema);

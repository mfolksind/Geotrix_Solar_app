import { Schema, model } from 'mongoose';
import { ICategoryDocument } from './category.interface';

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
    parentCategory: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    family: { type: Schema.Types.ObjectId, ref: 'Family' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ status: 1 });

const CategoryModel = model<ICategoryDocument>('Category', categorySchema);

export default CategoryModel;

import { Schema, model } from 'mongoose';
import { ICategoryDocument } from './category.interface';

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
    family: { type: Schema.Types.ObjectId, ref: 'Family', index: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    sortOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const CategoryModel = model<ICategoryDocument>('Category', categorySchema);

export default CategoryModel;


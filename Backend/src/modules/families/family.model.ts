import { Schema, model } from 'mongoose';
import { IFamilyDocument } from './family.interface';

const familySchema = new Schema<IFamilyDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, trim: true },
    requiresAdminApproval: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

familySchema.index({ name: 1 }, { unique: true });
familySchema.index({ slug: 1 }, { unique: true });

const FamilyModel = model<IFamilyDocument>('Family', familySchema);

export default FamilyModel;

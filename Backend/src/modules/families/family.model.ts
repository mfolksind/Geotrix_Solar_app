import { Schema, model } from 'mongoose';
import { IFamilyDocument } from './family.interface';

const familySchema = new Schema<IFamilyDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    requiresAdminApproval: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const FamilyModel = model<IFamilyDocument>('Family', familySchema);

export default FamilyModel;


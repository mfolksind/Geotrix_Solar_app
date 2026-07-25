import { Schema, model } from 'mongoose';
import { IAddressDocument } from '../interfaces/address.interface';

const addressSchema = new Schema<IAddressDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true, index: true },
    addressType: { type: String, enum: ['HOME', 'OFFICE', 'OTHER'], default: 'HOME' },
    isDefault: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

addressSchema.index({ user: 1 });
addressSchema.index({ postalCode: 1 });

export default model<IAddressDocument>('Address', addressSchema);

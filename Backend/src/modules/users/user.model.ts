import { Schema, model } from 'mongoose';
import { IUserDocument } from './user.interface';

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    // FIXED: Removed index: true from here. unique: true is all you need.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    phone: { type: String, trim: true },
    profilePicture: { type: String, trim: true },
    provider: { type: String, enum: ['local', 'google', 'facebook', 'apple'], default: 'local' },
    providerId: { type: String, index: true, sparse: true },
    role: { type: String, enum: ['customer', 'user', 'admin', 'seller'], default: 'customer' },
    family: { type: Schema.Types.ObjectId, ref: 'Family' },
    familyApprovalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: null },
    approvedFamilies: [{ type: Schema.Types.ObjectId, ref: 'Family' }],
    isVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_, ret: Record<string, unknown>) {
        if (typeof ret === 'object' && ret !== null) {
          delete (ret as { password?: unknown }).password;
          delete (ret as { __v?: unknown }).__v;
        }
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(_, ret: Record<string, unknown>) {
        if (typeof ret === 'object' && ret !== null) {
          delete (ret as { password?: unknown }).password;
          delete (ret as { __v?: unknown }).__v;
        }
        return ret;
      },
    },
  }
);

// FIXED: Removed the duplicate email index from here.
userSchema.index({ provider: 1, providerId: 1 }, { sparse: true });

const UserModel = model<IUserDocument>('User', userSchema);

export default UserModel;
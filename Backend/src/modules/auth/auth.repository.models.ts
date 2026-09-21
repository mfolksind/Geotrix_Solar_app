import { Schema, model } from 'mongoose';
import { IRefreshTokenDocument, IPasswordResetTokenDocument, IEmailVerificationTokenDocument } from './auth.interface';

const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const passwordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    token: { type: String, required: true, index: true },
    otp: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const emailVerificationTokenSchema = new Schema<IEmailVerificationTokenDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, index: true },
    otp: { type: String, trim: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const RefreshTokenModel = model<IRefreshTokenDocument>('RefreshToken', refreshTokenSchema);
export const PasswordResetTokenModel = model<IPasswordResetTokenDocument>('PasswordResetToken', passwordResetTokenSchema);
export const EmailVerificationTokenModel = model<IEmailVerificationTokenDocument>('EmailVerificationToken', emailVerificationTokenSchema);

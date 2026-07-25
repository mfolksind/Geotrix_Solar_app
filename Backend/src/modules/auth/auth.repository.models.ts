import { Schema, model } from 'mongoose';
import { IRefreshTokenDocument, IPasswordResetTokenDocument, IEmailVerificationTokenDocument } from './auth.interface';

const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const passwordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const emailVerificationTokenSchema = new Schema<IEmailVerificationTokenDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const RefreshTokenModel = model<IRefreshTokenDocument>('RefreshToken', refreshTokenSchema);
export const PasswordResetTokenModel = model<IPasswordResetTokenDocument>('PasswordResetToken', passwordResetTokenSchema);
export const EmailVerificationTokenModel = model<IEmailVerificationTokenDocument>('EmailVerificationToken', emailVerificationTokenSchema);

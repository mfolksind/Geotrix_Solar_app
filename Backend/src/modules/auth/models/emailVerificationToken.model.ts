import { model, Schema, Types } from 'mongoose';
import { IUserDocument } from '../../users/user.interface';

export interface IEmailVerificationTokenDocument {
  user: Types.ObjectId | IUserDocument;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailVerificationTokenSchema = new Schema<IEmailVerificationTokenDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
emailVerificationTokenSchema.index({ user: 1 });
emailVerificationTokenSchema.index({ token: 1 });

export default model<IEmailVerificationTokenDocument>('EmailVerificationToken', emailVerificationTokenSchema);

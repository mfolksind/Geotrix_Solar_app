import { model, Schema, Types } from 'mongoose';
import { IUserDocument } from '../../users/user.interface';

export interface IPasswordResetTokenDocument {
  user: Types.ObjectId | IUserDocument;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
passwordResetTokenSchema.index({ user: 1 });
passwordResetTokenSchema.index({ token: 1 });

export default model<IPasswordResetTokenDocument>('PasswordResetToken', passwordResetTokenSchema);

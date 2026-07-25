import { model, Schema, Types } from 'mongoose';
import { IUserDocument } from '../../users/user.interface';

export interface IRefreshTokenDocument {
  user: Types.ObjectId | IUserDocument;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ token: 1 });

export default model<IRefreshTokenDocument>('RefreshToken', refreshTokenSchema);

import { Document, Types } from 'mongoose';

export interface IRefreshTokenDocument extends Document {
  user: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IPasswordResetTokenDocument extends Document {
  user: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IEmailVerificationTokenDocument extends Document {
  user: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

import { Document, Types } from 'mongoose';

export interface IReviewDocument extends Document {
  product: Types.ObjectId | string;
  user: Types.ObjectId | string;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

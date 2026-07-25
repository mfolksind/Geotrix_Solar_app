import { Document, Types } from 'mongoose';

export type CategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface ICategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: Types.ObjectId | ICategoryDocument | null;
  status: CategoryStatus;
  sortOrder: number;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

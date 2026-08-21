import { Document, Types } from 'mongoose';

export interface IFamilyDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  requiresAdminApproval: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy?: Types.ObjectId | string;
  updatedBy?: Types.ObjectId | string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

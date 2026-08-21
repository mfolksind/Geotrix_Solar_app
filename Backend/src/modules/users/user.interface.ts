import { Document, Types } from 'mongoose';
import { UserProvider, UserRole, UserStatus } from './user.types';

export interface IUser {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  profilePicture?: string;
  provider?: UserProvider;
  providerId?: string;
  role: UserRole;
  family?: Types.ObjectId | string;
  familyApprovalStatus?: 'pending' | 'approved' | 'rejected' | null;
  approvedFamilies: Types.ObjectId[] | string[];
  isVerified: boolean;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}

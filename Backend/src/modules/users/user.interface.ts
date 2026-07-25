import { Document } from 'mongoose';
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
  isVerified: boolean;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}

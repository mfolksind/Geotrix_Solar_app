import { UserProvider, UserRole, UserStatus } from '../users/user.types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  family?: string;
  familySlug?: string;
  source?: 'website' | 'app';
}

export interface RegisterAdminPayload extends RegisterPayload {
  adminKey: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface GoogleLoginPayload {
  idToken: string;
  family?: string;
  familySlug?: string;
  source?: 'website' | 'app';
}

export interface RefreshTokenPayload {
  refreshToken?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  profilePicture?: string;
  provider: UserProvider;
  providerId?: string;
  role: UserRole;
  family?: string;
  familyApprovalStatus?: 'pending' | 'approved' | 'rejected' | null;
  isVerified: boolean;
  status: UserStatus;
}

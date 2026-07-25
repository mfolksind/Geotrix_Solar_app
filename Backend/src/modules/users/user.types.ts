export type UserProvider = 'local' | 'google' | 'facebook' | 'apple';
export type UserRole = 'customer' | 'user' | 'admin' | 'seller';
export type UserStatus = 'active' | 'inactive' | 'blocked';

export interface UserQuery {
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  profilePicture?: string;
}

export interface ChangeStatusPayload {
  status: UserStatus;
}

export type CreateUserPayload = Omit<
  Readonly<{
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
  }>,
  'isVerified' | 'status'
> & {
  isVerified?: boolean;
  status?: UserStatus;
};

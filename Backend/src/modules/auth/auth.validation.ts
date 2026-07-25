import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  password: z.string().trim().min(8, 'Password must be at least 8 characters'),
  phone: z.string().trim().optional(),
});

export const registerAdminSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  password: z.string().trim().min(8, 'Password must be at least 8 characters'),
  phone: z.string().trim().optional(),
  adminKey: z.string().trim().min(1, 'Admin key is required'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  password: z.string().trim().min(8, 'Password must be at least 8 characters'),
});

export const googleLoginSchema = z.object({
  idToken: z.string().trim().min(1, 'Google ID token is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  password: z.string().trim().min(8, 'Password must be at least 8 characters'),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, 'Verification token is required'),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
});

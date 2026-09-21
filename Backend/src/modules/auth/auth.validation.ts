import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .trim()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long'),
  phone: z.string().trim().optional(),
  family: z.string().trim().optional(),
});

export const registerAdminSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .trim()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters long'),
  phone: z.string().trim().optional(),
  adminKey: z.string().trim().min(1, 'Admin key is required'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  password: z.string().trim().min(6, 'Password must be at least 6 characters'),
  adminOnly: z.boolean().optional(),
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

export const verifyOtpSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  otp: z.string().trim().min(4, 'OTP code is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email().optional(),
  otp: z.string().trim().optional(),
  token: z.string().trim().optional(),
  password: z.string().trim().min(6, 'Password must be at least 6 characters'),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(1, 'Verification token or OTP is required'),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
});

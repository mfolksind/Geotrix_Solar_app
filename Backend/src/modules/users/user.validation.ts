import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.string().min(24, 'Invalid user id').max(24, 'Invalid user id'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
  profilePicture: z.string().trim().url().optional(),
  family: z.string().trim().optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'blocked']),
});

export const approveFamilySchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  slug: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  image: z.string().trim().nullable().optional(),
  family: z.string().trim().nullable().optional(),
  sortOrder: z.number().int().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  description: z.string().trim().nullable().optional(),
  image: z.string().trim().nullable().optional(),
  family: z.string().trim().nullable().optional(),
  sortOrder: z.number().int().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});


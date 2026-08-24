import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
  family: z.string().trim().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
  family: z.string().trim().optional(),
  sortOrder: z.number().int().optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

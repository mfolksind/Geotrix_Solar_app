import { z } from 'zod';

export const createReviewSchema = z.object({
  productId: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().optional(),
  comment: z.string().trim().optional(),
  images: z.array(z.string().url()).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().trim().optional(),
  comment: z.string().trim().optional(),
  images: z.array(z.string().url()).optional(),
});

export const idParamSchema = z.object({ id: z.string().trim().min(1) });

export const productIdParamSchema = z.object({ productId: z.string().trim().min(1) });

export const querySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  rating: z.string().optional(),
});

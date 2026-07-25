import { z } from 'zod';

export const addItemSchema = z.object({
  productId: z.string().trim().min(1),
  variantId: z.string().trim().optional(),
  quantity: z.number().int().min(1),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().min(1),
});

export const idParamSchema = z.object({ id: z.string().trim().min(1) });

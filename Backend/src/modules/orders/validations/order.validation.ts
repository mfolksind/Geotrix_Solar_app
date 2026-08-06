import { z } from 'zod';

export const createOrderSchema = z.object({
  addressId: z.string().trim().min(1),
  notes: z.string().trim().optional(),
  items: z.array(z.object({
    variantId: z.string().trim().min(1),
    quantity: z.number().int().positive()
  })).min(1, 'Cart must have at least one item')
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

export const idParamSchema = z.object({ id: z.string().trim().min(1) });

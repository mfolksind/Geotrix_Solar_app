import { z } from 'zod';

export const createOrderSchema = z.object({
  addressId: z.string().trim().min(1),
  notes: z.string().trim().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

export const idParamSchema = z.object({ id: z.string().trim().min(1) });

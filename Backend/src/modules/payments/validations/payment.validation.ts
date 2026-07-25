import { z } from 'zod';

export const createPaymentSchema = z.object({
  orderId: z.string().trim().min(1),
  paymentMethod: z.enum(['COD', 'RAZORPAY', 'STRIPE', 'UPI']),
  amount: z.number().positive(),
  currency: z.string().trim().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const verifyPaymentSchema = z.object({
  transactionId: z.string().trim().min(1),
  providerOrderId: z.string().trim().optional(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']),
  paidAt: z.string().optional(),
  failureReason: z.string().trim().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const refundRequestSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().trim().optional(),
});

export const idParamSchema = z.object({ id: z.string().trim().min(1) });

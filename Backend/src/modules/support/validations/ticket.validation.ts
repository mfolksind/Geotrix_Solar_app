import { z } from 'zod';

export const createTicketSchema = z.object({
  subject: z.string().trim().min(3),
  category: z.string().trim().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  message: z.string().trim().min(1),
});

export const replySchema = z.object({
  message: z.string().trim().min(1),
  isInternalNote: z.boolean().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
});

export const assignSchema = z.object({
  agentId: z.string().trim().min(1),
});

export const idParamSchema = z.object({ id: z.string().trim().min(1) });

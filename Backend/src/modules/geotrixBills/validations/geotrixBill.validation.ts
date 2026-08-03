import { z } from 'zod';

export const attachmentSchema = z.object({ url: z.string().url(), publicId: z.string().optional(), fileName: z.string().optional() });

const attachmentInputSchema = z.union([attachmentSchema, z.string().trim().min(1)]);
const amountInputSchema = z.union([z.number().positive(), z.string().trim().min(1)]);

export const createBillSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  amount: amountInputSchema.optional(),
  monthlyBillAmount: amountInputSchema.optional(),
  monthly_bill_amount: amountInputSchema.optional(),
  customerName: z.string().trim().min(1).optional(),
  customer_name: z.string().trim().min(1).optional(),
  phoneNumber: z.string().trim().min(1).optional(),
  phone_number: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  attachment: attachmentInputSchema.optional(),
  attachments: z.array(attachmentInputSchema).optional(),
  extraAttachment: attachmentInputSchema.optional(),
  extra_attachment: attachmentInputSchema.optional(),
  projectName: z.string().optional(),
  invoiceNumber: z.string().optional(),
  billDate: z.string().optional(),
  dueDate: z.string().optional(),
}).passthrough();

export const updateBillSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  amount: amountInputSchema.optional(),
  monthlyBillAmount: amountInputSchema.optional(),
  monthly_bill_amount: amountInputSchema.optional(),
  customerName: z.string().trim().min(1).optional(),
  customer_name: z.string().trim().min(1).optional(),
  phoneNumber: z.string().trim().min(1).optional(),
  phone_number: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  attachment: attachmentInputSchema.optional(),
  attachments: z.array(attachmentInputSchema).optional(),
  extraAttachment: attachmentInputSchema.optional(),
  extra_attachment: attachmentInputSchema.optional(),
  projectName: z.string().optional(),
  invoiceNumber: z.string().optional(),
  billDate: z.string().optional(),
  dueDate: z.string().optional(),
}).passthrough();



export const idParamSchema = z.object({ id: z.string().trim().min(1) });

export const listQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  project: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.string().optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

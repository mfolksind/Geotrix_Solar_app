import { z } from 'zod';

export const createLeadSchema = z.object({
  fullName: z.string().trim().min(1, 'Full Name is required'),
  propertyType: z.enum(['Residential', 'Commercial', 'Industrial'], {
    errorMap: () => ({ message: 'Invalid property type' }),
  }),
  city: z.string().trim().min(1, 'City is required'),
  pinCode: z.string().trim().min(1, 'PIN Code is required'),
  whatsappNumber: z.string().trim().min(10, 'Whatsapp number must be valid'),
  monthlyBill: z.string().trim().min(1, 'Monthly Bill is required'),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and privacy policy',
  }),
});

export const updateLeadSchema = z.object({
  status: z.enum(['New', 'Contacted', 'Qualified', 'Lost']),
});

export const listLeadsSchema = z.object({
  page: z.preprocess((v) => Number(v), z.number().int().min(1)).optional(),
  limit: z.preprocess((v) => Number(v), z.number().int().min(1)).optional(),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Lost']).optional(),
  search: z.string().trim().optional(),
});

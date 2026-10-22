import { z } from 'zod';

export const createLeadSchema = z.object({
  fullName: z.string().trim().min(1, 'Full Name is required'),
  whatsappNumber: z.string().trim().min(10, 'Whatsapp number must be valid'),
  city: z.string().trim().min(1, 'City is required'),
  pinCode: z.string().trim().optional().default(''),
  inquiryType: z.enum(['solar', 'product']).default('solar'),
  propertyType: z.string().trim().optional(),
  monthlyBill: z.string().trim().optional(),
  product: z
    .object({
      productId: z.string().optional(),
      variantId: z.string().optional(),
      productName: z.string().optional(),
      variantName: z.string().optional(),
      sku: z.string().optional(),
      price: z.number().optional(),
      imageUrl: z.string().optional(),
    })
    .optional(),
  quantity: z.number().int().min(1).optional().default(1),
  message: z.string().trim().optional(),
  agreedToTerms: z.boolean().optional().default(true),
});

export const updateLeadSchema = z.object({
  status: z.enum(['New', 'Contacted', 'Qualified', 'Lost']),
});

export const listLeadsSchema = z.object({
  page: z.preprocess((v) => Number(v), z.number().int().min(1)).optional(),
  limit: z.preprocess((v) => Number(v), z.number().int().min(1)).optional(),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Lost']).optional(),
  inquiryType: z.enum(['solar', 'product']).optional(),
  search: z.string().trim().optional(),
});

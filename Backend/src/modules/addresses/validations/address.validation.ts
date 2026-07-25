import { z } from 'zod';

export const createAddressSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  phone: z.string().trim().min(1, 'Phone is required'),
  addressLine1: z.string().trim().min(1, 'Address line1 is required'),
  addressLine2: z.string().trim().optional(),
  landmark: z.string().trim().optional(),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  country: z.string().trim().min(1, 'Country is required'),
  postalCode: z.string().trim().min(1, 'Postal code is required'),
  addressType: z.enum(['HOME', 'OFFICE', 'OTHER']).optional(),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = z.object({
  fullName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  landmark: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  addressType: z.enum(['HOME', 'OFFICE', 'OTHER']).optional(),
  isDefault: z.boolean().optional(),
});

export const idParamSchema = z.object({ id: z.string().trim().min(1) });

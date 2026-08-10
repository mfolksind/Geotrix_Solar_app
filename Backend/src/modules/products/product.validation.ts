import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  brand: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const createVariantSchema = z.object({
  variantName: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  category: z.string().trim().optional(),
  thumbnail: z.string().trim().optional(),
  isDefault: z.boolean().optional(),
  sku: z.string().trim().optional(),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  unit: z.string().trim().optional(),
  weight: z.number().optional(),
  dimensions: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  relatedSystems: z.array(z.string()).optional(),
  compatibleProducts: z.array(z.string()).optional(),
  recommendedProducts: z.array(z.string()).optional(),
});

export const updateVariantSchema = z.object({
  variantName: z.string().trim().optional(),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  category: z.string().trim().optional().nullable(),
  thumbnail: z.string().trim().optional(),
  isDefault: z.boolean().optional(),
  sku: z.string().trim().optional(),
  price: z.number().positive().optional(),
  discountPrice: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  unit: z.string().trim().optional(),
  weight: z.number().optional(),
  dimensions: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  relatedSystems: z.array(z.string()).optional(),
  compatibleProducts: z.array(z.string()).optional(),
  recommendedProducts: z.array(z.string()).optional(),
});

export const uploadImagesSchema = z.object({
  url: z.string().trim().min(1),
  publicId: z.string().trim().optional(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const listProductsSchema = z.object({
  page: z.preprocess((v) => Number(v), z.number().int().min(1)).optional(),
  limit: z.preprocess((v) => Number(v), z.number().int().min(1)).optional(),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  sort: z.string().trim().optional(),
});

export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface CreateProductPayload {
  name: string;
  family?: string;
  category?: string;
  status?: ProductStatus;
  createdBy?: string;
}

export interface UpdateProductPayload {
  name?: string;
  family?: string;
  category?: string;
  status?: ProductStatus;
  updatedBy?: string;
}

export interface UnitPricePayload {
  unit: string;
  price: number;
  discountPrice?: number;
  isDefault?: boolean;
}

export interface CreateVariantPayload {
  product: string;
  variantName: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;
  isDefault?: boolean;
  sku?: string;
  price: number;
  discountPrice?: number;
  stock?: number;
  unit?: string;
  availableUnits?: string[];
  unitPrices?: UnitPricePayload[];
  weight?: number;
  dimensions?: string;
  status?: ProductStatus;
  relatedSystems?: string[];
  compatibleProducts?: string[];
  recommendedProducts?: string[];
}

export interface UpdateVariantPayload {
  variantName?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;
  isDefault?: boolean;
  sku?: string;
  price?: number;
  discountPrice?: number;
  stock?: number;
  unit?: string;
  availableUnits?: string[];
  unitPrices?: UnitPricePayload[];
  weight?: number;
  dimensions?: string;
  status?: ProductStatus;
  relatedSystems?: string[];
  compatibleProducts?: string[];
  recommendedProducts?: string[];
}

export interface UploadImagePayload {
  variantId: string;
  url: string;
  publicId?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ListProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  family?: string;
  status?: ProductStatus;
  sort?: string; // e.g. 'price:asc' or 'createdAt:desc'
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

import { Document, Types } from 'mongoose';

export interface IProductDocument extends Document {
  name: string;
  brand?: string;
  status: 'ACTIVE' | 'INACTIVE';
  isDeleted: boolean;
  createdBy?: Types.ObjectId | string;
  updatedBy?: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductVariantDocument extends Document {
  product: Types.ObjectId | IProductDocument | string;
  variantName: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  category?: Types.ObjectId | string;
  thumbnail?: string;
  isDefault: boolean;
  sku?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  unit?: string;
  weight?: number;
  dimensions?: string;
  status: 'ACTIVE' | 'INACTIVE';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductImageDocument extends Document {
  variant: Types.ObjectId | IProductVariantDocument | string;
  url: string;
  publicId?: string;
  isPrimary: boolean;
  sortOrder: number;
}

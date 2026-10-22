import { Document } from 'mongoose';

export interface ILeadProductInfo {
  productId?: string;
  variantId?: string;
  productName?: string;
  variantName?: string;
  sku?: string;
  price?: number;
  imageUrl?: string;
}

export interface ILead extends Document {
  fullName: string;
  whatsappNumber: string;
  city: string;
  pinCode?: string;
  propertyType?: string;
  monthlyBill?: string;
  inquiryType: 'solar' | 'product';
  product?: ILeadProductInfo;
  quantity?: number;
  message?: string;
  agreedToTerms: boolean;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
  createdAt: Date;
  updatedAt: Date;
}

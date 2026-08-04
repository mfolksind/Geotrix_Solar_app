import { Document } from 'mongoose';

export interface ILead extends Document {
  fullName: string;
  propertyType: string;
  city: string;
  pinCode: string;
  whatsappNumber: string;
  monthlyBill: string;
  agreedToTerms: boolean;
  status: 'New' | 'Contacted' | 'Qualified' | 'Lost';
  createdAt: Date;
  updatedAt: Date;
}

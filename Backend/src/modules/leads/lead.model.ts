import mongoose, { Schema } from 'mongoose';
import { ILead } from './lead.interface';

const leadSchema = new Schema<ILead>(
  {
    fullName: {
      type: String,
      required: [true, 'Full Name is required'],
      trim: true,
    },
    whatsappNumber: {
      type: String,
      required: [true, 'Whatsapp Number is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    pinCode: {
      type: String,
      trim: true,
      default: '',
    },
    propertyType: {
      type: String,
      trim: true,
    },
    monthlyBill: {
      type: String,
      trim: true,
    },
    inquiryType: {
      type: String,
      enum: ['solar', 'product'],
      default: 'solar',
    },
    product: {
      productId: { type: String, trim: true },
      variantId: { type: String, trim: true },
      productName: { type: String, trim: true },
      variantName: { type: String, trim: true },
      sku: { type: String, trim: true },
      price: { type: Number },
      imageUrl: { type: String, trim: true },
    },
    quantity: {
      type: Number,
      default: 1,
    },
    message: {
      type: String,
      trim: true,
    },
    agreedToTerms: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Lost'],
      default: 'New',
    },
  },
  {
    timestamps: true,
  }
);

export const Lead = mongoose.model<ILead>('Lead', leadSchema);

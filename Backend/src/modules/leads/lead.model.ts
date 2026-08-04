import mongoose, { Schema } from 'mongoose';
import { ILead } from './lead.interface';

const leadSchema = new Schema<ILead>(
  {
    fullName: {
      type: String,
      required: [true, 'Full Name is required'],
      trim: true,
    },
    propertyType: {
      type: String,
      required: [true, 'Property Type is required'],
      enum: ['Residential', 'Commercial', 'Industrial'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    pinCode: {
      type: String,
      required: [true, 'PIN Code is required'],
      trim: true,
    },
    whatsappNumber: {
      type: String,
      required: [true, 'Whatsapp Number is required'],
      trim: true,
    },
    monthlyBill: {
      type: String,
      required: [true, 'Monthly Bill is required'],
      trim: true,
    },
    agreedToTerms: {
      type: Boolean,
      required: [true, 'Must agree to terms'],
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

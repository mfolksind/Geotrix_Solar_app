import { Document, Types } from 'mongoose';
import { AddressType } from '../types/address.types';

export interface IAddressDocument extends Document {
  user: Types.ObjectId | string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressType: AddressType;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

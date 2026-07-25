export type AddressType = 'HOME' | 'OFFICE' | 'OTHER';

export interface CreateAddressPayload {
  user: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressType?: AddressType;
  isDefault?: boolean;
}

export interface UpdateAddressPayload {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  addressType?: AddressType;
  isDefault?: boolean;
}

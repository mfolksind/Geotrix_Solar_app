export interface AddItemPayload {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateItemPayload {
  quantity: number;
}

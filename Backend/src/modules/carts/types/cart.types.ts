export interface AddItemPayload {
  productId: string;
  variantId?: string;
  quantity: number;
  unit?: string;
  selectedUnit?: string;
}

export interface UpdateItemPayload {
  quantity: number;
}


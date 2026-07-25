export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface CreateOrderPayload {
  user: string;
  addressId: string;
  notes?: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}

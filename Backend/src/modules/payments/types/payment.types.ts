export type PaymentMethod = 'COD' | 'RAZORPAY' | 'STRIPE' | 'UPI';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface CreatePaymentPayload {
  orderId: string;
  userId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface VerifyPaymentPayload {
  transactionId: string;
  providerOrderId?: string;
  status: PaymentStatus;
  paidAt?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

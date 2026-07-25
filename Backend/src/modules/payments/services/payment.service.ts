import mongoose from 'mongoose';
import { PaymentRepository } from '../repositories/payment.repository';
import { OrderRepository } from '../../orders/repositories/order.repository';
import { ApiError } from '../../../common/errors/ApiError';
import PaymentModel from '../models/payment.model';
import { CreatePaymentPayload, VerifyPaymentPayload } from '../types/payment.types';

function validateAmount(orderAmount: number, paymentAmount: number) {
  return Math.abs(orderAmount - paymentAmount) < 0.01;
}

export class PaymentService {
  constructor(private readonly repo: PaymentRepository, private readonly orderRepo: OrderRepository) {}

  public async createPayment(payload: CreatePaymentPayload) {
    const order = await this.orderRepo.findById(payload.orderId);
    if (!order) throw new ApiError(404, 'Order not found');

    if (!validateAmount(order.totalAmount, payload.amount)) throw new ApiError(400, 'Payment amount mismatch');

    // prevent duplicate successful payment
    const existingSuccess = await PaymentModel.findOne({ order: payload.orderId, status: 'SUCCESS' }).exec();
    if (existingSuccess) throw new ApiError(400, 'Order already has a successful payment');

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const paymentPayload = {
        order: payload.orderId,
        user: payload.userId,
        paymentMethod: payload.paymentMethod,
        amount: payload.amount,
        currency: payload.currency ?? 'INR',
        metadata: payload.metadata ?? {},
        status: 'PENDING',
      } as const;

      const payment = await this.repo.create(paymentPayload as Partial<typeof paymentPayload>, session);

      await session.commitTransaction();
      session.endSession();
      return payment;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw ApiError.fromUnknown(err);
    }
  }

  public async verifyPayment(payload: VerifyPaymentPayload) {
    const existing = await this.repo.findByTransactionId(payload.transactionId);
    if (!existing) throw new ApiError(404, 'Payment record not found');

    if (existing.status === 'SUCCESS') throw new ApiError(400, 'Payment already successful');

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const updates: Partial<Record<string, unknown>> = {
        transactionId: payload.transactionId,
        providerOrderId: payload.providerOrderId,
        status: payload.status,
        metadata: payload.metadata ?? existing.metadata,
      };
      if (payload.paidAt) updates.paidAt = new Date(payload.paidAt);
      if (payload.failureReason) updates.failureReason = payload.failureReason;

      const updated = await this.repo.updateStatus(existing.id, payload.status, updates as Partial<Record<string, unknown>>, session);

      if (payload.status === 'SUCCESS') {
        // update order paymentStatus
        await this.orderRepo.updateStatus(existing.order.toString(), 'PAID', session as any);
      }

      await session.commitTransaction();
      session.endSession();
      return updated;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw ApiError.fromUnknown(err);
    }
  }

  public async getPayment(id: string) {
    return PaymentModel.findById(id).populate('order').populate('user').exec();
  }

  public async getPaymentsByUser(userId: string) {
    return PaymentModel.find({ user: userId }).sort({ createdAt: -1 }).exec();
  }

  public async retryPayment(id: string) {
    const payment = await PaymentModel.findById(id).exec();
    if (!payment) throw new ApiError(404, 'Payment not found');
    if (payment.status === 'SUCCESS') throw new ApiError(400, 'Cannot retry a successful payment');

    // create a new payment record as retry attempt
    const retry = await this.repo.create({ order: payment.order, user: payment.user, paymentMethod: payment.paymentMethod, amount: payment.amount, currency: payment.currency, metadata: payment.metadata, status: 'PENDING' } as Partial<Record<string, unknown>>);
    return retry;
  }

  public async refundPayment(id: string, amount: number) {
    const payment = await PaymentModel.findById(id).exec();
    if (!payment) throw new ApiError(404, 'Payment not found');
    if (payment.status !== 'SUCCESS') throw new ApiError(400, 'Only successful payments can be refunded');

    // NOTE: actual provider refund integration should happen here; we mark refund locally
    const updated = await this.repo.updateStatus(payment.id, 'REFUNDED', { metadata: { refundedAmount: amount } } as Partial<Record<string, unknown>>);
    // update order paymentStatus
    await this.orderRepo.updateStatus(payment.order.toString(), 'REFUNDED');
    return updated;
  }
}
